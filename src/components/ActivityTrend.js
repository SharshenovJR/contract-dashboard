import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import OneLine from './OneLine';

// Категориальные цвета серий в фиксированном порядке (проверены на различимость, в т.ч. при дальтонизме)
const SERIES_COLORS = ['#2F70AF', '#d95f0e']; // цвета графиков AidStat (проверены на различимость)

// LocalDate приходит строкой «2026-10-13» или массивом [2026, 10, 13]
const toDayLabel = (value) => {
  const [y, m, d] = Array.isArray(value) ? value : String(value).split('-').map(Number);
  if (!y) return '';
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
};

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="trend-tooltip">
      <div className="trend-tooltip-date">{label}</div>
      {payload.map((item) => (
        <div key={item.dataKey} className="trend-tooltip-row">
          <span className="trend-swatch" style={{ background: item.color }} />
          <span className="trend-tooltip-name">{item.name}</span>
          <span className="trend-tooltip-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

// Подпись серии у последней точки линии (только для графиков с несколькими сериями)
const endLabel = (name, lastIndex) => ({ x, y, index }) => (
  index === lastIndex
    ? <text x={x + 8} y={y} dy={4} fontSize={11} fill="var(--text-secondary)">{name}</text>
    : null
);

const TrendChart = ({ chart, data, days }) => {
  const multi = chart.series.length > 1;
  const lastIndex = data.length - 1;

  return (
    <div className="trend-chart">
      <div className="trend-chart-header">
        <OneLine as="h4" className="trend-chart-title">{chart.title}</OneLine>
        <OneLine as="p" className="trend-chart-hint">{chart.hint}</OneLine>
        {multi && (
          <div className="trend-legend">
            {chart.series.map((s, i) => (
              <span key={s.key} className="trend-legend-item">
                <span className="trend-swatch" style={{ background: SERIES_COLORS[i] }} />
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: multi ? 44 : 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-strong)' }}
            interval={days > 7 ? 'preserveStartEnd' : 0}
            minTickGap={16}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }} />
          {chart.series.map((s, i) => (
            <Line
              key={s.key}
              type="linear"
              dataKey={s.key}
              name={s.name ?? chart.title}
              stroke={SERIES_COLORS[i]}
              strokeWidth={2}
              dot={days <= 7 ? { r: 4, fill: SERIES_COLORS[i], stroke: '#fff', strokeWidth: 2 } : false}
              activeDot={{ r: 5, fill: SERIES_COLORS[i], stroke: '#fff', strokeWidth: 2 }}
              label={multi ? endLabel(s.name, lastIndex) : false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const ActivityTrend = ({ charts, rows, days, loading, error }) => {
  if (error) return <div className="activity-error">{error}</div>;
  if (loading || !rows) return <div className="loader"><span className="spinner" /> Загрузка динамики…</div>;

  const data = rows.map((row) => ({ ...row, day: toDayLabel(row.date) }));
  return (
    <div className="trend-grid">
      {charts.map((chart) => <TrendChart key={chart.title} chart={chart} data={data} days={days} />)}
    </div>
  );
};

export default ActivityTrend;
