import { useEffect, useMemo, useState } from 'react';
import Widget from './Widget';
import { exportToExcel } from '../utils/exportUtils';
import {
  fetchOrpActivity,
  fetchProjectActivity,
  fetchCuratorActivity,
} from '../api/apiService';
import '../styles/App.css';

const DAY_MS = 24 * 60 * 60 * 1000;

// LocalDateTime приходит строкой ISO или массивом [y, m, d, h, mi, s]
const parseDate = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [y, m = 1, d = 1, h = 0, mi = 0, s = 0] = value;
    return new Date(y, m - 1, d, h, mi, s);
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const daysSince = (value) => {
  const date = parseDate(value);
  if (!date) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / DAY_MS));
};

const formatDate = (value) => {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const freshnessClass = (days) => {
  if (days === null) return 'freshness--never';
  if (days <= 7) return 'freshness--ok';
  if (days <= 30) return 'freshness--warn';
  return 'freshness--bad';
};

const freshnessLabel = (days) => {
  if (days === null) return 'никогда';
  if (days === 0) return 'сегодня';
  return `${days} дн. назад`;
};

// Ячейка с датой и «светофором» давности
const DateCell = ({ value }) => {
  const days = daysSince(value);
  return (
    <div className="date-cell">
      <span className={`freshness ${freshnessClass(days)}`}>{freshnessLabel(days)}</span>
      <span className="date-cell-value">{formatDate(value)}</span>
    </div>
  );
};

const TABS = {
  orp: {
    title: 'ОРП',
    subtitle: 'Заливки данных, отчеты и входы органов реализации проектов',
    fetch: fetchOrpActivity,
    searchKeys: ['name', 'type'],
    defaultSort: { key: 'lastUpload', dir: 'desc' },
    columns: [
      { header: 'ОРП', accessor: 'name' },
      { header: 'Тип', accessor: 'type' },
      { header: 'Проектов', accessor: 'projectCount', numeric: true, hint: 'Проекты этого ОРП, без архивных.' },
      { header: 'Последняя заливка', accessor: 'lastUpload', date: true, hint: 'Когда пользователь ОРП последний раз создал или изменил данные в своих проектах. Заливка — запись проекта, компонента, контракта, освоения, баланса или бюджета, созданная или измененная пользователем ОРП (в т.ч. через API).' },
      { header: 'Дней с заливками (30 дн.)', accessor: 'uploadDays30', numeric: true, hint: 'В скольких разных днях за последние 30 дней были заливки. Показывает регулярность: 1 — всё залили за один день, 20 — работают почти ежедневно.' },
      { header: 'Записей залито (30 дн.)', accessor: 'records30', numeric: true, hint: 'Сколько записей создано или изменено за последние 30 дней. Показывает объем работы.' },
      { header: 'Последний отчет', accessor: 'lastReport', date: true, hint: 'Дата последней отправки квартального или месячного отчета по любому проекту ОРП.' },
      { header: 'Отчетов (90 дн.)', accessor: 'reports90', numeric: true, hint: 'Сколько отчетов (квартальных и месячных) отправлено за последние 90 дней.' },
      { header: 'Входов (30 дн.)', accessor: 'logins30', numeric: true, hint: 'Сколько раз все пользователи ОРП входили в систему за последние 30 дней.' },
      { header: 'Дней со входом (30 дн.)', accessor: 'loginDays30', numeric: true, hint: 'В скольких разных днях за 30 дней был хотя бы один вход. 10 входов в один день = 1 день.' },
      { header: 'Последняя активность', accessor: 'lastActive', date: true, hint: 'Когда кто-то из пользователей ОРП последний раз был в системе.' },
      { header: 'Пользователей', accessor: 'userCount', numeric: true, hint: 'Сколько учетных записей привязано к ОРП.' },
    ],
    kpis: (rows) => [
      { label: 'Всего ОРП', icon: '🏢', value: rows.length },
      { label: 'Заливали за 7 дней', hint: 'ОРП, у которых последняя заливка была не раньше 7 дней назад. Процент — от всех ОРП.', icon: '⬆', tone: 'good', share: true, value: rows.filter((r) => (daysSince(r.lastUpload) ?? Infinity) <= 7).length },
      { label: 'Без заливок > 30 дней', hint: 'Последняя заливка была больше 30 дней назад или ее не было вообще. Процент — от общего числа.', icon: '⏳', alert: true, share: true, value: rows.filter((r) => (daysSince(r.lastUpload) ?? Infinity) > 30).length },
      { label: 'Отчетов за 90 дней', hint: 'Сумма отправленных квартальных и месячных отчетов за последние 90 дней.', icon: '📄', value: rows.reduce((sum, r) => sum + (r.reports90 || 0), 0) },
    ],
  },
  projects: {
    title: 'Проекты',
    subtitle: 'Когда и сколько заливали по проектам, кто их просматривал',
    fetch: fetchProjectActivity,
    searchKeys: ['code', 'name', 'orp', 'curator'],
    defaultSort: { key: 'lastUpload', dir: 'desc' },
    columns: [
      { header: 'Код', accessor: 'code' },
      { header: 'Проект', accessor: 'name', wide: true },
      { header: 'ОРП', accessor: 'orp' },
      { header: 'Куратор', accessor: 'curator' },
      { header: 'Последняя заливка', accessor: 'lastUpload', date: true, hint: 'Когда ОРП последний раз создал или изменил данные проекта. Заливка — запись проекта, компонента, контракта, освоения, баланса или бюджета, созданная или измененная пользователем ОРП (в т.ч. через API).' },
      { header: 'Дней с заливками (30 дн.)', accessor: 'uploadDays30', numeric: true, hint: 'В скольких разных днях за последние 30 дней были заливки по проекту.' },
      { header: 'Записей (30 дн.)', accessor: 'records30', numeric: true, hint: 'Сколько записей проекта создано или изменено ОРП за последние 30 дней.' },
      { header: 'Записей всего', accessor: 'recordsTotal', numeric: true, hint: 'Сколько записей проекта создано или изменено ОРП за все время.' },
      { header: 'Последний отчет', accessor: 'lastReport', date: true, hint: 'Дата последней отправки квартального или месячного отчета по проекту.' },
      { header: 'Отчетов (90 дн.)', accessor: 'reports90', numeric: true, hint: 'Сколько отчетов по проекту отправлено за последние 90 дней.' },
      { header: 'Отчетов всего', accessor: 'reportsTotal', numeric: true, hint: 'Сколько отчетов по проекту отправлено за все время.' },
      { header: 'Просмотров (30 дн.)', accessor: 'views30', numeric: true, hint: 'Сколько раз за 30 дней кто-либо открывал проект или его отчеты.' },
      { header: 'Смотрели (30 дн.), чел.', accessor: 'viewers30', numeric: true, hint: 'Сколько разных людей открывали проект или его отчеты за 30 дней.' },
      { header: 'Просмотров куратором (30 дн.)', accessor: 'curatorViews30', numeric: true, hint: 'Сколько раз за 30 дней проект или его отчеты открывал куратор этого проекта.' },
      { header: 'Последний просмотр', accessor: 'lastView', date: true, hint: 'Когда проект или его отчет последний раз открывал кто-либо.' },
      { header: 'Последний просмотр куратором', accessor: 'lastCuratorView', date: true, hint: 'Когда проект или его отчет последний раз открывал куратор проекта.' },
    ],
    kpis: (rows) => [
      { label: 'Всего проектов', icon: '📁', value: rows.length },
      { label: 'Обновлялись за 7 дней', hint: 'Проекты, по которым ОРП заливал данные за последние 7 дней.', icon: '⬆', tone: 'good', share: true, value: rows.filter((r) => (daysSince(r.lastUpload) ?? Infinity) <= 7).length },
      { label: 'Без заливок > 30 дней', hint: 'Последняя заливка была больше 30 дней назад или ее не было вообще. Процент — от общего числа.', icon: '⏳', alert: true, share: true, value: rows.filter((r) => (daysSince(r.lastUpload) ?? Infinity) > 30).length },
      { label: 'Ни разу не заливали', hint: 'По проекту нет ни одной записи, созданной или измененной пользователем ОРП.', icon: '∅', alert: true, share: true, value: rows.filter((r) => !r.lastUpload).length },
      { label: 'Куратор не открывал > 30 дней', hint: 'Проекты с назначенным куратором, которые он не открывал (ни проект, ни отчеты) больше 30 дней.', icon: '👁', alert: true, share: true, value: rows.filter((r) => r.curator && (daysSince(r.lastCuratorView) ?? Infinity) > 30).length },
    ],
  },
  curators: {
    title: 'Кураторы',
    subtitle: 'Входы, просмотры отчетов и смены статусов кураторами',
    fetch: fetchCuratorActivity,
    searchKeys: ['name', 'login'],
    defaultSort: { key: 'lastActive', dir: 'desc' },
    columns: [
      { header: 'Куратор', accessor: 'name' },
      { header: 'Логин', accessor: 'login' },
      { header: 'Проектов', accessor: 'projectCount', numeric: true, hint: 'Сколько проектов закреплено за куратором, без архивных.' },
      { header: 'Последняя активность', accessor: 'lastActive', date: true, hint: 'Когда куратор последний раз был в системе.' },
      { header: 'Последний вход', accessor: 'lastLogin', date: true, hint: 'Дата последнего входа в систему по журналу.' },
      { header: 'Входов (30 дн.)', accessor: 'logins30', numeric: true, hint: 'Сколько раз куратор входил в систему за последние 30 дней.' },
      { header: 'Дней со входом (30 дн.)', accessor: 'loginDays30', numeric: true, hint: 'В скольких разных днях за 30 дней был хотя бы один вход.' },
      { header: 'Отчетов просмотрено (30 дн.)', accessor: 'reportsViewed30', numeric: true, hint: 'Сколько разных отчетов куратор открыл за последние 30 дней.' },
      { header: 'Просмотров отчетов всего', accessor: 'viewsTotal', numeric: true, hint: 'Сколько раз куратор открывал отчеты за все время (повторные открытия тоже считаются).' },
      { header: 'Последний просмотр отчета', accessor: 'lastView', date: true, hint: 'Когда куратор последний раз открывал отчет.' },
      { header: 'Проектов открыто (30 дн.)', accessor: 'projectsViewed30', numeric: true, hint: 'Сколько разных проектов куратор открыл за последние 30 дней.' },
      { header: 'Последний просмотр проекта', accessor: 'lastProjectView', date: true, hint: 'Когда куратор последний раз открывал проект.' },
      { header: 'Ждут рассмотрения', accessor: 'pendingReports', numeric: true, alertIfPositive: true, hint: 'Отчеты по проектам куратора, которые сейчас в статусе «на рассмотрении» и ждут его решения.' },
      { header: 'Смен статуса (30 дн.)', accessor: 'statusChanges30', numeric: true, hint: 'Сколько раз куратор менял статус отчетов за последние 30 дней.' },
      { header: 'Отчетов обработано (30 дн.)', accessor: 'reportsProcessed30', numeric: true, hint: 'В скольких разных отчетах куратор менял статус за 30 дней. Отклонил, а потом принял один отчет = 2 смены статуса, но 1 обработанный отчет.' },
      { header: 'Смен статуса всего', accessor: 'statusChangesTotal', numeric: true, hint: 'Сколько раз куратор менял статус отчетов за все время.' },
      { header: 'Последняя смена статуса', accessor: 'lastStatusChange', date: true, hint: 'Когда куратор последний раз менял статус отчета.' },
    ],
    kpis: (rows) => [
      { label: 'Кураторов', icon: '👤', value: rows.length },
      { label: 'Активны за 7 дней', hint: 'Кураторы, которые были в системе за последние 7 дней.', icon: '✓', tone: 'good', share: true, value: rows.filter((r) => (daysSince(r.lastActive) ?? Infinity) <= 7).length },
      { label: 'Отчетов просмотрено за 30 дней', hint: 'Сумма разных отчетов, открытых кураторами за последние 30 дней.', icon: '👁', value: rows.reduce((sum, r) => sum + (r.reportsViewed30 || 0), 0) },
      { label: 'Отчетов ждут рассмотрения', hint: 'Сколько отчетов сейчас в статусе «на рассмотрении» по всем кураторам.', icon: '⏳', alert: true, value: rows.reduce((sum, r) => sum + (r.pendingReports || 0), 0) },
      { label: 'Смен статуса за 30 дней', hint: 'Сколько раз кураторы меняли статус отчетов за последние 30 дней.', icon: '⇄', value: rows.reduce((sum, r) => sum + (r.statusChanges30 || 0), 0) },
    ],
  },
};

const compareValues = (a, b, column) => {
  if (column.date) {
    const ta = parseDate(a)?.getTime() ?? null;
    const tb = parseDate(b)?.getTime() ?? null;
    if (ta === tb) return 0;
    if (ta === null) return -1;
    if (tb === null) return 1;
    return ta - tb;
  }
  if (column.numeric) return (a || 0) - (b || 0);
  return String(a || '').localeCompare(String(b || ''), 'ru');
};

// Значок ⓘ с всплывающей подсказкой
const Hint = ({ text }) => {
  const [pos, setPos] = useState(null);
  if (!text) return null;

  const show = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = 280;
    const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 8);
    const below = rect.bottom + 8;
    setPos({ left, top: below, width });
  };

  return (
    <span
      className="hint"
      tabIndex={0}
      aria-label={text}
      onMouseEnter={show}
      onFocus={show}
      onMouseLeave={() => setPos(null)}
      onBlur={() => setPos(null)}
      onClick={(e) => e.stopPropagation()}
    >
      i
      {pos && (
        <span className="hint-bubble" role="tooltip" style={{ left: pos.left, top: pos.top, width: pos.width }}>
          {text}
        </span>
      )}
    </span>
  );
};

