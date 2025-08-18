import Dashboard from './Dashboard';
import {
  fetchProjectDateStatsPie,
  fetchProjectDateStatsTable,
} from '../api/apiService';

const ProjectDashboard = () => {
  const projectTableColumns = [
    { header: 'Название проекта', accessor: 'name' },
    { header: 'ОРП', accessor: 'orp' },
  ];

  const category1 = {
    title: 'Проекты по дате завершения',
    fetchPie: fetchProjectDateStatsPie,
    fetchTable: fetchProjectDateStatsTable,
    tableColumns: projectTableColumns,
  };

  return (
    <Dashboard
      mainTitle=""
      category1={category1}
      category2={null}
      loadTable1OnInit={false}
      emptyTableOnDeselect1={true}
      rowsPerPage={10}
      hideHeader={true}
    />
  );
};

export default ProjectDashboard;