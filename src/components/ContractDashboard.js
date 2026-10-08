import Dashboard from './Dashboard';
import {
  fetchDateStatsPie,
  fetchDateStatsTable,
  fetchStatusStatsPie,
  fetchStatusStatsTable
} from '../api/apiService';

const DAY_MS = 24 * 60 * 60 * 1000;

// Отклонение факта от плана в днях: «+» — позже срока, «−» — раньше
const delayDays = (row) => {
  if (!row.planDate || !row.factDate) return null;
  return Math.round((new Date(row.factDate) - new Date(row.planDate)) / DAY_MS);
};

const formatDelay = (row) => {
  const days = delayDays(row);
  if (days === null) return '';
  if (days === 0) return '0';
  return days > 0 ? `+${days}` : `−${Math.abs(days)}`;
};

const delayTone = (row) => {
  const days = delayDays(row);
  if (!days) return '';
  return days > 0 ? 'text-danger' : 'text-success';
};

const dateTableColumns = [
  { header: 'Номер контракта', accessor: 'number' },
  { header: 'Описание контракта', accessor: 'description', wide: true, clamp: true },
  { header: 'План дата завершения', accessor: 'planDate', date: true },
  { header: 'Факт дата завершения', accessor: 'factDate', date: true },
  { header: 'Отклонение, дн.', accessor: 'delayDays', numeric: true, value: formatDelay, tone: delayTone },
  { header: 'Статус завершения', accessor: 'status', status: true },
];

const statusTableColumns = [
  { header: 'Номер контракта', accessor: 'number' },
  { header: 'Статус контракта', accessor: 'status', status: true },
];

const category1 = {
  title: 'Контракты по сроку завершения',
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

const ContractDashboard = () => (
  <Dashboard
    title="Статистика контрактов"
    subtitle="Завершение контрактов относительно плановой даты и текущее состояние"
    category1={category1}
    category2={category2}
  />
);

export default ContractDashboard;
