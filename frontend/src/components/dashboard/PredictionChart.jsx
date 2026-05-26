import React from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const PredictionChart = ({ data, loading }) => {
  if (loading) return <div className="skeleton h-64 w-full rounded-xl" />;
  if (!data) return null;

  const { historical = [], predictions = [], insights = {} } = data;

  const chartData = [
    ...historical.slice(-14).map(d => ({
      date: d.trend_date?.substring(5),
      actual: d.daily_count,
      predicted: null,
      type: 'historical'
    })),
    ...predictions.map(p => ({
      date: p.date?.substring(5),
      actual: null,
      predicted: p.predicted_count,
      confidence: p.confidence,
      type: 'prediction'
    }))
  ];

  const TrendIcon = insights.trend_direction === 'increasing' ? TrendingUp
    : insights.trend_direction === 'decreasing' ? TrendingDown : Minus;
  const trendColor = insights.trend_direction === 'increasing' ? 'text-red-500'
    : insights.trend_direction === 'decreasing' ? 'text-green-500' : 'text-gray-400';

  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">AI Trend Prediction</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">7-day forecast based on historical patterns</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className={`flex items-center gap-1 font-semibold ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span className="capitalize">{insights.trend_direction}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full font-semibold ${
            insights.risk_level === 'high' ? 'bg-red-100 text-red-700' :
            insights.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {insights.risk_level?.toUpperCase()} RISK
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{insights.avg_daily}</p>
          <p className="text-xs text-gray-400">Avg Daily Cases</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-purple-600">{predictions[0]?.predicted_count || 0}</p>
          <p className="text-xs text-gray-400">Tomorrow Forecast</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-blue-600">{predictions[0]?.confidence || 0}%</p>
          <p className="text-xs text-gray-400">Confidence</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine x={historical.slice(-1)[0]?.trend_date?.substring(5)} stroke="#999" strokeDasharray="4 4" label={{ value: 'Today', fontSize: 10 }} />
          <Area type="monotone" dataKey="actual" stroke="#003366" strokeWidth={2} fill="#003366" fillOpacity={0.1} name="Actual" dot={false} />
          <Line type="monotone" dataKey="predicted" stroke="#9333EA" strokeWidth={2} strokeDasharray="6 3" name="Predicted" dot={{ r: 3, fill: '#9333EA' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PredictionChart;
