import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';

const CustomLegend = ({ payload }) => {
  return (
    <ul className="chart-legend">
      {
        payload.map((entry, index) => (
          <li key={`legend-${index}`} style={{ color: entry.color }}>
            <span className="legend-color" style={{ backgroundColor: entry.color }}></span>
            {entry.value}
          </li>
        ))
      }
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
      fill, payload, percent, value
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
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontWeight="bold">
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={24} textAnchor="middle" fill="#333">
          {`${value} (${(percent * 100).toFixed(0)}%)`}
        </text>
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
                onClick={() => onSliceClick(entry.name, index)}
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