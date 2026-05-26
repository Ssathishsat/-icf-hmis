import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import EmployeeTable from '../components/tables/EmployeeTable';
import AdvancedFilters from '../components/filters/AdvancedFilters';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';

const defaultFilters = {
  from_date: '', to_date: '', shop_code: '', category: '', search: '', status: '',
};

const EmployeeSearch = () => {
  const [filters, setFilters]       = useState(defaultFilters);
  const [data, setData]             = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [selected, setSelected]     = useState(null);
  const [empDetail, setEmpDetail]   = useState(null);

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

  const viewEmployee = async (emis) => {
    try {
      const r = await api.get(`/employees/${emis}`);
      setEmpDetail(r.data.data);
      setSelected(emis);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
          <Search className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Employee Search</h2>
          <p className="text-sm text-gray-400">Search by UMID, name, shop, or department</p>
        </div>
      </div>

      <AdvancedFilters
        filters={filters}
        onChange={f => { setFilters(f); setPage(1); }}
        onReset={() => { setFilters(defaultFilters); setPage(1); }}
      />

      <EmployeeTable
        data={data}
        pagination={pagination}
        onPageChange={setPage}
        onViewEmployee={viewEmployee}
        loading={loading}
      />

      {/* Employee Detail Panel */}
      {selected && empDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5 flex items-start justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">{empDetail.employee?.emp_name}</h2>
                <p className="text-white/70 text-sm">{empDetail.employee?.EMISCARDNUMBER} · {empDetail.employee?.designation}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Department', empDetail.employee?.department],
                  ['Shop', empDetail.employee?.shop_code],
                  ['Category', empDetail.employee?.category],
                  ['Grade', empDetail.employee?.grade],
                  ['Gender', empDetail.employee?.gender],
                  ['Date of Joining', formatDate(empDetail.employee?.date_of_joining)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{value || '—'}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">
                  Sick/Fit History ({empDetail.history?.length || 0} records)
                </h3>
                <div className="space-y-2">
                  {(empDetail.history || []).map((h, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl text-xs ${h.status === 'Sick' ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
                      <div>
                        <span className={`font-bold ${h.status === 'Sick' ? 'text-red-600' : 'text-green-600'}`}>{h.status}</span>
                        <span className="text-gray-500 ml-2">{h.diagnosis || '—'}</span>
                      </div>
                      <div className="text-right text-gray-500">
                        <p>{formatDate(h.sick_date)} → {h.fit_date ? formatDate(h.fit_date) : 'Ongoing'}</p>
                        <p className="font-semibold">{h.days_count ? `${h.days_count} days` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSearch;
