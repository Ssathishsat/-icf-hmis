import React, { useState, useEffect, useCallback } from 'react';
import {
  Users2, Phone, Building2, RefreshCw, Search,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle,
  Activity, UserCheck, Layers, Clock
} from 'lucide-react';
import api from '../utils/api';

// ── KPI Card ─────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className={`glass-card p-4 flex items-center gap-4 border-l-4 ${color}`}>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  </div>
);

// ── Sick Employee Row (lazy loaded) ───────────────────────────
const SickEmployeeList = ({ shopCode }) => {
  const [emps, setEmps]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sse-monitoring/employees?shop_code=${shopCode}`)
      .then(r => setEmps(r.data.data || []))
      .catch(() => setEmps([]))
      .finally(() => setLoading(false));
  }, [shopCode]);

  if (loading) return (
    <div className="mt-3 space-y-2">
      {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-8 rounded-lg" />)}
    </div>
  );

  if (emps.length === 0) return (
    <p className="mt-3 text-xs text-gray-400 text-center py-2">No sick records found.</p>
  );

  return (
    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
      {emps.map((emp, i) => {
        const days = emp.days_count ?? (emp.sick_date
          ? Math.floor((Date.now() - new Date(emp.sick_date)) / 86400000)
          : 0);
        return (
          <div key={i} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-2.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{emp.emp_name}</p>
                <p className="text-gray-500 mt-0.5">{emp.designation} · <span className="font-mono text-primary-500">{emp.EMISCARDNUMBER}</span></p>
              </div>
              <span className="shrink-0 px-2 py-0.5 rounded-full font-semibold text-[10px] bg-red-100 text-red-700">
                Sick
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-gray-500">
              {emp.sick_date && (
                <span>📅 {new Date(emp.sick_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              )}
              <span className="font-semibold text-orange-600">⏱ {days} days</span>
              {emp.diagnosis && <span>🩺 {emp.diagnosis}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Shop Card ─────────────────────────────────────────────────
const ShopCard = ({ shop }) => {
  const [showAllSupv, setShowAllSupv]   = useState(false);
  const [showSickList, setShowSickList] = useState(false);

  const hasSick    = shop.sick_now > 0;
  const supvList   = shop.supervisors || [];
  const visibleSupv = showAllSupv ? supvList : supvList.slice(0, 3);
  const extraCount  = supvList.length - 3;

  return (
    <div className={`glass-card overflow-hidden transition-all duration-200 hover:shadow-hover ${
      hasSick ? 'border-l-4 border-red-400' : 'border-l-4 border-green-400'
    }`}>
      {/* Card Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        hasSick
          ? 'bg-red-50 dark:bg-red-900/20'
          : 'bg-green-50 dark:bg-green-900/10'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
            hasSick ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {shop.shop_code}
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm leading-tight">
              {shop.shop_name || `Shop ${shop.shop_code}`}
            </p>
            <p className="text-[10px] text-gray-500">{shop.department || '—'}</p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
          hasSick
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {hasSick ? `${shop.sick_now} Sick` : 'All Clear'}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 border-b border-gray-100 dark:border-gray-700">
        {[
          { label: 'Total Emp', value: shop.total_employees || 0, color: 'text-blue-600' },
          { label: 'Sick Now',  value: shop.sick_now || 0,        color: 'text-red-600'  },
          { label: 'Supv.',     value: shop.supervisors?.length || 0, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="py-2 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Supervisor List */}
      <div className="p-3 space-y-1.5">
        {supvList.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-1">No supervisors listed</p>
        ) : (
          <>
            {visibleSupv.map((sv, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{sv.sse_name}</p>
                  <p className="text-gray-400 text-[10px] truncate">{sv.designation || '—'}</p>
                </div>
                {sv.cug_number && (
                  <a href={`tel:${sv.cug_number}`}
                    className="shrink-0 flex items-center gap-1 text-green-600 hover:text-green-700 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                    <Phone className="w-3 h-3" />
                    {sv.cug_number}
                  </a>
                )}
              </div>
            ))}
            {extraCount > 0 && (
              <button
                onClick={() => setShowAllSupv(v => !v)}
                className="text-[10px] text-primary-500 hover:text-primary-700 font-semibold mt-1 flex items-center gap-1">
                {showAllSupv
                  ? <><ChevronUp className="w-3 h-3" />Show less</>
                  : <><ChevronDown className="w-3 h-3" />+{extraCount} more supervisors</>}
              </button>
            )}
          </>
        )}
      </div>

      {/* View Sick Employees (only if sick) */}
      {hasSick && (
        <div className="px-3 pb-3">
          <button
            onClick={() => setShowSickList(v => !v)}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg py-2 transition-colors">
            <Activity className="w-3.5 h-3.5" />
            {showSickList ? 'Hide employees' : `View ${shop.sick_now} sick employee${shop.sick_now > 1 ? 's' : ''}`}
            {showSickList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showSickList && <SickEmployeeList shopCode={shop.shop_code} />}
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const SSEMonitoring = () => {
  const [shops, setShops]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all'); // 'all' | 'sick' | 'clear'

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/sse-monitoring/shops')
      .then(r => setShops(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Search filter
  const filtered = shops.filter(sh => {
    const q = search.toLowerCase();
    const matchSearch = !q || [
      sh.shop_code, sh.shop_name, sh.department,
      ...(sh.supervisors || []).flatMap(s => [s.sse_name, s.cug_number, s.designation]),
    ].some(v => String(v || '').toLowerCase().includes(q));

    const matchFilter =
      filter === 'all'   ? true :
      filter === 'sick'  ? sh.sick_now > 0 :
      filter === 'clear' ? sh.sick_now === 0 : true;

    return matchSearch && matchFilter;
  });

  const sickShops  = filtered.filter(s => s.sick_now > 0);
  const clearShops = filtered.filter(s => s.sick_now === 0);

  // KPI totals
  const totalShops    = shops.length;
  const totalSickEmps = shops.reduce((a, s) => a + (s.sick_now || 0), 0);
  const shopsWithSick = shops.filter(s => s.sick_now > 0).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Users2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">SSE Monitoring</h2>
            <p className="text-sm text-gray-400">Shop-wise supervisors with live sick employee tracking</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors border border-indigo-200">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Layers}       label="Total Shops"           value={totalShops}    color="border-blue-400"   bg="bg-blue-500" />
        <KpiCard icon={AlertTriangle} label="Employees Currently Sick" value={totalSickEmps} color="border-red-400"    bg="bg-red-500" />
        <KpiCard icon={Building2}    label="Shops with Sick Cases" value={shopsWithSick} color="border-orange-400" bg="bg-orange-500" />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search shop, department, supervisor name, phone..."
            className="form-input pl-9 w-full"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all',   label: 'All',   icon: Layers },
            { key: 'sick',  label: 'Sick',  icon: AlertTriangle },
            { key: 'clear', label: 'Clear', icon: CheckCircle },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                filter === f.key
                  ? f.key === 'sick'  ? 'bg-red-500 text-white border-red-500'
                  : f.key === 'clear' ? 'bg-green-500 text-white border-green-500'
                  :                     'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}>
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Shops with Active Sick Cases */}
          {sickShops.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-red-600 dark:text-red-400">
                  Shops with Active Sick Cases
                  <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{sickShops.length}</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sickShops.map(sh => <ShopCard key={sh.shop_code} shop={sh} />)}
              </div>
            </div>
          )}

          {/* All Clear Shops */}
          {clearShops.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 mt-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <h3 className="font-bold text-green-600 dark:text-green-400">
                  All Clear Shops
                  <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{clearShops.length}</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clearShops.map(sh => <ShopCard key={sh.shop_code} shop={sh} />)}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No shops match your search</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SSEMonitoring;
