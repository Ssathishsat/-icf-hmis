import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import api from '../utils/api';

const ExportCenter = () => {
  const [filters, setFilters] = useState({
    from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to_date:   new Date().toISOString().split('T')[0],
    shop_code: '',
    status:    '',
    category:  '',
  });
  const [loading, setLoading] = useState({ excel: false, pdf: false });

  const buildParams = () => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) p.append(k, v); });
    return p.toString();
  };

  const downloadExcel = () => {
    setLoading(l => ({ ...l, excel: true }));
    try {
      const token = localStorage.getItem('icf_token');
      // Trigger a native browser download using fallback query token
      window.location.href = `/api/reports/export/excel?${buildParams()}&token=${token}`;
    } catch (e) { 
      alert('Export failed'); 
    } finally {
      setTimeout(() => {
        setLoading(l => ({ ...l, excel: false }));
      }, 2000);
    }
  };

  const downloadPDF = () => {
    setLoading(l => ({ ...l, pdf: true }));
    try {
      const token = localStorage.getItem('icf_token');
      // Trigger a native browser download using fallback query token
      window.location.href = `/api/reports/export/pdf?${buildParams()}&token=${token}`;
    } catch (e) { 
      alert('PDF export failed'); 
    } finally {
      setTimeout(() => {
        setLoading(l => ({ ...l, pdf: false }));
      }, 2000);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Download className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Export Center</h2>
          <p className="text-sm text-gray-400">Download reports in Excel or PDF format</p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-4">Report Filters</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">From Date</label>
            <input type="date" value={filters.from_date}
              onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))}
              className="form-input text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">To Date</label>
            <input type="date" value={filters.to_date}
              onChange={e => setFilters(f => ({ ...f, to_date: e.target.value }))}
              className="form-input text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Category</label>
            <select value={filters.category}
              onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
              className="form-input text-sm">
              <option value="">All Categories</option>
              <option value="Supervisory">Supervisory</option>
              <option value="Non-Supervisory">Non-Supervisory</option>
            </select>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Excel */}
        <div className="glass-card p-6 text-center hover:shadow-hover transition-all duration-200">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Excel Report</h3>
          <p className="text-xs text-gray-400 mb-4">Full data with formatting, colors, and all columns</p>
          <button
            onClick={downloadExcel}
            disabled={loading.excel}
            className="btn-primary w-full justify-center bg-green-500 hover:bg-green-600"
          >
            {loading.excel ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Download className="w-4 h-4" /> Download Excel</>
            )}
          </button>
        </div>

        {/* PDF */}
        <div className="glass-card p-6 text-center hover:shadow-hover transition-all duration-200">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1">PDF Report</h3>
          <p className="text-xs text-gray-400 mb-4">Printable report with ICF header and branding</p>
          <button
            onClick={downloadPDF}
            disabled={loading.pdf}
            className="btn-primary w-full justify-center bg-red-50 hover:bg-red-600"
          >
            {loading.pdf ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Download className="w-4 h-4" /> Download PDF</>
            )}
          </button>
        </div>

        {/* Print */}
        <div className="glass-card p-6 text-center hover:shadow-hover transition-all duration-200">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Printer className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1">Print Report</h3>
          <p className="text-xs text-gray-400 mb-4">Open print dialog for direct printing</p>
          <button
            onClick={() => window.print()}
            className="btn-primary w-full justify-center"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportCenter;
