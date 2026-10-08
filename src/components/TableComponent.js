export const formatDate = (value) => {
  if (!value) return '—';
  const [y, m, d] = String(value).slice(0, 10).split('-');
  return y && m && d ? `${d}.${m}.${y}` : value;
};

// Значение ячейки: вычисляемое (col.value), дата или как есть
export const cellValue = (row, col) => {
  if (col.value) return col.value(row);
  const value = row[col.accessor];
  if (col.date) return formatDate(value);
  return typeof value === 'string' ? value.trim() : value;
};

const TableComponent = ({ data, columns, statusColor, emptyText = 'Нет данных для отображения.' }) => {
  if (!data || data.length === 0) {
    return <p className="empty-state">{emptyText}</p>;
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index} className={col.numeric ? 'numeric' : ''}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex}>
              {columns.map((col, colIndex) => {
                const value = cellValue(row, col);
                const empty = value === null || value === undefined || value === '';
                if (col.status && !empty) {
                  return (
                    <td key={colIndex}>
                      <span
                        className="status-pill"
                        style={statusColor ? { color: statusColor, backgroundColor: `${statusColor}1f` } : undefined}
                      >
                        {value}
                      </span>
                    </td>
                  );
                }
                return (
                  <td
                    key={colIndex}
                    className={[
                      col.numeric && 'numeric',
                      col.date && 'nowrap',
                      col.wide && 'wide',
                      colIndex === 0 && 'first-col',
                      col.tone && col.tone(row),
                    ].filter(Boolean).join(' ')}
                  >
                    {col.clamp && !empty
                      ? <span className="clamp" title={value}>{value}</span>
                      : (empty ? '—' : value)}
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

export default TableComponent;
