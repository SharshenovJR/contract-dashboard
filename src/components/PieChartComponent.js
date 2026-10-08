import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';

const formatNumber = (value) => Number(value || 0).toLocaleString('ru-RU');

const ChartTooltip = ({ active, payload, total }) => {
  if (!active || !payload || !payload.length) return null;
  const { name, value, payload: entry } = payload[0];
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">
        <span className="legend-color" style={{ backgroundColor: entry.color }} />
        {name}
      </div>
      <div className="chart-tooltip-value">{formatNumber(value)} · {percent}%</div>
    </div>
  );
};

const renderActiveShape = ({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill }) => (
  <g>
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      cornerRadius={4}
    />
  </g>
);

const PieChartComponent = ({ data, onSliceClick, activeIndex }) => {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const active = activeIndex !== null && activeIndex !== undefined ? data[activeIndex] : null;

  if (!total) return <p className="empty-state">Нет данных для отображения.</p>;

  return (
    <div className="pie-chart-box">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={data.length > 1 ? 2 : 0}
            cornerRadius={4}
            dataKey="value"
            stroke="none"
            activeIndex={activeIndex ?? undefined}
            activeShape={renderActiveShape}
            isAnimationActive={false}
            onClick={(_, index) => data[index] && onSliceClick(data[index].status, index)}
            style={{ cursor: 'pointer', outline: 'none' }}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.status || index}
                fill={entry.color}
                opacity={active && activeIndex !== index ? 0.35 : 1}
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip total={total} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pie-center">
        <div className="pie-center-value">{formatNumber(active ? active.value : total)}</div>
        <div className="pie-center-label">
          {active ? `${Math.round((active.value / total) * 100)}% от всех` : 'всего'}
        </div>
      </div>
    </div>
  );
};

export default PieChartComponent;
