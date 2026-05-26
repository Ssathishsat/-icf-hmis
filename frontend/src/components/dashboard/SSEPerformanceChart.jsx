import React, { useState } from 'react';
import { 
  Building2, User, ChevronDown, ChevronUp, 
  Activity, CheckCircle, Clock, HeartPulse, UserCheck 
} from 'lucide-react';
import api from '../../utils/api';

const SSEPerformanceChart = ({ data = [], loading }) => {
  const [expandedSse, setExpandedSse] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);

  if (loading) return <div className="skeleton h-64 w-full rounded-xl" />;

  const handleRowClick = async (shopCode) => {
    if (expandedSse === shopCode) {
      setExpandedSse(null);
      setEmployees([]);
      return;
    }
    setExpandedSse(shopCode);
    setEmpLoading(true);
    try {
      const res = await api.get(`/sse-monitoring/employees?shop_code=${shopCode}`);
      const rawData = res.data.data || [];
      const uniqueData = Array.from(new Map(rawData.map(emp => [emp.EMISCARDNUMBER, emp])).values());
      setEmployees(uniqueData);
    } catch (e) {
      console.error(e);
    } finally {
      setEmpLoading(false);
    }
  };

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">SSE Performance Overview</h3>
        <p className="text-xs text-gray-400 mt-0.5">Click on a supervisor row below to view the names and details of employees under them who got sick or fit.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-2 text-gray-500 font-semibold">SSE Name</th>
              <th className="text-center py-2 px-2 text-gray-500 font-semibold">Shop</th>
              <th className="text-center py-2 px-2 text-gray-500 font-semibold">Total Cases</th>
              <th className="text-left py-2 px-2 text-gray-500 font-semibold">CUG Contact</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <React.Fragment key={i}>
                <tr 
                  onClick={() => handleRowClick(d.shop_code)}
                  className={`border-b border-gray-50 hover:bg-blue-50/40 dark:hover:bg-gray-700/30 transition-colors cursor-pointer ${
                    expandedSse === d.shop_code ? 'bg-blue-50/30 dark:bg-gray-800/30 font-medium' : ''
                  }`}
                >
                  <td className="py-2.5 px-2 text-gray-800 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      {expandedSse === d.shop_code ? (
                        <ChevronUp className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      <span>{d.sse_name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full font-medium">{d.shop_code}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-semibold text-gray-700 dark:text-gray-300">{d.total_cases || 0}</td>
                  <td className="py-2.5 px-2 text-gray-500 dark:text-gray-400">{d.cug_number}</td>
                </tr>

                {expandedSse === d.shop_code && (
                  <tr>
                    <td colSpan={4} className="bg-gray-50/50 dark:bg-gray-900/10 p-4 border-b border-gray-100 dark:border-gray-800">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-xs flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                            Employees Health History under Shop-{d.shop_code} (Supervisor: {d.sse_name})
                          </h4>
                          <span className="text-[10px] text-gray-400 font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                            {employees.length} Health Records
                          </span>
                        </div>

                        {empLoading ? (
                          <div className="py-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            Loading employee records...
                          </div>
                        ) : employees.length === 0 ? (
                          <div className="py-6 text-center text-xs text-gray-400">
                            No sick/fit records registered under this shop.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1">
                            {employees.map((emp) => (
                              <div 
                                key={emp.EMISCARDNUMBER} 
                                className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-sm hover:border-gray-200 dark:hover:border-gray-600 transition-all flex flex-col justify-between"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="font-semibold text-gray-800 dark:text-gray-200 text-xs flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                      {emp.emp_name}
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{emp.designation} • {emp.category}</p>
                                    <p className="text-[10px] text-primary-500 dark:text-primary-400 font-mono mt-1">UMID: {emp.EMISCARDNUMBER}</p>
                                  </div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shrink-0 ${
                                    !emp.fit_date 
                                      ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30' 
                                      : 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
                                  }`}>
                                    {!emp.fit_date ? (
                                      <HeartPulse className="w-3 h-3 text-red-500" />
                                    ) : (
                                      <UserCheck className="w-3 h-3 text-blue-500" />
                                    )}
                                    {!emp.fit_date ? 'Active Sick' : 'Resolved Sick'}
                                  </span>
                                </div>
                                
                                <div className="mt-3 pt-2.5 border-t border-gray-50 dark:border-gray-700/50 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span>Sick From: <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(emp.sick_date).toLocaleDateString('en-IN')}</span></span>
                                  </div>
                                  {emp.fit_date && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                                      <span>Recovered: <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(emp.fit_date).toLocaleDateString('en-IN')}</span></span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Activity className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span>Duration: <span className="font-semibold text-amber-600 dark:text-amber-400">{emp.days_count} Days</span></span>
                                  </div>
                                </div>

                                {emp.diagnosis && (
                                  <div className="mt-2 text-[10px] bg-gray-50 dark:bg-gray-700/40 p-2 rounded-lg text-gray-600 dark:text-gray-400 border border-gray-100/50 dark:border-gray-700/30">
                                    <span className="font-semibold text-gray-500">Diagnosis:</span> {emp.diagnosis}
                                    {emp.hospital_name && <span className="text-[9px] text-gray-400 block mt-0.5">🏥 Treated at {emp.hospital_name}</span>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SSEPerformanceChart;
