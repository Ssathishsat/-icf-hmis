import React, { useState, useEffect } from 'react';
import { BarChart3, ExternalLink } from 'lucide-react';
import ShopDistributionChart from '../components/dashboard/ShopDistributionChart';
import ShopDrilldownModal from '../components/modals/ShopDrilldownModal';
import AdvancedFilters from '../components/filters/AdvancedFilters';
import { getRiskLevel } from '../utils/helpers';
import api from '../utils/api';

const defaultFilters = {
  from_date: '2022-01-01',
  to_date:   '2026-12-31',
};

const ShopAnalytics = () => {
  const [filters, setFilters]         = useState(defaultFilters);
  const [shopData, setShopData]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [drilldownShop, setDrilldown] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/shop-distribution', { params: filters })
      .then(r => setShopData(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Shop Analytics</h2>
          <p className="text-sm text-gray-400">Click any shop to view detailed drilldown</p>
        </div>
      </div>

      <AdvancedFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      <ShopDistributionChart data={shopData} loading={loading} onShopClick={setDrilldown} />

      {/* Shop Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {shopData.map(shop => {
          const risk = getRiskLevel(shop.sick_count);
          return (
            <div
              key={shop.shop_code}
              onClick={() => setDrilldown(shop.shop_code)}
              className="glass-card p-4 cursor-pointer hover:shadow-hover hover:-translate-y-1 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-primary-600 text-sm">{shop.shop_code}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{shop.shop_name}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400 transition-colors" />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">{shop.sick_count}</p>
                  <p className="text-xs text-gray-400">Sick</p>
                </div>
                <div className="text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${risk.badge}`}>
                    {risk.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {drilldownShop && (
        <ShopDrilldownModal
          shopCode={drilldownShop}
          filters={filters}
          onClose={() => setDrilldown(null)}
        />
      )}
    </div>
  );
};

export default ShopAnalytics;
