import React from 'react';
import { Settings as SettingsIcon, Sun, Moon, User, Shield, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Settings</h2>
          <p className="text-sm text-gray-400">Application preferences and account settings</p>
        </div>
      </div>

      {/* Profile */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-primary-500" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Profile</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Full Name', user?.full_name],
            ['Username', user?.username],
            ['Email', user?.email],
            ['Role', user?.role],
            ['Shop', user?.shop_code || 'All Shops'],
          ].map(([label, value]) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Appearance</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
            <p className="text-xs text-gray-400">Switch between light and dark theme</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${darkMode ? 'bg-primary-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-green-500" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Security</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">JWT Authentication</p>
              <p className="text-xs text-gray-400">Token-based secure authentication</p>
            </div>
            <span className="badge-fit">Active</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Role-Based Access</p>
              <p className="text-xs text-gray-400">Current role: {user?.role}</p>
            </div>
            <span className="badge-fit">Enabled</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Audit Logging</p>
              <p className="text-xs text-gray-400">All actions are logged</p>
            </div>
            <span className="badge-fit">Active</span>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">System Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
          <div><span className="font-medium">System:</span> ICF HMIS v1.0.0</div>
          <div><span className="font-medium">Database:</span> MySQL 8.0</div>
          <div><span className="font-medium">Frontend:</span> React 18 + Tailwind CSS</div>
          <div><span className="font-medium">Backend:</span> Node.js + Express</div>
        </div>
      </div>

      <button
        onClick={logout}
        className="btn-danger"
      >
        Sign Out
      </button>
    </div>
  );
};

export default Settings;
