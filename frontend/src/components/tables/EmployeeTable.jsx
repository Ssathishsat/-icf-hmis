import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const EmployeeTable = ({ data = [], pagination, onPageChange, loading }) => {
  if (loading) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-10 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
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
              <th>Last Sick Date</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">📋</span>
                    <span>No records found</span>
                  </div>
                </td>
              </tr>
            ) : data.map((emp) => {
              // Derive shop number from PAYUNIT (first 2 chars)
              const payunit  = emp.payunit ? String(emp.payunit) : null;
              const shopNo   = payunit ? payunit.slice(0, 2) : (emp.shop_code || '—');
              
              // Derive category from PAYUNIT 3rd char
              let category = emp.category;
              if (payunit && payunit.length >= 3) {
                category = /[A-Za-z]/.test(payunit[2]) ? 'Supervisory' : 'Non-Supervisory';
              }
              const isSupv = category === 'Supervisory';

              return (
                <tr key={emp.EMISCARDNUMBER} className="animate-fade-in">
                  {/* UMID */}
                  <td className="font-mono text-xs font-semibold text-primary-600">
                    {emp.EMISCARDNUMBER}
                  </td>

                  {/* Employee No */}
                  <td className="font-mono text-xs text-gray-800 dark:text-gray-200 font-semibold">
                    {emp.empno || '—'}
                  </td>

                  {/* Name */}
                  <td className="font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                    {emp.emp_name}
                  </td>

                  {/* Department (from CUG) */}
                  <td className="text-gray-600 dark:text-gray-400 text-sm">
                    {emp.department || '—'}
                  </td>

                  {/* PAYUNIT — full value */}
                  <td className="font-mono text-xs text-gray-500 text-center">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-medium">
                      {payunit || '—'}
                    </span>
                  </td>

                  {/* Shop No — first 2 digits of PAYUNIT */}
                  <td className="text-center">
                    <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full text-xs font-bold">
                      {shopNo}
                    </span>
                  </td>

                  {/* Category — from PAYUNIT 3rd char */}
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
                      emp.gender === 'Female'
                        ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                        : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {emp.gender === 'Female' ? '♀ Female' : '♂ Male'}
                    </span>
                  </td>

                  {/* Last Sick Date */}
                  <td className="text-xs text-gray-500">
                    {formatDate(emp.last_sick_date) || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
              const pg = i + 1;
              return (
                <button
                  key={pg}
                  onClick={() => onPageChange(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    pagination.page === pg
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTable;
