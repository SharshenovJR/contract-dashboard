import { useEffect, useMemo, useRef, useState } from 'react';
import Widget from './Widget';
import PieChartComponent from './PieChartComponent';
import TableComponent, { cellValue } from './TableComponent';
import { exportToExcel } from '../utils/exportUtils';
import '../styles/App.css';

const formatNumber = (value) => Number(value || 0).toLocaleString('ru-RU');

const Pagination = ({ page, pageCount, onPageChange }) => {
  if (pageCount <= 1) return null;
  let pages = [];
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) pages.push(i);
  } else if (page <= 4) {
    pages = [1, 2, 3, 4, 5, '...', pageCount];
  } else if (page >= pageCount - 3) {
    pages = [1, '...', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  } else {
    pages = [1, '...', page - 1, page, page + 1, '...', pageCount];
  }

  return (
    <div className="pagination">
      <button className="pagination-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1}>‹ Назад</button>
      {pages.map((p, idx) =>
        p === '...'
          ? <span key={'ellipsis-' + idx} className="pagination-ellipsis">…</span>
          : <button
              key={p}
              className={`pagination-btn${p === page ? ' active' : ''}`}
              onClick={() => onPageChange(p)}
              disabled={p === page}
            >{p}</button>
      )}
      <button className="pagination-btn" onClick={() => onPageChange(page + 1)} disabled={page === pageCount}>Вперед ›</button>
    </div>
  );
};

// Плитки категорий: служат и легендой диаграммы, и фильтром таблицы
const CategoryTiles = ({ data, total, selected, onSelect }) => (
  <div className="stat-tiles">
    <button
      className={`stat-tile stat-tile--total${selected ? '' : ' active'}`}
      onClick={() => selected && onSelect(selected)}
    >
      <div className="stat-tile-label">Всего</div>
      <div className="stat-tile-value">{formatNumber(total)}</div>
      <div className="stat-tile-share"><span style={{ width: '100%' }} /></div>
    </button>
    {data.map((d, index) => {
      const percent = total ? Math.round((d.value / total) * 100) : 0;
      return (
        <button
          key={d.status}
          className={`stat-tile${selected === d.status ? ' active' : ''}${selected && selected !== d.status ? ' dimmed' : ''}`}
          style={{ '--tile-color': d.color }}
          onClick={() => onSelect(d.status, index)}
          title="Показать список"
        >
          <div className="stat-tile-label">
            <span className="legend-color" style={{ backgroundColor: d.color }} />
            {d.name}
          </div>
          <div className="stat-tile-value">
            {formatNumber(d.value)}
            <span className="stat-tile-percent">{percent}%</span>
          </div>
          <div className="stat-tile-share"><span style={{ width: `${percent}%` }} /></div>
        </button>
      );
    })}
  </div>
);

