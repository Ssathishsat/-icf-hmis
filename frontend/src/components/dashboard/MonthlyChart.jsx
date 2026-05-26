import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const MonthlyChart = ({ data = [], loading }) => {
  if (loading) return <div className="skeleton h-64 w-full rounded-xl" />;

  const chartData = data.map(d => ({
    month: d.month_label,
    Sick:  d.sick_count,
    Fit:   d.fit_count,
    Total: d.total_count,
  }));

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Monthly Analysis</h3>
        <p className="text-xs text-gray-400 mt-0.5">Month-over-month trend analysis</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="Sick"  stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Fit"   stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Total" stroke="#003366" strokeWidth={2}   dot={{ r: 3 }} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyChart;
