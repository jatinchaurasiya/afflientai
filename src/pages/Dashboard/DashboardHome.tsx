import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, MousePointer, Calendar, Download, Filter 
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

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

interface BlogPerformance {
  blogId: string;
  title: string;
  clicks: number;
  revenue: number;
}

interface ClickEvent {
  id: string;
  timestamp: string;
  productName: string;
  blogUrl: string;
  revenue: number;
}

const DashboardHome: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    impressions: 0,
    clicks: 0,
    conversionRate: 0,
    revenue: 0
  });
  const [timeseriesData, setTimeseriesData] = useState<ChartData[]>([]);
  const [blogPerformance, setBlogPerformance] = useState<BlogPerformance[]>([]);
  const [recentClicks, setRecentClicks] = useState<ClickEvent[]>([]);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // In a real app, these would be actual Supabase queries
      // For now, we'll use mock data
      
      // Generate mock timeseries data
      const days = dateRange === '7d' ? 7 : 15 : 30;
      const mockTimeseries = Array.from({ length: days }).map((_, i) => {
        const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
        const impressions = Math.floor(Math.random() * 1000) + 500;
        const clicks = Math.floor(impressions * (Math.random() * 0.1 + 0.05));
        const revenue = clicks * (Math.random() * 0.5 + 0.25);
        return { date, impressions, clicks, revenue };
      });

      setTimeseriesData(mockTimeseries);

      // Calculate today's stats
      const today = mockTimeseries[mockTimeseries.length - 1];
      setStats({
        impressions: today.impressions,
        clicks: today.clicks,
        conversionRate: (today.clicks / today.impressions) * 100,
        revenue: today.revenue
      });

      // Mock blog performance data
      setBlogPerformance([
        { blogId: '1', title: 'Tech Review Blog', clicks: 450, revenue: 225.50 },
        { blogId: '2', title: 'Travel Adventures', clicks: 380, revenue: 190.25 },
        { blogId: '3', title: 'Cooking Blog', clicks: 320, revenue: 160.00 },
      ]);

      // Mock recent clicks
      setRecentClicks([
        { 
          id: '1', 
          timestamp: new Date().toISOString(),
          productName: 'Wireless Headphones',
          blogUrl: 'https://techblog.com/review',
          revenue: 12.50
        },
        { 
          id: '2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          productName: 'Travel Backpack',
          blogUrl: 'https://travelblog.com/gear',
          revenue: 8.75
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          productName: 'Kitchen Mixer',
          blogUrl: 'https://cookingblog.com/tools',
          revenue: 15.25
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your affiliate performance and earnings
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button
            variant="outline"
            leftIcon={<Calendar size={16} />}
            onClick={() => setDateRange(dateRange === '7d' ? '30d' : '7d')}
          >
            {dateRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
          </Button>
          
          <Button
            variant="outline"
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Performance Trend</h2>
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

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Performing Blogs</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={blogPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="title"
                  tick={{ fill: 'currentColor' }}
                  stroke="currentColor"
                />
                <YAxis 
                  tick={{ fill: 'currentColor' }}
                  stroke="currentColor"
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="clicks" fill="#3B82F6" />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h2>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter size={16} />}
            >
              Filter
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Blog URL
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentClicks.map((click) => (
                <tr key={click.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(click.timestamp), 'MMM d, h:mm a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {click.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                    <a href={click.blogUrl} target="_blank" rel="noopener noreferrer">
                      {click.blogUrl}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                    {formatCurrency(click.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;