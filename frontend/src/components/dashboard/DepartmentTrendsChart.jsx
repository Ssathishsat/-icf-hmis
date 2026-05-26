import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const DepartmentTrendsChart = ({ data = [], loading }) => {
  if (loading) return <div className="skeleton h-64 w-full rounded-xl" />;

  const chartData = data.map(d => ({
    dept: d.department?.substring(0, 12) || 'Unknown',
    Sick: d.sick_count,
    Fit:  d.fit_count,
  }));

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Department-wise Trends</h3>
        <p className="text-xs text-gray-400 mt-0.5">Sick/Fit distribution by department</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} tickLine={false} width={80} />
          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Sick" fill="#EF4444" radius={[0, 4, 4, 0]} />
          <Bar dataKey="Fit"  fill="#22C55E" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DepartmentTrendsChart;
