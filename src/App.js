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
      <header className="dashboard-header">
          <h1>Статистика контрактов</h1>
      </header>

      <div className="widgets-layout">
        <div>
            <Widget title="Контракты по дате">
                <PieChartComponent
                   data={datePieData}
                   onSliceClick={handleDateSliceClick}
                   activeIndex={activeDatePieIndex}
                />
            </Widget>
            <Widget title={`Статистика контрактов по дате${selectedDateCategory ? `: ${selectedDateCategory}` : ''}`}>
                <TableComponent data={dateTableData} columns={dateTableColumns} />
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
             <Widget title={`Статистика контрактов по статусу${selectedStatusCategory ? `: ${selectedStatusCategory}` : ''}`}>
                <TableComponent data={statusTableData} columns={statusTableColumns} />
            </Widget>
        </div>
      </div>
    </div>
  );
}

export default App;