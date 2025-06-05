import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';

const CustomLegend = ({ payload }) => {
  return (
    <ul className="chart-legend" style={{
      display: 'flex',
      gap: '32px',
      alignItems: 'center',
      justifyContent: 'flex-start',
      listStyle: 'none',
      margin: 0,
      padding: 0,
      fontSize: '1.08rem',
      fontWeight: 500
    }}>
      {payload.map((entry, index) => (
        <li key={`legend-${index}`} style={{
          color: entry.color,
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.2s',
          cursor: 'pointer',
        }}>
          <span className="legend-color" style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: entry.color,
            marginRight: 8,
            border: '2px solid #fff',
            boxShadow: '0 0 2px #aaa',
          }}></span>
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

const PieChartComponent = ({ data, onSliceClick, activeIndex }) => {
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const radius = outerRadius + 10;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill={data[index].color} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderActiveShape = (props) => {
    const {
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill
    } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };


  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                onClick={() => onSliceClick(entry.status, index)}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value, name, props) => [`${value}`, name]} />
           <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartComponent;