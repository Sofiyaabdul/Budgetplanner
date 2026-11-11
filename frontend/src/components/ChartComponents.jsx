import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';

// Distinct color palette for categories
const CHART_COLORS = [
  '#0d9488', // teal
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#10b981', // green
  '#ef4444', // red
  '#0ea5e9', // light blue
  '#f97316', // orange
  '#14b8a6', // mint
  '#6366f1', // indigo
  '#64748b'  // slate
];

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label, currency = '$' }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '0.625rem 0.875rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-dropdown)',
          fontSize: '0.8125rem'
        }}
      >
        {label && <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#cbd5e1' }}>{label}</div>}
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: entry.color || entry.fill
              }}
            />
            <span style={{ color: '#94a3b8' }}>{entry.name}:</span>
            <span style={{ fontWeight: 600, color: '#ffffff' }}>
              {currency}{Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// 1. Expense Category Donut Chart
export const ExpenseDonutChart = ({ data = [], currency = '$', height = 280 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        No expense data for this period
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    name: item.name || item._id,
    value: Number(item.value || item.total || 0),
    color: CHART_COLORS[index % CHART_COLORS.length]
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--color-surface)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: '10px', fontSize: '0.8rem' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// 2. Income vs Expense Bar Chart
export const IncomeExpenseBarChart = ({ data = [], currency = '$', height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        No monthly trend data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `${currency}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.8rem' }} />
          <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 3. Financial Trend Area Chart (Net Cashflow / Balance Trend)
export const FinancialTrendArea = ({ data = [], currency = '$', height = 280 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        No trend records available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `${currency}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.8rem' }} />
          <Area
            type="monotone"
            dataKey="amount"
            name="Amount"
            stroke="#0d9488"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorIncome)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// 4. Budget Comparison Bar Chart (Allocated vs Actual Spent)
export const BudgetComparisonBarChart = ({ data = [], currency = '$', height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        No budget comparison data
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `${currency}${val}`}
          />
          <YAxis
            dataKey="category"
            type="category"
            tick={{ fontSize: 12, fill: '#0f172a' }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.8rem' }} />
          <Bar dataKey="allocated" name="Allocated Budget" fill="#94a3b8" radius={[0, 4, 4, 0]} maxBarSize={20} />
          <Bar dataKey="spent" name="Actual Spent" fill="#0d9488" radius={[0, 4, 4, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
