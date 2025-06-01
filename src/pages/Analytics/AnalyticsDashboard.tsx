import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  MousePointer, 
  ShoppingCart, 
  Calendar, 
  ChevronDown,
  Filter,
  Download
} from 'lucide-react';
import Button from '../../components/ui/Button';
import AnalyticsLineChart from '../../components/analytics/AnalyticsLineChart';
import AnalyticsBarChart from '../../components/analytics/AnalyticsBarChart';
import AnalyticsDataTable from '../../components/analytics/AnalyticsDataTable';
import TopPerformingWidgets from '../../components/analytics/TopPerformingWidgets';
import PopularProducts from '../../components/analytics/PopularProducts';

const AnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('last7days');
  const [showFilters, setShowFilters] = useState(false);
  
  // Mock data - would be fetched from API in real app
  const overviewStats = [
    { name: 'Total Revenue', value: '$1,284.35', change: '+12.5%', trend: 'up', icon: <DollarSign size={20} /> },
    { name: 'Impressions', value: '24,521', change: '+8.2%', trend: 'up', icon: <TrendingUp size={20} /> },
    { name: 'Clicks', value: '1,832', change: '+18.7%', trend: 'up', icon: <MousePointer size={20} /> },
    { name: 'Conversions', value: '145', change: '+5.3%', trend: 'up', icon: <ShoppingCart size={20} /> },
  ];
  
  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 days' },
    { value: 'last30days', label: 'Last 30 days' },
    { value: 'thisMonth', label: 'This month' },
    { value: 'lastMonth', label: 'Last month' },
    { value: 'custom', label: 'Custom range' },
  ];
  
  const getDateRangeLabel = () => {
    return dateRangeOptions.find(option => option.value === dateRange)?.label || 'Select date range';
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
        
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Filter size={16} className="mr-2" />
              <span>Filters</span>
            </button>
            
            {showFilters && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    By Blog
                  </button>
                  <button
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    By Widget
                  </button>
                  <button
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    By Product Category
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Calendar size={16} className="mr-2" />
              <span>{getDateRangeLabel()}</span>
              <ChevronDown size={16} className="ml-2" />
            </button>
          </div>
          
          <Button
            variant="outline"
            leftIcon={<Download size={16} />}
            className="hidden sm:flex"
          >
            Export
          </Button>
        </div>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {overviewStats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {stat.icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">{stat.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</div>
                    <div
                      className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.trend === 'up' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                      }`}
                    >
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Revenue Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Revenue Overview</h2>
          <div className="mt-2 sm:mt-0 flex space-x-2">
            <button
              className="px-3 py-1 text-sm rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            >
              Revenue
            </button>
            <button
              className="px-3 py-1 text-sm rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Clicks
            </button>
            <button
              className="px-3 py-1 text-sm rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Conversions
            </button>
          </div>
        </div>
        
        <div className="h-80">
          <AnalyticsLineChart />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Performing Widgets */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Performing Widgets</h2>
          <TopPerformingWidgets />
        </div>
        
        {/* Popular Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Popular Products</h2>
          <PopularProducts />
        </div>
      </div>
      
      {/* Performance by Blog */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Performance by Blog</h2>
        <div className="h-80">
          <AnalyticsBarChart />
        </div>
      </div>
      
      {/* Detailed Analytics Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Detailed Analytics</h2>
          <div className="mt-2 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download size={14} />}
            >
              Export CSV
            </Button>
          </div>
        </div>
        <AnalyticsDataTable />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;