// Один блок статистики: плитки, диаграмма и таблица по выбранной категории
const CategorySection = ({ category, loadTableOnInit, emptyTableOnDeselect, rowsPerPage }) => {
  const [pieData, setPieData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [selected, setSelected] = useState(null);
  // Категория, к которой относятся строки, уже показанные в таблице
  const [tableCategory, setTableCategory] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      category.fetchPie(),
      loadTableOnInit ? category.fetchTable(null) : Promise.resolve([]),
    ])
      .then(([pie, table]) => {
        if (cancelled) return;
        setPieData(pie || []);
        setTableData(table || []);
      })
      .catch((err) => { if (!cancelled) setError(`Не удалось загрузить данные: ${err.message}`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category, loadTableOnInit]);

  const loadTable = (categoryName) => {
    const requestId = ++requestRef.current;
    setTableLoading(true);
    setError(null);
    category.fetchTable(categoryName)
      .then((data) => {
        if (requestId !== requestRef.current) return;
        setTableData(data || []);
        setTableCategory(categoryName);
      })
      .catch((err) => { if (requestId === requestRef.current) setError(`Не удалось загрузить список: ${err.message}`); })
      .finally(() => { if (requestId === requestRef.current) setTableLoading(false); });
  };

  const handleSelect = (categoryName, index) => {
    setSearch('');
    setPage(1);
    if (selected === categoryName) {
      setSelected(null);
      setActiveIndex(null);
      if (emptyTableOnDeselect) {
        requestRef.current++;
        setTableData([]);
        setTableCategory(null);
        setTableLoading(false);
      } else {
        loadTable(null);
      }
    } else {
      setSelected(categoryName);
      setActiveIndex(index ?? pieData.findIndex((d) => d.status === categoryName));
      loadTable(categoryName);
    }
  };

  const total = pieData.reduce((sum, d) => sum + (d.value || 0), 0);
  const selectedEntry = pieData.find((d) => d.status === selected);
  const tableEntry = pieData.find((d) => d.status === tableCategory);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tableData;
    return tableData.filter((row) => category.tableColumns.some((col) =>
      String(cellValue(row, col) ?? '').toLowerCase().includes(query)));
  }, [tableData, search, category.tableColumns]);

  useEffect(() => { setPage(1); }, [filteredRows]);

  const pageCount = Math.ceil(filteredRows.length / rowsPerPage);
  const pageRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleExport = () => {
    const rows = filteredRows.map((row) => Object.fromEntries(
      category.tableColumns.map((col) => [col.accessor, cellValue(row, col)])
    ));
    const suffix = selectedEntry ? ` - ${selectedEntry.name}` : '';
    exportToExcel(rows, category.tableColumns, `${category.title}${suffix}`);
  };

  if (loading) {
    return <div className="stat-section"><div className="loader"><span className="spinner" /> Загрузка данных…</div></div>;
  }

  if (error && !pieData.length) {
    return <div className="stat-section"><div className="error-box">{error}</div></div>;
  }

  const emptyText = search.trim()
    ? 'Ничего не найдено.'
    : (selected ? 'В этой категории нет записей.' : 'Выберите категорию на диаграмме или в плитках выше, чтобы увидеть список.');

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{category.title}</h2>
      <CategoryTiles data={pieData} total={total} selected={selected} onSelect={handleSelect} />

      <div className="stat-grid">
        <Widget title="Распределение">
          <PieChartComponent data={pieData} onSliceClick={handleSelect} activeIndex={activeIndex} />
          <p className="chart-hint">Нажмите на сектор, чтобы отфильтровать список</p>
        </Widget>

        <Widget
          title={(
            <>
              Список
              {selectedEntry && (
                <span className="filter-chip" style={{ '--chip-color': selectedEntry.color }}>
                  <span className="filter-chip-dot" />
                  {selectedEntry.name}
                  <button onClick={() => handleSelect(selected)} title="Сбросить фильтр" aria-label="Сбросить фильтр">×</button>
                </span>
              )}
              {tableData.length > 0 && (
                <span className="badge">
                  {search.trim() ? `${filteredRows.length} из ${tableData.length}` : formatNumber(tableData.length)}
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
                disabled={!tableData.length}
              />
              <button
                className="export-btn excel"
                onClick={handleExport}
                disabled={tableLoading || !filteredRows.length}
                title="Экспорт в Excel"
              >
                <span className="export-icon">📊</span> Excel
              </button>
            </>
          )}
        >
          {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}
          {/* Пока грузится новый список, старый остается на месте (без скачков высоты) */}
          <div className={`table-area${tableLoading ? ' is-loading' : ''}`} aria-busy={tableLoading}>
            <TableComponent
              data={pageRows}
              columns={category.tableColumns}
              statusColor={tableEntry?.color}
              emptyText={tableLoading ? '' : emptyText}
            />
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
            {tableLoading && (
              <div className="table-area-overlay"><span className="spinner" /> Загрузка списка…</div>
            )}
          </div>
        </Widget>
      </div>
    </section>
  );
};

function Dashboard({
  title,
  subtitle,
  category1,
  category2 = null,
  loadTable1OnInit = true,
  loadTable2OnInit = true,
  emptyTableOnDeselect1 = false,
  emptyTableOnDeselect2 = false,
  rowsPerPage = 10,
}) {
  return (
    <div className="dashboard-container">
      {title && (
        <div className="activity-toolbar">
          <div>
            <h2 className="activity-title">{title}</h2>
            {subtitle && <p className="activity-subtitle">{subtitle}</p>}
          </div>
        </div>
      )}
      <CategorySection
        category={category1}
        loadTableOnInit={loadTable1OnInit}
        emptyTableOnDeselect={emptyTableOnDeselect1}
        rowsPerPage={rowsPerPage}
      />
      {category2 && (
        <CategorySection
          category={category2}
          loadTableOnInit={loadTable2OnInit}
          emptyTableOnDeselect={emptyTableOnDeselect2}
          rowsPerPage={rowsPerPage}
        />
      )}
    </div>
  );
}

export default Dashboard;