const ActivityTable = ({ rows, columns, sort, onSort }) => {
  if (!rows.length) return <p className="empty-state">Ничего не найдено.</p>;

  return (
    <div className="table-container activity-table">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.accessor}
                className={`sortable${col.numeric ? ' numeric' : ''}${sort.key === col.accessor ? ' sorted' : ''}`}
                onClick={() => onSort(col.accessor)}
                title="Сортировать"
              >
                {col.header}
                <Hint text={col.hint} />
                <span className="sort-indicator">
                  {sort.key === col.accessor ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col, colIndex) => {
                const value = row[col.accessor];
                if (col.date) {
                  return <td key={col.accessor}><DateCell value={value} /></td>;
                }
                const alert = col.alertIfPositive && value > 0;
                return (
                  <td
                    key={col.accessor}
                    className={[
                      col.numeric && 'numeric',
                      col.wide && 'wide',
                      colIndex === 0 && 'first-col',
                      col.numeric && !value && 'zero',
                      alert && 'cell-alert',
                    ].filter(Boolean).join(' ')}
                  >
                    {value ?? '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const KpiTile = ({ kpi, total, loading }) => {
  const tone = kpi.alert && kpi.value > 0 ? 'alert' : kpi.tone;
  const percent = kpi.share && total ? Math.round((kpi.value / total) * 100) : null;
  return (
    <div className={`kpi-tile${tone ? ` kpi-tile--${tone}` : ''}`}>
      <div className="kpi-icon" aria-hidden="true">{kpi.icon}</div>
      <div className="kpi-body">
        <div className="kpi-value">{loading ? <span className="skeleton" /> : kpi.value}</div>
        <div className="kpi-label">
          {kpi.label}
          <Hint text={kpi.hint} />
          {!loading && percent !== null && ` · ${percent}%`}
        </div>
        {!loading && percent !== null && (
          <div className="kpi-share"><span style={{ width: `${percent}%` }} /></div>
        )}
      </div>
    </div>
  );
};

const FreshnessLegend = () => (
  <div className="activity-legend">
    <span>Давность:</span>
    <span className="freshness freshness--ok">до 7 дней</span>
    <span className="freshness freshness--warn">8–30 дней</span>
    <span className="freshness freshness--bad">больше 30 дней</span>
    <span className="freshness freshness--never">никогда</span>
  </div>
);

const ActivityDashboard = () => {
  const [activeTab, setActiveTab] = useState('orp');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sorts, setSorts] = useState(() =>
    Object.fromEntries(Object.entries(TABS).map(([key, tab]) => [key, tab.defaultSort]))
  );

  const tab = TABS[activeTab];
  const sort = sorts[activeTab];

  useEffect(() => {
    if (data[activeTab]) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    TABS[activeTab].fetch()
      .then((rows) => { if (!cancelled) setData((prev) => ({ ...prev, [activeTab]: rows || [] })); })
      .catch((err) => { if (!cancelled) setError(`Не удалось загрузить данные: ${err.message}`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, data]);

  const rows = useMemo(() => data[activeTab] || [], [data, activeTab]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? rows.filter((row) => tab.searchKeys.some((key) => String(row[key] || '').toLowerCase().includes(query)))
      : rows;
    const column = tab.columns.find((col) => col.accessor === sort.key);
    if (!column) return filtered;
    const sign = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => sign * compareValues(a[sort.key], b[sort.key], column));
  }, [rows, search, sort, tab]);

  const handleSort = (key) => {
    setSorts((prev) => {
      const current = prev[activeTab];
      const column = tab.columns.find((col) => col.accessor === key);
      const dir = current.key === key
        ? (current.dir === 'asc' ? 'desc' : 'asc')
        : (column.date || column.numeric ? 'desc' : 'asc');
      return { ...prev, [activeTab]: { key, dir } };
    });
  };

  const handleRefresh = () => {
    setData((prev) => {
      const next = { ...prev };
      delete next[activeTab];
      return next;
    });
  };

  const handleExport = () => {
    const exportRows = visibleRows.map((row) => Object.fromEntries(
      tab.columns.map((col) => [col.accessor, col.date ? formatDate(row[col.accessor]) : row[col.accessor]])
    ));
    exportToExcel(exportRows, tab.columns, `Активность - ${tab.title}`);
  };

  return (
    <div className="dashboard-container activity-dashboard">
      <div className="activity-toolbar">
        <div>
          <h2 className="activity-title">Мониторинг активности</h2>
          <p className="activity-subtitle">{tab.subtitle}</p>
        </div>
        <div className="activity-tabs" role="tablist">
          {Object.entries(TABS).map(([key, t]) => (
            <button
              key={key}
              role="tab"
              aria-selected={key === activeTab}
              className={`activity-tab${key === activeTab ? ' active' : ''}`}
              onClick={() => { setActiveTab(key); setSearch(''); }}
            >
              {t.title}
              {data[key] && <span className="activity-tab-count">{data[key].length}</span>}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="activity-error">{error}</div>}

      {!error && (
        <>
          <div className="kpi-row">
            {tab.kpis(rows).map((kpi) => (
              <KpiTile key={kpi.label} kpi={kpi} total={rows.length} loading={loading} />
            ))}
          </div>

          <Widget
            title={(
              <>
                Активность: {tab.title}
                {!loading && (
                  <span className="badge">
                    {search.trim() ? `${visibleRows.length} из ${rows.length}` : rows.length}
                  </span>
                )}
              </>
            )}
            headerActions={(
              <>
                <input
                  className="activity-search"
                  type="search"
                  placeholder="Поиск…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="export-btn refresh" onClick={handleRefresh} disabled={loading} title="Обновить">⟳ Обновить</button>
                <button className="export-btn excel" onClick={handleExport} disabled={loading || !visibleRows.length} title="Экспорт в Excel">
                  <span className="export-icon">📊</span> Экспорт в Excel
                </button>
              </>
            )}
          >
            <FreshnessLegend />
            {loading
              ? <div className="loader"><span className="spinner" /> Загрузка данных…</div>
              : <ActivityTable rows={visibleRows} columns={tab.columns} sort={sort} onSort={handleSort} />}
            <details className="activity-help">
              <summary>Как считаются показатели</summary>
              <dl>
                <dt>Заливка</dt>
                <dd>
                  Запись проекта, компонента, контракта, освоения, баланса или годового бюджета, созданная или
                  измененная пользователем ОРП, в т.ч. через API. Правки куратора или администратора не считаются.
                  Учитывается последний, кто изменял запись.
                </dd>
                <dt>Отчет</dt>
                <dd>Квартальный или месячный отчет, отправленный на рассмотрение (по дате отправки).</dd>
                <dt>Входы и просмотры</dt>
                <dd>
                  Берутся из журнала, который ведется с момента обновления системы, поэтому за более ранний период
                  данных нет — там будут нули и «никогда».
                </dd>
                <dt>Смена статуса</dt>
                <dd>По истории изменений квартальных и месячных отчетов: принят, отклонен, на доработку и т.п.</dd>
                <dt>«Дней с …» и «Записей / Входов …»</dt>
                <dd>
                  Первое — регулярность (в скольких разных днях было действие), второе — объем (сколько всего).
                  Например, 50 записей за 1 день: записей 50, дней 1.
                </dd>
                <dt>Периоды</dt>
                <dd>«30 дн.» и «90 дн.» — считая от сегодняшней даты назад.</dd>
              </dl>
            </details>
          </Widget>
        </>
      )}
    </div>
  );
};

export default ActivityDashboard;
