import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Activity, HeartPulse, CalendarDays,
  BarChart3, Users2, Search, Download, Settings,
  ChevronLeft, ChevronRight, Train
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/',                icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/sick-monitoring', icon: Activity,        label: 'Sick Monitoring' },
  { path: '/weekly-reports',  icon: CalendarDays,    label: 'Weekly Reports' },
  { path: '/shop-analytics',  icon: BarChart3,       label: 'Shop Analytics' },
  { path: '/sse-monitoring',  icon: Users2,          label: 'SSE Monitoring' },
  { path: '/employee-search', icon: Search,          label: 'Employee Search' },
  { path: '/export-center',   icon: Download,        label: 'Export Center' },
  { path: '/settings',        icon: Settings,        label: 'Settings' },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300
        bg-gradient-to-b from-primary-500 via-primary-600 to-primary-700 shadow-2xl
        ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo / Header */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
          <Train className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight">ICF HMIS</p>
            <p className="text-white/60 text-xs leading-tight">Health Monitoring</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `sidebar-item text-white/70 ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.[0] || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-semibold truncate">{user?.full_name}</p>
              <p className="text-white/50 text-xs">{user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-primary-500 hover:bg-primary-50 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
};

export default Sidebar;
