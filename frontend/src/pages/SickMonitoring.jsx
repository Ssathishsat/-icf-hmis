import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import AdvancedFilters from '../components/filters/AdvancedFilters';
import api from '../utils/api';

const defaultFilters = {
  from_date: '2022-01-01',
  to_date:   '2026-12-31',
  shop_code: '', category: '', search: '', empno: '',
  sf_code: '', gender: '',
};

const SummaryCard = ({ label, value, color, icon }) => (
  <div className={`glass-card px-4 py-3 flex items-center gap-3 border-l-4 ${color}`}>
    <div className="text-2xl">{icon}</div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value ?? '—'}</p>
    </div>
  </div>
);

const SickMonitoring = () => {
  const [filters, setFilters]           = useState(defaultFilters);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [exporting, setExporting]       = useState(false);
  const [sickData, setSickData]         = useState([]);
  const [sickPagination, setSickPagination] = useState(null);
  const [ipdData, setIpdData]           = useState([]);
  const [combined, setCombined]         = useState([]);
  const [trueCount, setTrueCount]       = useState(null);   // deduplicated total from backend
  const [trueSummary, setTrueSummary]   = useState(null);   // deduplicated gender/sf from backend

  useEffect(() => {
    setLoading(true);
    const sickParams  = { ...filters, page, limit: 20 };
    const ipdParams   = {
      page: 1, limit: 200,
      ...(filters.from_date && { from_date: filters.from_date }),
      ...(filters.to_date   && { to_date:   filters.to_date }),
      ...(filters.shop_code && { shop_code: filters.shop_code }),
      ...(filters.sf_code   && { sf_code:   filters.sf_code }),
      ...(filters.gender    && { gender:    filters.gender }),
      ...(filters.category  && { category:  filters.category }),
      ...(filters.search    && { search:    filters.search }),
    };
    // Pass all active filters to the count endpoint
    const countParams = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    );

    Promise.allSettled([
      api.get('/employees',            { params: sickParams }),
      api.get('/ipd',                  { params: ipdParams }),
      api.get('/employees/sick-count', { params: countParams }),
    ]).then(([sickRes, ipdRes, countRes]) => {
      const sick = sickRes.status === 'fulfilled' ? (sickRes.value.data.data || []) : [];
      const ipd  = ipdRes.status  === 'fulfilled' ? (ipdRes.value.data.data  || []) : [];

      setSickData(sick);
      setSickPagination(sickRes.status === 'fulfilled' ? sickRes.value.data.pagination : null);
      setIpdData(ipd);

      if (countRes.status === 'fulfilled') {
        setTrueCount(countRes.value.data.data.total);
        setTrueSummary(countRes.value.data.data.summary);
      }

      // Merge for table display: sick rows first, then IPD-only rows (not already in sick)
      const sickEmis = new Set(sick.map(r => r.EMISCARDNUMBER));
      const ipdOnly  = ipd.filter(r => !sickEmis.has(r.EMISCARDNUMBER)).map(r => ({ ...r, _isIpd: true }));
      setCombined([...sick, ...ipdOnly]);
    }).finally(() => setLoading(false));
  }, [filters, page]);

  const downloadExcel = () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('icf_token');
      const p = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) p.append(k, v); });
      window.location.href = `/api/reports/export/excel?${p.toString()}&token=${token}`;
    } finally {
      setTimeout(() => setExporting(false), 2000);
    }
  };

  const showFur   = !filters.sf_code || filters.sf_code === 'Fur';
  const showShell = !filters.sf_code || filters.sf_code === 'Shell';

  // Use backend-deduplicated counts (same UNION logic as dashboard)
  const totalCount  = trueCount  ?? 0;
  const totalMale   = trueSummary?.male   ?? 0;
  const totalFemale = trueSummary?.female ?? 0;
  const totalFur    = trueSummary?.fur    ?? 0;
  const totalShell  = trueSummary?.shell  ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Sick Monitoring</h2>
            <p className="text-sm text-gray-400">
              Track employees on sick leave — data from CUG, EMPNO &amp; Hospital registers
            </p>
          </div>
        </div>
        <button
          onClick={downloadExcel}
          disabled={exporting}
          className="btn-primary bg-green-500 hover:bg-green-600 flex items-center gap-2"
        >
          {exporting
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Exporting...</>
            : <><Download className="w-4 h-4" />Export to Excel</>}
        </button>
      </div>

      {/* Filters */}
      <AdvancedFilters
        filters={filters}
        onChange={f => { setFilters(f); setPage(1); }}
        onReset={() => { setFilters(defaultFilters); setPage(1); }}
      />

      {/* Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <SummaryCard label="Total Male"      value={totalMale}   color="border-blue-400"   icon="♂️" />
          <SummaryCard label="Total Female"    value={totalFemale} color="border-pink-400"   icon="♀️" />
          {showFur   && <SummaryCard label="Fur Division"   value={totalFur}   color="border-amber-400"  icon="🔶" />}
          {showShell && <SummaryCard label="Shell Division" value={totalShell} color="border-indigo-400" icon="🔷" />}
          <SummaryCard label="Total Records"   value={totalCount}  color="border-red-400"    icon="📋" />
        </div>
      )}

      {/* Alert banner */}
      {!loading && combined.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <strong>{totalCount}</strong> sick employee records found in the selected period.
            {filters.sf_code && (
              <span className="ml-2 font-semibold">
                Showing {filters.sf_code === 'Fur' ? '🔶 Fur' : '🔷 Shell'} Division only.
              </span>
            )}
          </p>
        </div>
      )}

      {/* Unified Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-10 w-full rounded" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>UMID Card No.</th>
                  <th>Employee No.</th>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>PAYUNIT</th>
                  <th>Shop No.</th>
                  <th>Category</th>
                  <th>Gender</th>
                  <th>Sick Date</th>
                </tr>
              </thead>
              <tbody>
                {combined.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">📋</span>
                        <span>No records found</span>
                      </div>
                    </td>
                  </tr>
                ) : combined.map((row, idx) => {
                  const isIpd   = !!row._isIpd;
                  const payunit = row.payunit ? String(row.payunit) : null;
                  const shopNo  = payunit ? payunit.slice(0, 2) : (row.shop_code || '—');
                  let category  = row.category;
                  if (payunit && payunit.length >= 3) {
                    category = /[A-Za-z]/.test(payunit[2]) ? 'Supervisory' : 'Non-Supervisory';
                  }
                  const isSupv  = category === 'Supervisory';
                  const dateVal = isIpd ? row.admission_date : row.last_sick_date;
                  const dateStr = dateVal
                    ? new Date(dateVal).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';

                  return (
                    <tr key={`${isIpd ? 'ipd' : 'sick'}-${row.ipd_id || row.EMISCARDNUMBER}-${idx}`}
                        className="animate-fade-in">

                      {/* UMID */}
                      <td className="font-mono text-xs font-semibold text-primary-600">
                        {row.EMISCARDNUMBER || '—'}
                      </td>

                      {/* Emp No */}
                      <td className="font-mono text-xs text-gray-800 dark:text-gray-200 font-semibold">
                        {row.empno || '—'}
                      </td>

                      {/* Name */}
                      <td className="font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {row.emp_name || row.patient_name || '—'}
                      </td>

                      {/* Department */}
                      <td className="text-gray-600 dark:text-gray-400 text-sm">
                        {row.department || '—'}
                      </td>

                      {/* PAYUNIT */}
                      <td className="font-mono text-xs text-gray-500 text-center">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-medium">
                          {payunit || '—'}
                        </span>
                      </td>

                      {/* Shop No */}
                      <td className="text-center">
                        <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full text-xs font-bold">
                          {shopNo}
                        </span>
                      </td>

                      {/* Category */}
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isSupv
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {isSupv ? 'Supv.' : 'Non-Supv.'}
                        </span>
                      </td>

                      {/* Gender */}
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          row.gender === 'Female'
                            ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {row.gender === 'Female' ? '♀ Female' : '♂ Male'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="text-xs text-gray-500 whitespace-nowrap">{dateStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {sickPagination && sickPagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500">
              Showing {((sickPagination.page - 1) * sickPagination.limit) + 1}–{Math.min(sickPagination.page * sickPagination.limit, sickPagination.total)} of {totalCount} records
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(sickPagination.page - 1)} disabled={sickPagination.page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(5, sickPagination.pages))].map((_, i) => {
                const pg = i + 1;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                      sickPagination.page === pg ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 text-gray-600'
                    }`}>
                    {pg}
                  </button>
                );
              })}
              <button onClick={() => setPage(sickPagination.page + 1)} disabled={sickPagination.page === sickPagination.pages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SickMonitoring;
