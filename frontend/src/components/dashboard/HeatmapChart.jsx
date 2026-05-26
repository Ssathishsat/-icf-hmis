import React from 'react';

const getRiskColor = (count) => {
  if (count >= 5) return 'bg-red-500 text-white';
  if (count >= 3) return 'bg-orange-400 text-white';
  if (count >= 1) return 'bg-yellow-300 text-gray-800';
  return 'bg-gray-100 text-gray-400';
};

const HeatmapChart = ({ data = [], loading }) => {
  if (loading) return <div className="skeleton h-64 w-full rounded-xl" />;

  // Group by shop
  const shops = [...new Set(data.map(d => d.shop_code))];
  const weeks = [...new Set(data.map(d => d.week_num))].sort((a, b) => a - b);

  const getCount = (shop, week) => {
    const found = data.find(d => d.shop_code === shop && d.week_num === week);
    return found?.case_count || 0;
  };

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Risk Heatmap – Shop × Week</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          <span className="inline-block w-3 h-3 bg-red-500 rounded mr-1" />High (5+)
          <span className="inline-block w-3 h-3 bg-orange-400 rounded mx-1 ml-3" />Medium (3-4)
          <span className="inline-block w-3 h-3 bg-yellow-300 rounded mx-1 ml-3" />Low (1-2)
          <span className="inline-block w-3 h-3 bg-gray-100 border rounded mx-1 ml-3" />None
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left py-1 px-2 text-gray-500 font-semibold w-16">Shop</th>
              {weeks.map(w => (
                <th key={w} className="text-center py-1 px-1 text-gray-500 font-semibold w-10">W{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shops.map(shop => (
              <tr key={shop}>
                <td className="py-1 px-2 font-semibold text-gray-700">{shop}</td>
                {weeks.map(week => {
                  const count = getCount(shop, week);
                  return (
                    <td key={week} className="py-1 px-1 text-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold mx-auto ${getRiskColor(count)}`}>
                        {count || ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HeatmapChart;
