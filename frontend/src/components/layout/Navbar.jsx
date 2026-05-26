import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bell, Sun, Moon, LogOut, User, RefreshCw, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../hooks/useRealtime';

const breadcrumbMap = {
  '/':                'Dashboard',
  '/sick-monitoring': 'Sick Monitoring',
  '/fit-monitoring':  'Fit Monitoring',
  '/weekly-reports':  'Weekly Reports',
  '/shop-analytics':  'Shop Analytics',
  '/sse-monitoring':  'SSE Monitoring',
  '/employee-search': 'Employee Search',
  '/export-center':   'Export Center',
  '/settings':        'Settings',
};

const Navbar = ({ onRefresh, lastUpdated }) => {
  const { user, logout }          = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const location = useLocation();

  const [showNotifs, setShowNotifs]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const currentPage = breadcrumbMap[location.pathname] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Title + Breadcrumb */}
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-0.5">
            <span>ICF HMIS</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-500 font-medium">{currentPage}</span>
          </div>
          <h1 className="text-lg font-bold text-primary-500 leading-tight">
            ICF HMIS Sick/Fit Monitoring Dashboard
          </h1>
          <p className="text-xs text-gray-400">Principal Chief Medical Officer – Workforce Health Analytics System</p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Last updated */}
          {lastUpdated && (
            <span className="hidden md:block text-xs text-gray-400">
              Updated: {lastUpdated.toLocaleTimeString('en-IN')}
            </span>
          )}

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Dark mode */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary-500 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-6">No notifications</p>
                  ) : notifications.map(n => (
                    <div key={n.notif_id} className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                          n.type === 'alert' ? 'bg-red-500' :
                          n.type === 'warning' ? 'bg-yellow-500' :
                          n.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.full_name?.[0] || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">{user?.full_name}</p>
                <p className="text-xs text-gray-400 leading-tight">{user?.role}</p>
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 py-2">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{user?.full_name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
