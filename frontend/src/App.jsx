import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SickMonitoring from './pages/SickMonitoring';
import WeeklyReports from './pages/WeeklyReports';
import ShopAnalytics from './pages/ShopAnalytics';
import SSEMonitoring from './pages/SSEMonitoring';
import EmployeeSearch from './pages/EmployeeSearch';
import ExportCenter from './pages/ExportCenter';
import Settings from './pages/Settings';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading ICF HMIS...</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

// App shell with layout
const AppShell = () => {
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshKey, setRefreshKey]   = useState(0);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  return (
    <Layout onRefresh={handleRefresh} lastUpdated={lastUpdated}>
      <Routes>
        <Route path="/"                element={<Dashboard key={refreshKey} onLastUpdated={setLastUpdated} />} />
        <Route path="/sick-monitoring" element={<SickMonitoring />} />
        <Route path="/weekly-reports"  element={<WeeklyReports />} />
        <Route path="/shop-analytics"  element={<ShopAnalytics />} />
        <Route path="/sse-monitoring"  element={<SSEMonitoring />} />
        <Route path="/employee-search" element={<EmployeeSearch />} />
        <Route path="/export-center"   element={<ExportCenter />} />
        <Route path="/settings"        element={<Settings />} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
