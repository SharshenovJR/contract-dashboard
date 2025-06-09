import { useEffect, useState, useCallback } from 'react';
import Widget from './components/Widget';
import PieChartComponent from './components/PieChartComponent';
import TableComponent from './components/TableComponent';
import {
  fetchDateStatsPie,
  fetchDateStatsTable,
  fetchStatusStatsPie,
  fetchStatusStatsTable
} from './api/apiService';
import './styles/App.css';

const Pagination = ({ page, pageCount, onPageChange }) => {
  if (pageCount <= 1) return null;
  let pages = [];
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) pages.push(i);
  } else {
    if (page <= 4) {
      pages = [1, 2, 3, 4, 5, '...', pageCount];
    } else if (page >= pageCount - 3) {
      pages = [1, '...', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
    } else {
      pages = [1, '...', page - 1, page, page + 1, '...', pageCount];
    }
  }

  pages = pages.filter((item, idx, arr) => item === '...' || arr.indexOf(item) === idx);

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >Назад</button>
      {pages.map((p, idx) =>
        p === '...'
          ? <span key={'ellipsis-' + idx} className="pagination-btn disabled" style={{ pointerEvents: 'none', background: '#fff', border: 'none' }}>...</span>
          : <button
              key={p + '-' + idx}
              className={`pagination-btn${p === page ? ' active' : ''}`}
              onClick={() => onPageChange(p)}
              disabled={p === page}
            >{p}</button>
      )}
      <button
        className="pagination-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page === pageCount}
      >Вперед</button>
    </div>
  );
};

function App() {
  const [datePieData, setDatePieData] = useState([]);
  const [statusPieData, setStatusPieData] = useState([]);

  const [dateTableData, setDateTableData] = useState([]);
  const [statusTableData, setStatusTableData] = useState([]);

  const [selectedDateCategory, setSelectedDateCategory] = useState(null);
  const [activeDatePieIndex, setActiveDatePieIndex] = useState(null);
  const [selectedStatusCategory, setSelectedStatusCategory] = useState(null);
  const [activeStatusPieIndex, setActiveStatusPieIndex] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [datePage, setDatePage] = useState(1);
  const [dateRowsPerPage] = useState(10);

  const [statusPage, setStatusPage] = useState(1);
  const [statusRowsPerPage] = useState(10);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          datePie,
          dateTable,
          statusPie,
          statusTable
        ] = await Promise.all([
          fetchDateStatsPie(),
          fetchDateStatsTable(null),
          fetchStatusStatsPie(),
          fetchStatusStatsTable(null),
        ]);

        setDatePieData(datePie || []);
        setDateTableData(dateTable || []);
        setStatusPieData(statusPie || []);
        setStatusTableData(statusTable || []);

      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError(`Не удалось загрузить данные: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

   const handleDateSliceClick = useCallback((categoryName, index) => {
       if (selectedDateCategory === categoryName) {
           setSelectedDateCategory(null);
           setActiveDatePieIndex(null);
           fetchDateStatsTable(null).then(data => setDateTableData(data || []));
       } else {
           setSelectedDateCategory(categoryName);
           setActiveDatePieIndex(index);
           fetchDateStatsTable(categoryName).then(data => setDateTableData(data || []));
       }
   }, [selectedDateCategory]);

   const handleStatusSliceClick = useCallback((categoryName, index) => {
       if (selectedStatusCategory === categoryName) {
           setSelectedStatusCategory(null);
           setActiveStatusPieIndex(null);
           fetchStatusStatsTable(null).then(data => setStatusTableData(data || []));
       } else {
           setSelectedStatusCategory(categoryName);
           setActiveStatusPieIndex(index);
           fetchStatusStatsTable(categoryName).then(data => setStatusTableData(data || []));
       }
   }, [selectedStatusCategory]);

  const dateTableColumns = [
    { header: 'Номер контракта', accessor: 'number' },
    { header: 'Описание контракта', accessor: 'description' },
    { header: 'План дата завершения', accessor: 'planDate' },
    { header: 'Факт дата завершения', accessor: 'factDate' },
    { header: 'Статус завершения', accessor: 'status' },
  ];

  const statusTableColumns = [
    { header: 'Номер контракта', accessor: 'number' },
    { header: 'Статус контракта', accessor: 'status' },
  ];

  useEffect(() => {
    setDatePage(1);
  }, [dateTableData]);
  useEffect(() => {
    setStatusPage(1);
  }, [statusTableData]);

  const dateTablePageCount = Math.ceil(dateTableData.length / dateRowsPerPage);
  const paginatedDateTableData = dateTableData.slice(
    (datePage - 1) * dateRowsPerPage,
    datePage * dateRowsPerPage
  );

  const statusTablePageCount = Math.ceil(statusTableData.length / statusRowsPerPage);
  const paginatedStatusTableData = statusTableData.slice(
    (statusPage - 1) * statusRowsPerPage,
    statusPage * statusRowsPerPage
  );

  if (loading) {
    return (
      <div className="dashboard-container">
         <header className="dashboard-header">
            <h1>Статистика контрактов</h1>
         </header>
        <div style={{ padding: '20px' }}>Загрузка данных...</div>
      </div>
    );
  }

  if (error) {
    return (
       <div className="dashboard-container">
         <header className="dashboard-header">
            <h1>Статистика контрактов</h1>
         </header>
        <div style={{ padding: '20px', color: 'red' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="widgets-layout">
        <div>
            <Widget title="Контракты по дате">
                <PieChartComponent
                   data={datePieData}
                   onSliceClick={handleDateSliceClick}
                   activeIndex={activeDatePieIndex}
                />
            </Widget>
            <Widget title={`Статистика контрактов по дате${selectedDateCategory ? `: ${datePieData.find(d => d.status === selectedDateCategory)?.name || selectedDateCategory}` : ''}`}>
                <TableComponent data={paginatedDateTableData} columns={dateTableColumns} />
                <Pagination
                  page={datePage}
                  pageCount={dateTablePageCount}
                  onPageChange={p => setDatePage(p)}
                />
            </Widget>
        </div>

        <div>
            <Widget title="Контракты по статусу">
                <PieChartComponent
                   data={statusPieData}
                   onSliceClick={handleStatusSliceClick}
                   activeIndex={activeStatusPieIndex}
                />
            </Widget>
             <Widget title={`Статистика контрактов по статусу${selectedStatusCategory ? `: ${statusPieData.find(d => d.status === selectedStatusCategory)?.name || selectedStatusCategory}` : ''}`}>
                <TableComponent data={paginatedStatusTableData} columns={statusTableColumns} />
                <Pagination
                  page={statusPage}
                  pageCount={statusTablePageCount}
                  onPageChange={p => setStatusPage(p)}
                />
            </Widget>
        </div>
      </div>
    </div>
  );
}

export default App;