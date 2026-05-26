import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { numberWithCommas } from '../../utils/helpers';

const KPICard = ({
  title, value, icon: Icon, color = 'blue',
  trend, trendValue, subtitle, onClick, loading
}) => {
  const colorMap = {
    blue:   { bg: 'from-blue-500 to-blue-600',   light: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100' },
    red:    { bg: 'from-red-500 to-red-600',     light: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-100' },
    green:  { bg: 'from-green-500 to-green-600', light: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100' },
    purple: { bg: 'from-purple-500 to-purple-600', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    orange: { bg: 'from-orange-500 to-orange-600', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
    teal:   { bg: 'from-teal-500 to-teal-600',   light: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-100' },
    indigo: { bg: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    navy:   { bg: 'from-primary-500 to-primary-600', light: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-100' },
  };

  const c = colorMap[color] || colorMap.blue;

  if (loading) {
    return (
      <div className="kpi-card border border-gray-100">
        <div className="skeleton h-4 w-24 mb-3 rounded" />
        <div className="skeleton h-8 w-16 mb-2 rounded" />
        <div className="skeleton h-3 w-32 rounded" />
      </div>
    );
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-400';

  return (
    <div
      className={`kpi-card border ${c.border} group`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trendValue !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(trendValue)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 tabular-nums">
          {numberWithCommas(value)}
        </p>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
        )}
      </div>

      {/* Bottom accent bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${c.bg} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </div>
  );
};

export default KPICard;
