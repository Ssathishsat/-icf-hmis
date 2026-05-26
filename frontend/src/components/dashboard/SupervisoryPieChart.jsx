import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#003366', '#22C55E'];

const SupervisoryPieChart = ({ data = [], loading }) => {
  if (loading) return <div className="skeleton h-64 w-full rounded-xl" />;

  const chartData = data.map(d => ({
    name: d.category,
    value: d.count
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Supervisory vs Non-Supervisory</h3>
        <p className="text-xs text-gray-400 mt-0.5">Employee category distribution in sick/fit cases</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%" cy="50%"
            innerRadius={55} outerRadius={85}
            paddingAngle={4}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val) => [`${val} (${total ? ((val/total)*100).toFixed(1) : 0}%)`, 'Count']}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SupervisoryPieChart;
