import React, { useState, useEffect } from 'react';
import { HeartPulse, CheckCircle } from 'lucide-react';
import AdvancedFilters from '../components/filters/AdvancedFilters';
import EmployeeTable from '../components/tables/EmployeeTable';
import api from '../utils/api';

const defaultFilters = {
  from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  to_date:   new Date().toISOString().split('T')[0],
  shop_code: '', category: '', search: '', status: 'Fit',
};

const FitMonitoring = () => {
  const [filters, setFilters]       = useState(defaultFilters);
  const [data, setData]             = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/employees', { params: { ...filters, page, limit: 20 } })
      .then(r => {
        setData(r.data.data || []);
        setPagination(r.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, page]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <HeartPulse className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Fit Monitoring</h2>
          <p className="text-sm text-gray-400">Employees declared fit and returned to duty</p>
        </div>
      </div>

      <AdvancedFilters
        filters={filters}
        onChange={f => { setFilters(f); setPage(1); }}
        onReset={() => { setFilters(defaultFilters); setPage(1); }}
      />

      {!loading && data.length > 0 && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700">
            <strong>{pagination?.total || data.length}</strong> employees declared fit in the selected period.
          </p>
        </div>
      )}

      <EmployeeTable
        data={data}
        pagination={pagination}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
};

export default FitMonitoring;
