import React, { useState, useEffect } from 'react';
import { Filter, X, Search, ChevronDown, Hash } from 'lucide-react';
import api from '../../utils/api';

const AdvancedFilters = ({ filters, onChange, onReset }) => {
  const [shops, setShops]       = useState([]);
  const [expanded, setExpanded] = useState(true);

  // Fetch shops based on selected sf_code division
  useEffect(() => {
    const url = filters.sf_code ? `/shops?sf_code=${filters.sf_code}` : '/shops';
    api.get(url).then(r => {
      setShops(r.data.data || []);
    }).catch(() => {});
  }, [filters.sf_code]);

  const handleChange = (key, value) => {
    const next = { ...filters, [key]: value };
    // If division changes, reset shop code selection
    if (key === 'sf_code') {
      next.shop_code = '';
    }
    onChange(next);
  };

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary-500" />
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Advanced Filters</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
            <X className="w-3 h-3" /> Reset
          </button>
          <button onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-600">
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">

          {/* Date From */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">From Date</label>
            <input
              type="date"
              value={filters.from_date || ''}
              onChange={e => handleChange('from_date', e.target.value)}
              className="form-input text-xs"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">To Date</label>
            <input
              type="date"
              value={filters.to_date || ''}
              onChange={e => handleChange('to_date', e.target.value)}
              className="form-input text-xs"
            />
          </div>

          {/* Division (SF) */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium font-semibold text-primary-600">Division (SF)</label>
            <select
              value={filters.sf_code || ''}
              onChange={e => handleChange('sf_code', e.target.value)}
              className="form-input text-xs font-semibold"
              style={{ borderColor: filters.sf_code === 'Fur' ? '#f59e0b' : filters.sf_code === 'Shell' ? '#6366f1' : undefined }}
            >
              <option value="">All (Fur + Shell)</option>
              <option value="Fur">🔶 Fur Division</option>
              <option value="Shell">🔷 Shell Division</option>
            </select>
          </div>

          {/* Shop */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">
              Shop {filters.sf_code ? `(${filters.sf_code})` : ''}
            </label>
            <select
              value={filters.shop_code || ''}
              onChange={e => handleChange('shop_code', e.target.value)}
              className="form-input text-xs font-semibold"
            >
              <option value="">All Shops</option>
              {shops.map(s => (
                <option key={s.shop_code} value={s.shop_code}>
                  {s.shop_code} – {s.shop_name}
                </option>
              ))}
            </select>
          </div>

          {/* Employee No. Search */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-semibold text-indigo-600">Employee No.</label>
            <div className="relative">
              <Hash className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search Emp No."
                value={filters.empno || ''}
                onChange={e => handleChange('empno', e.target.value)}
                className="form-input text-xs pl-7 font-mono font-semibold"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Category</label>
            <select
              value={filters.category || ''}
              onChange={e => handleChange('category', e.target.value)}
              className="form-input text-xs"
            >
              <option value="">All Categories</option>
              <option value="Supervisory">Supervisory</option>
              <option value="Non-Supervisory">Non-Supervisory</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Gender</label>
            <select
              value={filters.gender || ''}
              onChange={e => handleChange('gender', e.target.value)}
              className="form-input text-xs font-medium"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* UMID / Name Search */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="UMID / Name"
                value={filters.search || ''}
                onChange={e => handleChange('search', e.target.value)}
                className="form-input text-xs pl-7"
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
