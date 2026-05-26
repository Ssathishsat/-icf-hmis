import React, { useState, useEffect } from 'react';
import { CalendarDays, UserPlus, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import api from '../utils/api';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="glass-card p-4 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

const WeeklyReports = () => {
  const [data, setData]       = useState(null);
  const [ipdData, setIpdData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('new');

  useEffect(() => {
    setLoading(true);

    // Last 7 days
    const now  = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    const fmt     = d => d.toISOString().split('T')[0];
    const weekFrom = fmt(from);
    const weekTo   = fmt(now);

    Promise.allSettled([
      api.get('/sse-monitoring/weekly'),
      api.get('/ipd', { params: { page: 1, limit: 200, from_date: weekFrom, to_date: weekTo } }),
    ]).then(([weekRes, ipdRes]) => {
      if (weekRes.status === 'fulfilled') setData(weekRes.value.data.data);
      if (ipdRes.status  === 'fulfilled') setIpdData(ipdRes.value.data.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // IPD already filtered to last 7 days by the backend query above
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const ipdThisWeek = ipdData.filter(r => {
    if (!r.admission_date) return false;
    return new Date(r.admission_date) >= weekStart;
  });

  // Combined new cases = sick new cases + IPD this week
  const sickNewCases   = data?.new_cases || [];
  const sickNewEmis    = new Set(sickNewCases.map(r => r.EMISCARDNUMBER));
  const ipdNewOnly     = ipdThisWeek.filter(r => !sickNewEmis.has(r.EMISCARDNUMBER));
  const combinedNew    = [
    ...sickNewCases,
    ...ipdNewOnly.map(r => ({
      ...r,
      sick_date:  r.admission_date,
      diagnosis:  r.dept_ward ? `Hospitalised – ${r.dept_ward}` : 'Hospitalised',
      _isIpd: true,
    })),
  ];

  const newCount       = combinedNew.length;
  const recoveredCount = data?.summary?.recovered_count || 0;
  const pendingCount   = data?.summary?.pending_count   || 0;
  const recurringCount = data?.summary?.recurring_count || 0;

  const tabs = [
    { key: 'new',       label: 'New Cases',           icon: UserPlus,      count: newCount },
    { key: 'recovered', label: 'Recovered',            icon: UserCheck,     count: recoveredCount },
    { key: 'pending',   label: 'Pending Follow-up',    icon: Clock,         count: pendingCount },
    { key: 'recurring', label: 'High-Risk Recurring',  icon: AlertTriangle, count: recurringCount },
  ];

  const tableData = {
    new:       combinedNew,
    recovered: data?.recovered       || [],
    pending:   data?.pending_followup || [],
    recurring: data?.recurring_cases  || [],
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Weekly Reports</h2>
          <p className="text-sm text-gray-400">Last 7 days monitoring summary — sick &amp; hospital admissions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={UserPlus}      label="New Cases (Last 7 Days)"  value={newCount}       color="bg-red-500" />
        <StatCard icon={UserCheck}     label="Recovered (Last 7 Days)"  value={recoveredCount} color="bg-green-500" />
        <StatCard icon={Clock}         label="Pending Follow-up"        value={pendingCount}   color="bg-orange-500" />
        <StatCard icon={AlertTriangle} label="High-Risk Recurring"      value={recurringCount} color="bg-purple-500" />
      </div>

      {/* Tabs */}
      <div className="glass-card overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  tab === t.key ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : tableData[tab].length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <span className="text-4xl block mb-2">✅</span>
              No records in this category
            </div>
          ) : (
            <table className="w-full data-table text-sm">
              <thead>
                <tr>
                  <th>UMID</th>
                  <th>Employee Name</th>
                  <th>Designation</th>
                  <th>Shop</th>
                  <th>Category</th>
                  {tab === 'new'       && <><th>Sick Date</th><th>Diagnosis / Ward</th><th>Status</th></>}
                  {tab === 'recovered' && <><th>Sick Date</th><th>Fit Date</th><th>Days</th></>}
                  {tab === 'pending'   && <><th>Sick Date</th><th>Days Pending</th><th>Doctor</th></>}
                  {tab === 'recurring' && <><th>Sick Count (6mo)</th><th>Last Sick Date</th></>}
                </tr>
              </thead>
              <tbody>
                {tableData[tab].map((row, i) => (
                  <tr key={i} className={row._isIpd ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}>
                    <td className="font-mono text-xs font-semibold text-primary-600">{row.EMISCARDNUMBER}</td>
                    <td className="font-medium">{row.emp_name || row.patient_name || '—'}</td>
                    <td>{row.designation || '—'}</td>
                    <td>
                      <span className="bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full text-xs font-medium">
                        {row.shop_code || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        row.category === 'Supervisory'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {row.category || '—'}
                      </span>
                    </td>

                    {tab === 'new' && (
                      <>
                        <td className="text-xs">{formatDate(row.sick_date || row.admission_date)}</td>
                        <td className="text-xs text-gray-500">{row.diagnosis || '—'}</td>
                        <td>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            row._isIpd
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {row._isIpd ? 'Hospitalised' : 'Sick'}
                          </span>
                        </td>
                      </>
                    )}
                    {tab === 'recovered' && (
                      <>
                        <td className="text-xs">{formatDate(row.sick_date)}</td>
                        <td className="text-xs">{formatDate(row.fit_date)}</td>
                        <td className="font-semibold text-green-600">{row.days_count}</td>
                      </>
                    )}
                    {tab === 'pending' && (
                      <>
                        <td className="text-xs">{formatDate(row.sick_date)}</td>
                        <td className="font-bold text-orange-600">{row.days_pending} days</td>
                        <td className="text-xs text-gray-500">{row.reporting_doctor || '—'}</td>
                      </>
                    )}
                    {tab === 'recurring' && (
                      <>
                        <td className="font-bold text-red-600 text-center">{row.sick_count}</td>
                        <td className="text-xs">{formatDate(row.last_sick_date)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyReports;
