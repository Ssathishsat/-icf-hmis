import React, { useState, useEffect } from 'react';
import { X, Phone, MapPin, Users, Activity, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { formatDate, formatDateShort } from '../../utils/helpers';

const ShopDrilldownModal = ({ shopCode, onClose, filters = {} }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopCode) return;
    setLoading(true);
    api.get(`/shops/${shopCode}/drilldown`, { params: filters })
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [shopCode]);

  if (!shopCode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">
              {loading ? 'Loading...' : data?.shop?.shop_name || shopCode}
            </h2>
            <p className="text-white/70 text-sm mt-0.5">
              {data?.shop?.department} · {data?.shop?.division}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Loading shop details...</p>
            </div>
          </div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* SSE Contact + Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SSE Info */}
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4">
                <h3 className="font-semibold text-primary-700 dark:text-primary-300 text-sm mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> SSE Contact Details
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">SSE Name</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{data.shop?.sse_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Designation</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{data.shop?.sse_designation || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    <a href={`tel:${data.shop?.cug_number}`} className="font-bold text-green-600 hover:underline">
                      {data.shop?.cug_number || '—'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Currently Sick',  value: data.summary?.current_sick || 0,              color: 'text-red-600',    bg: 'bg-red-50' },
                  { label: 'Total Affected',  value: data.summary?.total_affected || 0,             color: 'text-blue-600',   bg: 'bg-blue-50' },
                  { label: 'Avg Days Sick',   value: Math.round(data.summary?.avg_days || 0),       color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend Chart */}
            {data.trend?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">Shop Trend</h3>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={data.trend.map(d => ({ date: formatDateShort(d.trend_date), Sick: d.sick_count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Sick" stroke="#EF4444" fill="#FEE2E2" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Employee List */}
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">
                Employee Records ({data.employees?.length || 0})
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                <table className="w-full data-table text-xs">
                  <thead>
                    <tr>
                      <th>UMID</th>
                      <th>Name</th>
                      <th>Designation</th>
                      <th>Category</th>
                      <th>Sick Date</th>
                      <th>Days</th>
                      <th>Doctor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.employees || []).map((emp, i) => (
                      <tr key={i}>
                        <td className="font-mono font-semibold text-primary-600">{emp.EMISCARDNUMBER}</td>
                        <td className="font-medium">{emp.emp_name}</td>
                        <td>{emp.designation}</td>
                        <td>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${emp.category === 'Supervisory' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {emp.category === 'Supervisory' ? 'Supv' : 'Non-Supv'}
                          </span>
                        </td>
                        <td>{formatDate(emp.sick_date)}</td>
                        <td className="font-semibold">{emp.days_count || '—'}</td>
                        <td className="text-gray-500">{emp.reporting_doctor || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12 text-gray-400">
            No data available
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDrilldownModal;
