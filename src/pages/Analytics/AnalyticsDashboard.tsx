import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, MousePointer, Calendar, Download, Filter,
  ChevronDown, X
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import { DateRange } from 'react-day-picker';

interface DashboardStats {
  impressions: number;
  clicks: number;
  conversionRate: number;
  revenue: number;
}

interface ChartData {
  date: string;
  impressions: number;
  clicks: number;
  revenue: number;
}

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    impressions: 0,
    clicks: 0,
    conversionRate: 0,
    revenue: 0
  });
  const [timeseriesData, setTimeseriesData] = useState<ChartData[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (user && dateRange?.from && dateRange?.to) {
      fetchAnalyticsData(dateRange.from, dateRange.to);
    }
  }, [user, dateRange]);

  const fetchAnalyticsData = async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const { data: analyticsData, error } = await supabase
        .from('analytics')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;

      // Process analytics data
      const processedData = analyticsData?.map(record => ({
        date: format(new Date(record.date), 'MMM dd'),
        impressions: record.impressions,
        clicks: record.clicks,
        revenue: record.revenue
      })) || [];

      setTimeseriesData(processedData);

      // Calculate totals
      const totals = analyticsData?.reduce((acc, curr) => ({
        impressions: acc.impressions + curr.impressions,
        clicks: acc.clicks + curr.clicks,
        revenue: acc.revenue + curr.revenue
      }), { impressions: 0, clicks: 0, revenue: 0 });

      setStats({
        impressions: totals?.impressions || 0,
        clicks: totals?.clicks || 0,
        conversionRate: totals?.clicks ? (totals.clicks / totals.impressions) * 100 : 0,
        revenue: totals?.revenue || 0
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Show demo data for new users or if there's an error
      showDemoData(startDate, endDate);
    } finally {
      setLoading(false);
    }
  };

  const showDemoData = (startDate: Date, endDate: Date) => {
    const demoData: ChartData[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      demoData.push({
        date: format(currentDate, 'MMM dd'),
        impressions: Math.floor(Math.random() * 1000) + 500,
        clicks: Math.floor(Math.random() * 100) + 50,
        revenue: parseFloat((Math.random() * 200 + 100).toFixed(2))
      });
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    setTimeseriesData(demoData);

    const totals = demoData.reduce((acc, curr) => ({
      impressions: acc.impressions + curr.impressions,
      clicks: acc.clicks + curr.clicks,
      revenue: acc.revenue + curr.revenue
    }), { impressions: 0, clicks: 0, revenue: 0 });

    setStats({
      impressions: totals.impressions,
      clicks: totals.clicks,
      conversionRate: (totals.clicks / totals.impressions) * 100,
      revenue: totals.revenue
    });
  };

  const handleQuickDateSelect = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date()
    });
    setShowDatePicker(false);
  };

  const exportData = async () => {
    setIsExporting(true);
    try {
      const csvData = [
        ['Date', 'Impressions', 'Clicks', 'Revenue'],
        ...timeseriesData.map(row => [
          row.date,
          row.impressions,
          row.clicks,
          row.revenue.toFixed(2)
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your affiliate performance and earnings
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowDatePicker(!showDatePicker)}
              leftIcon={<Calendar size={16} />}
              rightIcon={<ChevronDown size={16} />}
            >
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                : 'Select Date Range'}
            </Button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Date Range</h3>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleQuickDateSelect(7)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => handleQuickDateSelect(15)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md"
                  >
                    Last 15 Days
                  </button>
                  <button
                    onClick={() => handleQuickDateSelect(30)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md"
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={exportData}
            isLoading={isExporting}
            leftIcon={<Download size={16} />}
          >
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <TrendingUp size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Impressions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.impressions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <MousePointer size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Clicks</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.clicks.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Users size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.conversionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
              <DollarSign size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(stats.revenue)}
              </p>
            </div>
          </div>
        </div>
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
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeseriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'currentColor' }}
                stroke="currentColor"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: 'currentColor' }}
                stroke="currentColor"
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fill: 'currentColor' }}
                stroke="currentColor"
              />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="impressions"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="clicks"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rest of the dashboard components */}
    </div>
  );
};

export default AnalyticsDashboard;