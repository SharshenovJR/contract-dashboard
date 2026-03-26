import { useEffect, useState, useCallback } from 'react';
import Widget from './Widget';
import PieChartComponent from './PieChartComponent';
import TableComponent from './TableComponent';
import { exportToExcel } from '../utils/exportUtils';
import '../styles/App.css';

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


function Dashboard({
  mainTitle,
  category1,
  category2 = null,
  loadTable1OnInit = true,
  loadTable2OnInit = true,
  emptyTableOnDeselect1 = false,
  emptyTableOnDeselect2 = false,
  rowsPerPage: rowsPerPageProp = 10,
  hideHeader = false,
}) {
  const [pieData1, setPieData1] = useState([]);
  const [tableData1, setTableData1] = useState([]);
  const [selectedCategory1, setSelectedCategory1] = useState(null);
  const [activePieIndex1, setActivePieIndex1] = useState(null);
  const [page1, setPage1] = useState(1);

  const [pieData2, setPieData2] = useState([]);
  const [tableData2, setTableData2] = useState([]);
  const [selectedCategory2, setSelectedCategory2] = useState(null);
  const [activePieIndex2, setActivePieIndex2] = useState(null);
  const [page2, setPage2] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const rowsPerPage = rowsPerPageProp;

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const pie1Promise = category1.fetchPie();
        const table1Promise = loadTable1OnInit ? category1.fetchTable(null) : Promise.resolve([]);

        const pie2Promise = category2 ? category2.fetchPie() : Promise.resolve([]);
        const table2Promise = category2 ? (loadTable2OnInit ? category2.fetchTable(null) : Promise.resolve([])) : Promise.resolve([]);

        const [res1Pie, res1Table, res2Pie, res2Table] = await Promise.all([
          pie1Promise,
          table1Promise,
          pie2Promise,
          table2Promise,
        ]);

        setPieData1(res1Pie || []);
        setTableData1(res1Table || []);
        if (category2) {
          setPieData2(res2Pie || []);
          setTableData2(res2Table || []);
        }

      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError(`Не удалось загрузить данные: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [category1, category1.fetchPie, category1.fetchTable, category2, loadTable1OnInit, loadTable2OnInit]); // Зависимости на функции

   const handleSliceClick1 = useCallback((categoryName, index) => {
       if (selectedCategory1 === categoryName) {
           setSelectedCategory1(null);
           setActivePieIndex1(null);
           if (emptyTableOnDeselect1) {
             setTableData1([]);
           } else {
             category1.fetchTable(null).then(data => setTableData1(data || []));
           }
       } else {
           setSelectedCategory1(categoryName);
           setActivePieIndex1(index);
           category1.fetchTable(categoryName).then(data => setTableData1(data || []));
       }
   }, [selectedCategory1, emptyTableOnDeselect1, category1]);

   const handleSliceClick2 = useCallback((categoryName, index) => {
       if (!category2) return;
       if (selectedCategory2 === categoryName) {
           setSelectedCategory2(null);
           setActivePieIndex2(null);
           if (emptyTableOnDeselect2) {
             setTableData2([]);
           } else {
             category2.fetchTable(null).then(data => setTableData2(data || []));
           }
       } else {
           setSelectedCategory2(categoryName);
           setActivePieIndex2(index);
           category2.fetchTable(categoryName).then(data => setTableData2(data || []));
       }
   }, [selectedCategory2, category2, emptyTableOnDeselect2]);

  useEffect(() => { setPage1(1); }, [tableData1]);
  useEffect(() => { setPage2(1); }, [tableData2]);

  const table1PageCount = Math.ceil(tableData1.length / rowsPerPage);
  const paginatedTable1Data = tableData1.slice((page1 - 1) * rowsPerPage, page1 * rowsPerPage);

  const table2PageCount = Math.ceil(tableData2.length / rowsPerPage);
  const paginatedTable2Data = tableData2.slice((page2 - 1) * rowsPerPage, page2 * rowsPerPage);

  if (loading) {
    return (
      <div className="dashboard-container">
         {!hideHeader && (
           <header className="dashboard-header"><h1>{mainTitle}</h1></header>
         )}
        <div style={{ padding: '20px' }}>Загрузка данных...</div>
      </div>
    );
  }

  if (error) {
    return (
       <div className="dashboard-container">
         {!hideHeader && (
           <header className="dashboard-header"><h1>{mainTitle}</h1></header>
         )}
        <div style={{ padding: '20px', color: 'red' }}>{error}</div>
      </div>
    );
  }
  
  const getTableTitle = (baseTitle, pieData, selectedCategory) => {
    if (!selectedCategory) return `Статистика: ${baseTitle}`;
    const categoryName = pieData.find(d => d.status === selectedCategory)?.name || selectedCategory;
    return `Статистика: ${baseTitle} (${categoryName})`
  }

  const renderExportButtons = (data, columns, filename) => (
    <div className="export-buttons">
      <button 
        className="export-btn excel" 
        onClick={() => exportToExcel(data, columns, filename)}
        title="Экспорт в Excel"
      >
        <span className="export-icon">📊</span> Экспорт в Excel
      </button>
    </div>
  );

  return (
    <div className="dashboard-container">
      {!hideHeader && (
        <header className="dashboard-header">
          <h1>{mainTitle}</h1>
        </header>
      )}
      <div className={`widgets-layout${category2 ? '' : ' widgets-layout--single'}`}>
        <div>
            <Widget title={category1.title}>
                <PieChartComponent data={pieData1} onSliceClick={handleSliceClick1} activeIndex={activePieIndex1}/>
            </Widget>
            <Widget 
                title={getTableTitle(category1.title, pieData1, selectedCategory1)}
                headerActions={renderExportButtons(tableData1, category1.tableColumns, category1.title)}
            >
                <TableComponent data={paginatedTable1Data} columns={category1.tableColumns} />
                <Pagination page={page1} pageCount={table1PageCount} onPageChange={p => setPage1(p)} />
            </Widget>
        </div>

        {category2 && (
          <div>
              <Widget title={category2.title}>
                  <PieChartComponent data={pieData2} onSliceClick={handleSliceClick2} activeIndex={activePieIndex2} />
              </Widget>
               <Widget 
                  title={getTableTitle(category2.title, pieData2, selectedCategory2)}
                  headerActions={renderExportButtons(tableData2, category2.tableColumns, category2.title)}
               >
                  <TableComponent data={paginatedTable2Data} columns={category2.tableColumns} />
                  <Pagination page={page2} pageCount={table2PageCount} onPageChange={p => setPage2(p)} />
              </Widget>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;