import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Users, UserCheck,
  Calendar, CalendarDays, Building2, Shield, ArrowRight
} from 'lucide-react';
import KPICard from '../components/dashboard/KPICard';
import DayWiseTrendChart from '../components/dashboard/DayWiseTrendChart';
import WeeklyChart from '../components/dashboard/WeeklyChart';
import MonthlyChart from '../components/dashboard/MonthlyChart';
import ShopDistributionChart from '../components/dashboard/ShopDistributionChart';
import SupervisoryPieChart from '../components/dashboard/SupervisoryPieChart';
import HeatmapChart from '../components/dashboard/HeatmapChart';
import DepartmentTrendsChart from '../components/dashboard/DepartmentTrendsChart';
import PredictionChart from '../components/dashboard/PredictionChart';
import ShopDrilldownModal from '../components/modals/ShopDrilldownModal';
import AdvancedFilters from '../components/filters/AdvancedFilters';
import api from '../utils/api';

const defaultFilters = {
  from_date: '2022-01-01',
  to_date:   '2026-12-31',
  shop_code: '',
  status:    '',
  category:  '',
  search:    '',
  sf_code:   '',
  gender:    '',
};

const Dashboard = ({ onLastUpdated }) => {
  const navigate = useNavigate();
  const [filters, setFilters]             = useState(defaultFilters);
  const [kpi, setKpi]                     = useState(null);
  const [dayTrend, setDayTrend]           = useState([]);
  const [shopDist, setShopDist]           = useState([]);
  const [catDist, setCatDist]             = useState([]);
  const [weeklyData, setWeeklyData]       = useState([]);
  const [monthlyData, setMonthlyData]     = useState([]);
  const [deptData, setDeptData]           = useState([]);
  const [sseData, setSseData]             = useState([]);
  const [heatmapData, setHeatmapData]     = useState([]);
  const [predictions, setPredictions]     = useState(null);
  const [loading, setLoading]             = useState(true);
  const [drilldownShop, setDrilldownShop] = useState(null);
  const [divisionStats, setDivisionStats] = useState(null);
  const [recentSick, setRecentSick]       = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        from_date: filters.from_date,
        to_date:   filters.to_date,
        shop_code: filters.shop_code || undefined,
        sf_code:   filters.sf_code || undefined,
        gender:    filters.gender || undefined,
        category:  filters.category || undefined,
        status:    filters.status || undefined,
        search:    filters.search || undefined,
      };

      const [kpiRes, dayRes, shopRes, catRes, weekRes, monthRes, deptRes, sseRes, heatRes, predRes, divRes, recRes] = await Promise.allSettled([
        api.get('/dashboard/kpi',                   { params }),
        api.get('/dashboard/daywise-trend',         { params }),
        api.get('/dashboard/shop-distribution',     { params }),
        api.get('/dashboard/category-distribution', { params }),
        api.get('/analytics/weekly',                { params: { ...params, weeks: 8 } }),
        api.get('/analytics/monthly',               { params: { ...params, months: 12 } }),
        api.get('/analytics/department-trends',     { params }),
        api.get('/analytics/sse-performance',       { params }),
        api.get('/analytics/heatmap',               { params }),
        api.get('/analytics/predictions'),
        api.get('/dashboard/division-stats',        { params }),
        api.get('/dashboard/recent-sick',           { params }),
      ]);

      if (kpiRes.status === 'fulfilled')    setKpi(kpiRes.value.data.data);
      if (dayRes.status === 'fulfilled')    setDayTrend(dayRes.value.data.data || []);
      if (shopRes.status === 'fulfilled')   setShopDist(shopRes.value.data.data || []);
      if (catRes.status === 'fulfilled')    setCatDist(catRes.value.data.data || []);
      if (weekRes.status === 'fulfilled')   setWeeklyData(weekRes.value.data.data || []);
      if (monthRes.status === 'fulfilled')  setMonthlyData(monthRes.value.data.data || []);
      if (deptRes.status === 'fulfilled')   setDeptData(deptRes.value.data.data || []);
      if (sseRes.status === 'fulfilled')    setSseData(sseRes.value.data.data || []);
      if (heatRes.status === 'fulfilled')   setHeatmapData(heatRes.value.data.data || []);
      if (predRes.status === 'fulfilled')   setPredictions(predRes.value.data.data);
      if (divRes.status === 'fulfilled')    setDivisionStats(divRes.value.data.data);
      if (recRes.status === 'fulfilled')    setRecentSick(recRes.value.data.data || []);

      onLastUpdated?.(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const kpiCards = [
    { key: 'total_sick_cases',      title: 'Sick Cases',            icon: Activity,     color: 'red',    subtitle: 'Total sick employees' },
    { key: 'total_supervisory',     title: 'Supervisory',           icon: UserCheck,    color: 'purple', subtitle: 'Supervisory sick cases' },
    { key: 'total_non_supervisory', title: 'Non-Supervisory',       icon: Users,        color: 'indigo', subtitle: 'Non-supervisory sick cases' },
    { key: 'shops_affected',        title: 'Shops Affected',        icon: Building2,    color: 'navy',   subtitle: 'Shops with sick cases' },
    { key: 'current_week_cases',    title: 'Last 7 Days',           icon: Calendar,     color: 'orange', subtitle: 'Cases in last 7 days' },
    { key: 'monthly_cases',         title: 'Monthly Cases',         icon: CalendarDays, color: 'teal',   subtitle: 'This month' },
    { key: 'active_sse_count',      title: 'Active SSE Monitoring', icon: Shield,       color: 'blue',   subtitle: 'SSEs monitoring' },
  ];

  return (
    <div className="space-y-6">
      {/* Featured Feature Hero Promotion Banner */}
      <div className="bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Glow absolute decoration */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm">
              Primary Terminal
            </span>
            <span className="text-[10px] text-primary-200 font-medium">
              Real-time Workforce Tracking
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Workforce Sick & Fit Monitoring Dashboard
          </h2>
          <p className="text-sm text-primary-100 max-w-2xl">
            Directly access and manage detailed employee sick history, filters by Payunit & shop numbers, division metrics, and resolved health cases.
          </p>
        </div>
        
        <button
          onClick={() => navigate('/sick-monitoring')}
          className="z-10 bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 whitespace-nowrap group shrink-0"
        >
          <span>Open Sick Monitoring</span>
          <ArrowRight className="w-4 h-4 text-indigo-600 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Filters */}
      <AdvancedFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <KPICard
            key={card.key}
            title={card.title}
            value={kpi?.[card.key] ?? 0}
            icon={card.icon}
            color={card.color}
            subtitle={card.subtitle}
            loading={loading}
            onClick={card.key === 'shops_affected' ? () => {} : undefined}
          />
        ))}
      </div>

      {/* Division Stats & Recent Sick Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Fur vs Shell breakdown */}
        <div className="glass-card p-5 lg:col-span-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-500" />
            Division Workforce (Sick)
          </h3>
          {divisionStats ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Furnishing (Fur)</span>
                  <span className="text-sm font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{divisionStats.Fur?.Total || 0}</span>
                </div>
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Male: {divisionStats.Fur?.Male || 0}</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400"></span> Female: {divisionStats.Fur?.Female || 0}</div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Shell</span>
                  <span className="text-sm font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{divisionStats.Shell?.Total || 0}</span>
                </div>
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Male: {divisionStats.Shell?.Male || 0}</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400"></span> Female: {divisionStats.Shell?.Female || 0}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          )}
        </div>

        {/* Recent Sick Records */}
        <div className="glass-card p-5 lg:col-span-2 overflow-hidden flex flex-col">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            Recent Sick Activity
          </h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-2 font-medium">Employee Name</th>
                  <th className="pb-2 font-medium">Emp No.</th>
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium text-right">Last Sick Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSick.map((emp, idx) => (
                  <tr key={idx} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 font-medium text-gray-800 dark:text-gray-200">{emp.emp_name}</td>
                    <td className="py-3 font-mono text-xs text-gray-500">{emp.empno || '—'}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{emp.department}</td>
                    <td className="py-3 text-right text-gray-500 text-xs">
                      {new Date(emp.last_sick_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DayWiseTrendChart data={dayTrend} loading={loading} />
        <WeeklyChart data={weeklyData} loading={loading} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ShopDistributionChart
            data={shopDist}
            loading={loading}
            onShopClick={setDrilldownShop}
          />
        </div>
        <SupervisoryPieChart data={catDist} loading={loading} />
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MonthlyChart data={monthlyData} loading={loading} />
        <DepartmentTrendsChart data={deptData} loading={loading} />
      </div>

      {/* Charts Row 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <HeatmapChart data={heatmapData} loading={loading} />
        <PredictionChart data={predictions} loading={loading} />
      </div>

      {/* Shop Drilldown Modal */}
      {drilldownShop && (
        <ShopDrilldownModal
          shopCode={drilldownShop}
          filters={{ from_date: filters.from_date, to_date: filters.to_date }}
          onClose={() => setDrilldownShop(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
