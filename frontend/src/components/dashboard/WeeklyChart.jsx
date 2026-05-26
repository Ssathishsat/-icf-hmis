import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const WeeklyChart = ({ data = [], loading }) => {
  if (loading) return <div className="skeleton h-64 w-full rounded-xl" />;

  const chartData = data.map(d => ({
    week: `W${d.wk}`,
    Sick: d.sick_count,
    Fit:  d.fit_count,
    Total: d.total_count,
  }));

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Weekly Analysis</h3>
        <p className="text-xs text-gray-400 mt-0.5">Week-over-week sick/fit comparison</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Sick" fill="#EF4444" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Fit"  fill="#22C55E" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="Total" stroke="#003366" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyChart;
