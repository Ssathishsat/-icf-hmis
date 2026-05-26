import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { CHART_COLORS } from '../../utils/helpers';

const ShopDistributionChart = ({ data = [], loading, onShopClick }) => {
  if (loading) return <div className="skeleton h-64 w-full rounded-xl" />;

  const chartData = data.slice(0, 10).map(d => ({
    shop: d.shop_code,
    name: d.shop_name,
    Sick: d.sick_count,
    Fit:  d.fit_count,
  }));

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Shop-wise Distribution</h3>
        <p className="text-xs text-gray-400 mt-0.5">Click a bar to drill down into shop details</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          onClick={(e) => e?.activePayload && onShopClick?.(e.activePayload[0]?.payload?.shop)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="shop" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(val, name) => [val, name]}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Sick" fill="#EF4444" radius={[4, 4, 0, 0]} cursor="pointer" />
          <Bar dataKey="Fit"  fill="#22C55E" radius={[4, 4, 0, 0]} cursor="pointer" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ShopDistributionChart;
