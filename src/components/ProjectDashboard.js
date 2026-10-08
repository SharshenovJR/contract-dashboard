import Dashboard from './Dashboard';
import {
  fetchProjectDateStatsPie,
  fetchProjectDateStatsTable,
} from '../api/apiService';

const projectTableColumns = [
  { header: 'Название проекта', accessor: 'name', wide: true },
  { header: 'ОРП', accessor: 'orp' },
];

const category1 = {
  title: 'Проекты по дате завершения',
  fetchPie: fetchProjectDateStatsPie,
  fetchTable: fetchProjectDateStatsTable,
  tableColumns: projectTableColumns,
};

const ProjectDashboard = () => (
  <Dashboard
    title="Статистика проектов"
    subtitle="Завершенные проекты и проекты в работе — в графике и с отставанием"
    category1={category1}
    loadTable1OnInit={false}
    emptyTableOnDeselect1={true}
    rowsPerPage={10}
  />
);

export default ProjectDashboard;
