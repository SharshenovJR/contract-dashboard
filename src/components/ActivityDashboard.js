import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Widget from './Widget';
import ActivityTrend from './ActivityTrend';
import OneLine, { useBubble, Bubble } from './OneLine';
import {
  fetchOrpActivity,
  fetchProjectActivity,
  fetchCuratorActivity,
  fetchDailyActivity,
  ACTIVITY_MOCK,
} from '../api/apiService';
import '../styles/App.css';

const DAY_MS = 24 * 60 * 60 * 1000;

// Линейные иконки (24×24, цвет — currentColor)
const ICONS = {
  check: <path d="M20 6 9 17l-5-5" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
  empty: <><circle cx="12" cy="12" r="9" /><path d="m5.6 18.4 12.8-12.8" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>,
  pulse: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  refresh: <><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 4v5h-5" /></>,
  building: <><path d="M3 21h18" /><path d="M5 21V9l7-5 7 5v12" /><path d="M9 21v-6h6v6" /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
};

const Icon = ({ name, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {ICONS[name]}
  </svg>
);

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

const formatDate = (value, withTime = false) => {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

const freshnessLabel = (days) => {
  if (days === null) return 'никогда';
  if (days === 0) return 'сегодня';
  return `${days} дн. назад`;
};

// Ячейка с датой и «светофором» давности; время — в подсказке
// Дата; время и давность — при наведении
const DateCell = ({ value }) => {
  const tip = parseDate(value) ? `${formatDate(value, true)} · ${freshnessLabel(daysSince(value))}` : 'Нет данных';
  return <OneLine className="date-cell" tip={tip}>{formatDate(value)}</OneLine>;
};

// Активные — вносили данные (кураторы — открывали проекты) не раньше ACTIVE_DAYS дней назад
const ACTIVE_DAYS = 30;
const within = (value, days) => (daysSince(value) ?? Infinity) <= days;

const TABS = {
  orp: {
    title: 'ОРП',
    icon: 'building',
    subtitle: 'Как органы реализации проектов вносят данные и работают в системе',
    fetch: fetchOrpActivity,
    isActive: (r) => within(r.lastUpload, ACTIVE_DAYS),
    activeTitle: 'Активные ОРП',
    passiveTitle: 'Пассивные ОРП',
    defaultSort: { key: 'lastUpload', dir: 'desc' },
    columns: [
      { header: 'ОРП', accessor: 'name', text: true },
      { header: 'Проектов', accessor: 'projectCount', numeric: true, hint: 'Проекты этого ОРП.' },
      { header: 'Последнее внесение данных', accessor: 'lastUpload', date: true, hint: 'Когда сотрудники ОРП последний раз добавляли или исправляли сведения по своим проектам: сам проект, компоненты, контракты, освоение средств, баланс или бюджет. Считаются и данные, переданные автоматически из их системы.' },
      { header: 'Последняя активность', accessor: 'lastActive', date: true, hint: 'Когда кто-то из пользователей ОРП последний раз был в системе.' },
      { header: 'Польз.', accessor: 'userCount', numeric: true, hint: 'Сколько учетных записей привязано к ОРП.' },
    ],
    trends: [
      { title: 'ОРП, вносившие данные', hint: 'Сколько разных ОРП добавляли или исправляли сведения по проектам в этот день.', series: [{ key: 'activeOrps' }] },
      { title: 'Отправлено отчетов', hint: 'Сколько квартальных и месячных отчетов отправлено на рассмотрение в этот день.', series: [{ key: 'quarterlyReports', name: 'Кварт.' }, { key: 'monthlyReports', name: 'Мес.' }] },
    ],
    kpis: (rows) => [
      { label: 'Активные ОРП', hint: `ОРП, которые вносили данные по проектам за последние ${ACTIVE_DAYS} дней.`, icon: 'check', tone: 'good', value: rows.filter((r) => within(r.lastUpload, ACTIVE_DAYS)).length },
      { label: 'Пассивные ОРП', hint: `Не вносили данные больше ${ACTIVE_DAYS} дней или ни разу.`, icon: 'clock', alert: true, value: rows.filter((r) => !within(r.lastUpload, ACTIVE_DAYS)).length },
      { label: 'Вносили данные за 7 дней', hint: 'ОРП, которые вносили данные по проектам за последние 7 дней.', icon: 'upload', tone: 'good', value: rows.filter((r) => within(r.lastUpload, 7)).length },
      { label: 'Ни разу не вносили данные', hint: 'Сотрудники ОРП ни разу не добавляли и не исправляли сведения по своим проектам.', icon: 'empty', alert: true, value: rows.filter((r) => !r.lastUpload).length },
    ],
  },
  projects: {
    title: 'Проекты',
    icon: 'folder',
    subtitle: 'Когда по проектам вносили данные и сдавали отчеты, кто их просматривал',
    fetch: fetchProjectActivity,
    isActive: (r) => within(r.lastUpload, ACTIVE_DAYS),
    activeTitle: 'Активные проекты',
    passiveTitle: 'Пассивные проекты',
    defaultSort: { key: 'lastUpload', dir: 'desc' },
    columns: [
      { header: 'Проект', accessor: 'name', text: true, wide: true },
      { header: 'ОРП', accessor: 'orp', text: true },
      { header: 'Куратор', accessor: 'curator', text: true },
      { header: 'Последнее внесение данных', accessor: 'lastUpload', date: true, hint: 'Когда сотрудники ОРП последний раз добавляли или исправляли сведения по проекту: сам проект, компоненты, контракты, освоение средств, баланс или бюджет. Считаются и данные, переданные автоматически из их системы.' },
      { group: 'Отчетов за 90 дн.', header: 'Кварт.', accessor: 'quarterlyReports90', numeric: true, hint: 'Сколько квартальных отчетов по проекту отправлено за последние 90 дней.' },
      { group: 'Отчетов за 90 дн.', header: 'Мес.', accessor: 'monthlyReports90', numeric: true, hint: 'Сколько месячных отчетов по проекту отправлено за последние 90 дней.' },
      { header: 'Последний просмотр', accessor: 'lastView', date: true, hint: 'Когда проект или его отчет последний раз открывал кто-либо.' },
    ],
    trends: [
      { title: 'Проекты, по которым вносили данные', hint: 'По скольким разным проектам ОРП добавляли или исправляли сведения в этот день.', series: [{ key: 'activeProjects' }] },
      { title: 'Просмотров проектов и отчетов', hint: 'Сколько раз в этот день открывали проекты и их отчеты.', series: [{ key: 'views' }] },
    ],
    kpis: (rows) => [
      { label: 'Активные проекты', hint: `Проекты, по которым ОРП вносил данные за последние ${ACTIVE_DAYS} дней.`, icon: 'check', tone: 'good', value: rows.filter((r) => within(r.lastUpload, ACTIVE_DAYS)).length },
      { label: 'Пассивные проекты', hint: `По проекту не вносили данные больше ${ACTIVE_DAYS} дней или ни разу.`, icon: 'clock', alert: true, value: rows.filter((r) => !within(r.lastUpload, ACTIVE_DAYS)).length },
      { label: 'Ни разу не вносили данные', hint: 'Сотрудники ОРП ни разу не добавляли и не исправляли сведения по этому проекту.', icon: 'empty', alert: true, value: rows.filter((r) => !r.lastUpload).length },
      { label: 'Куратор не открывал > 30 дней', hint: 'Проекты с назначенным куратором, которые он не открывал (ни проект, ни отчеты) больше 30 дней. Процент — от всех проектов.', icon: 'eye', alert: true, value: rows.filter((r) => r.curator && !within(r.lastCuratorView, 30)).length },
    ],
  },
  curators: {
    title: 'Кураторы',
    icon: 'user',
    subtitle: 'Активность кураторов: просмотры и рассмотрение отчетов',
    fetch: fetchCuratorActivity,
    // Активность куратора — по открытию проектов, а не по входу в систему
    isActive: (r) => within(r.lastProjectView, ACTIVE_DAYS),
    activeTitle: 'Активные кураторы',
    passiveTitle: 'Пассивные кураторы',
    defaultSort: { key: 'lastProjectView', dir: 'desc' },
    columns: [
      { header: 'Куратор', accessor: 'name', text: true },
      { header: 'Проектов', accessor: 'projectCount', numeric: true, hint: 'Сколько проектов закреплено за куратором.' },
      { header: 'Последняя активность', accessor: 'lastActive', date: true, hint: 'Когда куратор последний раз был в системе.' },
      { header: 'Просмотров отчетов всего', accessor: 'viewsTotal', numeric: true, hint: 'Сколько раз куратор открывал отчеты за все время (повторные открытия тоже считаются).' },
      { header: 'Проектов открыто (30 дн.)', accessor: 'projectsViewed30', numeric: true, hint: 'Сколько разных проектов куратор открыл за последние 30 дней.' },
      { header: 'Последний просмотр проекта', accessor: 'lastProjectView', date: true, hint: 'Когда куратор последний раз открывал проект.' },
      { group: 'Ждут рассмотрения', header: 'Кварт.', accessor: 'pendingQuarterly', numeric: true, alertIfPositive: true, hint: 'Квартальные отчеты по проектам куратора, которые сейчас в статусе «на рассмотрении».' },
      { group: 'Ждут рассмотрения', header: 'Мес.', accessor: 'pendingMonthly', numeric: true, alertIfPositive: true, hint: 'Месячные отчеты по проектам куратора, которые сейчас в статусе «на рассмотрении».' },
      { group: 'Обработано (30 дн.)', header: 'Кварт.', accessor: 'processedQuarterly30', numeric: true, hint: 'Сколько квартальных отчетов куратор проверил за 30 дней: принял, отклонил или вернул на доработку.' },
      { group: 'Обработано (30 дн.)', header: 'Мес.', accessor: 'processedMonthly30', numeric: true, hint: 'Сколько месячных отчетов куратор проверил за 30 дней: принял, отклонил или вернул на доработку.' },
    ],
    trends: [
      { title: 'Кураторов заходило', hint: 'Сколько разных кураторов входили в систему в этот день.', series: [{ key: 'activeCurators' }] },
      { title: 'Проверено отчетов кураторами', hint: 'Сколько раз за день кураторы проверили отчет и вынесли решение: приняли, отклонили или вернули на доработку.', series: [{ key: 'statusChanges' }] },
    ],
    kpis: (rows) => [
      { label: 'Активные кураторы', hint: `Кураторы, которые открывали проекты за последние ${ACTIVE_DAYS} дней.`, icon: 'check', tone: 'good', value: rows.filter((r) => within(r.lastProjectView, ACTIVE_DAYS)).length },
      { label: 'Пассивные кураторы', hint: `Не открывали проекты больше ${ACTIVE_DAYS} дней или ни разу.`, icon: 'clock', alert: true, value: rows.filter((r) => !within(r.lastProjectView, ACTIVE_DAYS)).length },
      { label: 'Открывали проекты за 7 дней', hint: 'Кураторы, которые открывали проекты за последние 7 дней.', icon: 'eye', tone: 'good', value: rows.filter((r) => within(r.lastProjectView, 7)).length },
      { label: 'С отчетами на рассмотрении', hint: 'Кураторы, у которых есть квартальные или месячные отчеты в статусе «на рассмотрении».', icon: 'doc', alert: true, value: rows.filter((r) => (r.pendingQuarterly || 0) + (r.pendingMonthly || 0) > 0).length },
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
  const [pos, show, hide] = useBubble(280);
  if (!text) return null;

  return (
    <span
      className="hint"
      tabIndex={0}
      aria-label={text}
      onMouseEnter={show}
      onFocus={show}
      onMouseLeave={hide}
      onBlur={hide}
      onClick={(e) => e.stopPropagation()}
    >
      i
      <Bubble pos={pos}>{text}</Bubble>
    </span>
  );
};

const HeaderCell = ({ col, sort, onSort, rowSpan }) => (
  <th
    rowSpan={rowSpan}
    className={`sortable${col.numeric ? ' numeric' : ''}${col.date ? ' date' : ''}${sort.key === col.accessor ? ' sorted' : ''}`}
    onClick={() => onSort(col.accessor)}
  >
    <span className="th-inner">
      <span className="th-label">{col.header}</span>
      <Hint text={col.hint} />
      <span className="sort-indicator">
        {sort.key === col.accessor ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
      </span>
    </span>
  </th>
);

// Шапка в две строки, если у колонок есть группы (например «Отчетов всего: Кварт. / Мес.»)
const TableHead = ({ columns, sort, onSort }) => {
  if (!columns.some((col) => col.group)) {
    return (
      <thead>
        <tr>
          <th className="row-num">№</th>
          {columns.map((col) => <HeaderCell key={col.accessor} col={col} sort={sort} onSort={onSort} />)}
        </tr>
      </thead>
    );
  }

  const top = [];
  columns.forEach((col) => {
    const last = top[top.length - 1];
    if (col.group && last?.group === col.group) last.span += 1;
    else top.push({ group: col.group, col, span: 1 });
  });

  return (
    <thead>
      <tr>
        <th className="row-num" rowSpan={2}>№</th>
        {top.map(({ group, col, span }) => (group
          ? <th key={group} colSpan={span} className="group-header">{group}</th>
          : <HeaderCell key={col.accessor} col={col} sort={sort} onSort={onSort} rowSpan={2} />))}
      </tr>
      <tr>
        {columns.filter((col) => col.group).map((col) => (
          <HeaderCell key={col.accessor} col={col} sort={sort} onSort={onSort} />
        ))}
      </tr>
    </thead>
  );
};

// Сколько строк видно в таблице; остальные — прокруткой внутри таблицы
const VISIBLE_ROWS = 10;

const ActivityTable = ({ rows, columns, sort, onSort }) => {
  const boxRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState(null);

  // Высота = шапка + первые VISIBLE_ROWS строк (шапка бывает в одну или две строки)
  useLayoutEffect(() => {
    const table = boxRef.current?.querySelector('table');
    if (!table || table.tBodies[0].rows.length <= VISIBLE_ROWS) {
      setMaxHeight(null);
      return;
    }
    const bodyRows = Array.from(table.tBodies[0].rows).slice(0, VISIBLE_ROWS);
    const border = boxRef.current.offsetHeight - boxRef.current.clientHeight;
    setMaxHeight(table.tHead.offsetHeight + bodyRows.reduce((sum, row) => sum + row.offsetHeight, 0) + border);
  }, [rows, columns]);

  if (!rows.length) return <p className="empty-state">Нет записей.</p>;

  return (
    <div className="table-container activity-table" ref={boxRef} style={maxHeight ? { maxHeight } : undefined}>
      <table>
        <TableHead columns={columns} sort={sort} onSort={onSort} />
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id}>
              <td className="row-num">{rowIndex + 1}</td>
              {columns.map((col, colIndex) => {
                const value = row[col.accessor];
                if (col.date) {
                  return (
                    <td key={col.accessor}>
                      <DateCell value={value} />
                    </td>
                  );
                }
                const alert = col.alertIfPositive && value > 0;
                return (
                  <td
                    key={col.accessor}
                    className={[
                      col.numeric && 'numeric',
                      col.text && 'text',
                      col.wide && 'wide',
                      colIndex === 0 && 'first-col',
                      col.numeric && !value && 'zero',
                      alert && 'cell-alert',
                    ].filter(Boolean).join(' ')}
                  >
                    {col.text ? <OneLine className="cell-text">{value ?? '—'}</OneLine> : (value ?? '—')}
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

// Главное в плитке — процент от общего числа, количество — подписью
const KpiTile = ({ kpi, total, loading }) => {
  const tone = kpi.alert && kpi.value > 0 ? 'alert' : kpi.tone;
  const percent = total ? Math.round((kpi.value / total) * 100) : 0;
  return (
    <div className={`kpi-tile${tone ? ` kpi-tile--${tone}` : ''}`}>
      <div className="kpi-head">
        <span className="kpi-icon"><Icon name={kpi.icon} /></span>
        <OneLine className="kpi-label">{kpi.label}</OneLine>
        <Hint text={kpi.hint} />
      </div>
      <div className="kpi-value">
        {loading ? <span className="skeleton" /> : <>{percent}<span className="kpi-percent">%</span></>}
      </div>
      <OneLine as="div" className="kpi-count">{loading ? '\u00a0' : `${kpi.value} из ${total}`}</OneLine>
      <div className="kpi-share"><span style={{ width: loading ? 0 : `${percent}%` }} /></div>
    </div>
  );
};

const ActivityDashboard = () => {
  // Вкладку можно открыть ссылкой: activity.html#projects
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.slice(1);
    return TABS[hash] ? hash : 'orp';
  });

  useEffect(() => {
    window.history.replaceState(null, '', `#${activeTab}`);
  }, [activeTab]);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sorts, setSorts] = useState(() =>
    Object.fromEntries(Object.entries(TABS).map(([key, tab]) => [key, tab.defaultSort]))
  );

  const [loadedAt, setLoadedAt] = useState(null);
  const [trendDays, setTrendDays] = useState(7);
  const [daily, setDaily] = useState({});
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState(null);

  const tab = TABS[activeTab];
  const sort = sorts[activeTab];

  useEffect(() => {
    if (daily[trendDays]) return;
    let cancelled = false;
    setTrendLoading(true);
    setTrendError(null);
    fetchDailyActivity(trendDays)
      .then((rows) => { if (!cancelled) setDaily((prev) => ({ ...prev, [trendDays]: rows || [] })); })
      .catch((err) => { if (!cancelled) setTrendError(`Не удалось загрузить динамику: ${err.message}`); })
      .finally(() => { if (!cancelled) setTrendLoading(false); });
    return () => { cancelled = true; };
  }, [trendDays, daily]);

  useEffect(() => {
    if (data[activeTab]) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    TABS[activeTab].fetch()
      .then((rows) => {
        if (cancelled) return;
        setData((prev) => ({ ...prev, [activeTab]: rows || [] }));
        setLoadedAt(new Date());
      })
      .catch((err) => { if (!cancelled) setError(`Не удалось загрузить данные: ${err.message}`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, data]);

  const rows = useMemo(() => data[activeTab] || [], [data, activeTab]);

  const sortedRows = useMemo(() => {
    const column = tab.columns.find((col) => col.accessor === sort.key);
    if (!column) return rows;
    const sign = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => sign * compareValues(a[sort.key], b[sort.key], column));
  }, [rows, sort, tab]);

  const [activeRows, passiveRows] = useMemo(() => [
    sortedRows.filter((row) => tab.isActive(row)),
    sortedRows.filter((row) => !tab.isActive(row)),
  ], [sortedRows, tab]);

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
    setDaily({});
  };

  const parts = [
    { key: 'active', title: tab.activeTitle, rows: activeRows, tone: 'good', note: `активность за последние ${ACTIVE_DAYS} дней` },
    { key: 'passive', title: tab.passiveTitle, rows: passiveRows, tone: 'alert', note: `нет активности больше ${ACTIVE_DAYS} дней` },
  ];

  return (
    <div className="dashboard-container activity-dashboard">
      <header className="ad-hero">
        <div className="ad-hero-main">
          <span className="ad-hero-mark"><Icon name="pulse" size={26} /></span>
          <div className="ad-hero-text">
            <OneLine as="p" className="ad-hero-eyebrow">Аналитическая панель</OneLine>
            <OneLine as="h1" className="ad-hero-title">Мониторинг активности</OneLine>
            <OneLine as="p" className="ad-hero-subtitle">{tab.subtitle}</OneLine>
          </div>
        </div>
        <div className="ad-hero-side">
          {ACTIVITY_MOCK && <span className="ad-demo-pill">Демонстрационные данные</span>}
          <OneLine className="ad-hero-stamp">
            {loadedAt ? `Данные на ${formatDate(loadedAt, true)}` : 'Загрузка данных…'}
          </OneLine>
          <button className="ad-refresh" onClick={handleRefresh} disabled={loading}>
            <Icon name="refresh" size={16} /> Обновить
          </button>
        </div>
        <nav className="ad-tabs" role="tablist">
          {Object.entries(TABS).map(([key, t]) => (
            <button
              key={key}
              role="tab"
              aria-selected={key === activeTab}
              className={`ad-tab${key === activeTab ? ' active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon name={t.icon} size={16} />
              {t.title}
              {data[key] && <span className="ad-tab-count">{data[key].length}</span>}
            </button>
          ))}
        </nav>
      </header>

      {error && <div className="activity-error">{error}</div>}

      {!error && (
        <>
          <div className="kpi-row">
            {tab.kpis(rows).map((kpi) => (
              <KpiTile key={kpi.label} kpi={kpi} total={rows.length} loading={loading} />
            ))}
          </div>

          <Widget
            title={<OneLine>Динамика по дням</OneLine>}
            headerActions={(
              <div className="period-switch" role="group" aria-label="Период">
                {[7, 30].map((days) => (
                  <button
                    key={days}
                    className={`period-switch-btn${days === trendDays ? ' active' : ''}`}
                    aria-pressed={days === trendDays}
                    onClick={() => setTrendDays(days)}
                  >
                    {days} дней
                  </button>
                ))}
              </div>
            )}
          >
            <ActivityTrend
              charts={tab.trends}
              rows={daily[trendDays]}
              days={trendDays}
              loading={trendLoading}
              error={trendError}
            />
          </Widget>

          <Widget
            title={(
              <>
                <OneLine>{tab.title}: активные и пассивные</OneLine>
                {!loading && <span className="badge">{rows.length}</span>}
              </>
            )}
          >
            {loading
              ? <div className="loader"><span className="spinner" /> Загрузка данных…</div>
              : (
                <div className="activity-split activity-split--columns">
                  {parts.map((part) => (
                    <section key={part.key} className={`ad-panel ad-panel--${part.tone}`}>
                      <header className="ad-panel-header">
                        <OneLine as="h4" className="ad-panel-title">{part.title}</OneLine>
                        <span className="ad-panel-count">{part.rows.length}</span>
                        <OneLine className="ad-panel-note">
                          {`${rows.length ? `${Math.round((part.rows.length / rows.length) * 100)}% · ` : ''}${part.note}`}
                        </OneLine>
                      </header>
                      <ActivityTable rows={part.rows} columns={tab.columns} sort={sort} onSort={handleSort} />
                    </section>
                  ))}
                </div>
              )}
            <details className="activity-help">
              <summary>Как считаются показатели</summary>
              <dl>
                <dt>Внесение данных</dt>
                <dd>
                  Сотрудник ОРП добавил или исправил сведения по проекту: сам проект, компоненты, контракты, освоение средств, баланс или бюджет.
                  Считаются и данные, переданные автоматически из системы ОРП. Правки куратора или администратора
                  не считаются.
                </dd>
                <dt>Активные и пассивные</dt>
                <dd>
                  ОРП и проекты — активные, если вносили данные за последние {ACTIVE_DAYS} дней, кураторы — если
                  открывали проекты за последние {ACTIVE_DAYS} дней (вход в систему без открытия проекта не считается). Остальные — пассивные. Проценты в плитках
                  сверху — от общего числа на вкладке.
                </dd>
                <dt>Отчет</dt>
                <dd>
                  Квартальный («Кварт.») или месячный («Мес.») отчет, отправленный на рассмотрение (по дате отправки).
                </dd>
                <dt>Входы и просмотры</dt>
                <dd>
                  Берутся из журнала, который ведется с момента обновления системы, поэтому за более ранний период
                  данных нет — там будут нули и «никогда».
                </dd>
                <dt>Проверка отчета</dt>
                <dd>Каждое решение куратора по квартальному или месячному отчету: принял, отклонил или вернул на доработку. Если отчет сначала вернули, а потом приняли — это две проверки.</dd>
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
