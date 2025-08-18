import Dashboard from './Dashboard';
import {
  fetchDateStatsPie,
  fetchDateStatsTable,
  fetchStatusStatsPie,
  fetchStatusStatsTable
} from '../api/apiService';

const ContractDashboard = () => {
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

  const category1 = {
    title: 'Контракты по дате',
    fetchPie: fetchDateStatsPie,
    fetchTable: fetchDateStatsTable,
    tableColumns: dateTableColumns,
  };

  const category2 = {
    title: 'Контракты по статусу',
    fetchPie: fetchStatusStatsPie,
    fetchTable: fetchStatusStatsTable,
    tableColumns: statusTableColumns,
  };

  return (
    <Dashboard
      mainTitle="Статистика контрактов"
      category1={category1}
      category2={category2}
    />
  );
};

export default ContractDashboard;