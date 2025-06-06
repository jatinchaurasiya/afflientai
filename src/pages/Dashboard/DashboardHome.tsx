import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, MousePointer, Calendar, Download, Filter,
  Globe, Link2, Bot, Brain, Zap, AlertTriangle, CheckCircle, ArrowRight, Palette
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface DashboardStats {
  websites: number;
  affiliateLinks: number;
  activePopups: number;
  automationRules: number;
  totalRevenue: number;
  conversionRate: number;
  avgLTV: number;
  churnRisk: number;
}

interface ChartData {
  date: string;
  revenue: number;
  clicks: number;
  conversions: number;
}

interface PlatformData {
  name: string;
  value: number;
  color: string;
}

const DashboardHome: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    websites: 0,
    affiliateLinks: 0,
    activePopups: 0,
    automationRules: 0,
    totalRevenue: 0,
    conversionRate: 0,
    avgLTV: 187.25,
    churnRisk: 15.3
  });
  const [timeseriesData, setTimeseriesData] = useState<ChartData[]>([]);
  const [platformData, setPlatformData] = useState<PlatformData[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('7d');
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (!user) return;

      // Fetch real data from Supabase
      const [
        websitesResult,
        linksResult,
        popupsResult,
        automationResult,
        analyticsResult
      ] = await Promise.all([
        supabase.from('websites').select('id').eq('user_id', user.id),
        supabase.from('affiliate_links').select('id').eq('user_id', user.id).eq('is_active', true),
        supabase.from('popups').select('id').eq('status', 'active'),
        supabase.from('automation_rules').select('id').eq('user_id', user.id).eq('is_active', true),
        supabase.from('link_analytics').select('*').eq('user_id', user.id)
      ]);

      // Calculate stats
      const totalRevenue = analyticsResult.data?.reduce((sum, record) => sum + (record.revenue || 0), 0) || 0;
      const totalClicks = analyticsResult.data?.reduce((sum, record) => sum + (record.clicks || 0), 0) || 0;
      const totalConversions = analyticsResult.data?.reduce((sum, record) => sum + (record.conversions || 0), 0) || 0;

      setStats({
        websites: websitesResult.data?.length || 0,
        affiliateLinks: linksResult.data?.length || 0,
        activePopups: popupsResult.data?.length || 0,
        automationRules: automationResult.data?.length || 0,
        totalRevenue,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        avgLTV: 187.25, // Mock data for now
        churnRisk: 15.3 // Mock data for now
      });

      // Generate timeseries data
      const days = dateRange === '7d' ? 7 : 30;
      const mockTimeseries = Array.from({ length: days }).map((_, i) => {
        const date = format(subDays(new Date(), days - 1 - i), 'MMM dd');
        return {
          date,
          revenue: Math.floor(Math.random() * 500) + 100,
          clicks: Math.floor(Math.random() * 200) + 50,
          conversions: Math.floor(Math.random() * 20) + 5
        };
      });

      setTimeseriesData(mockTimeseries);

      // Platform distribution data
      setPlatformData([
        { name: 'Amazon', value: 45, color: '#FF9500' },
        { name: 'eBay', value: 30, color: '#0064D2' },
        { name: 'Walmart', value: 15, color: '#004C91' },
        { name: 'Other', value: 10, color: '#6B7280' }
      ]);

      // Recent activity
      setRecentActivity([
        {
          id: 1,
          type: 'conversion',
          message: 'New conversion on Tech Blog',
          value: '$24.50',
          time: '2 minutes ago',
          icon: DollarSign,
          color: 'text-green-600'
        },
        {
          id: 2,
          type: 'automation',
          message: 'Automation rule triggered for Electronics category',
          value: '3 links created',
          time: '15 minutes ago',
          icon: Bot,
          color: 'text-blue-600'
        },
        {
          id: 3,
          type: 'popup',
          message: 'Smart popup achieved 4.2% conversion rate',
          value: '12 conversions',
          time: '1 hour ago',
          icon: Zap,
          color: 'text-purple-600'
        },
        {
          id: 4,
          type: 'prediction',
          message: 'AI identified high-value user segment',
          value: 'LTV: $340',
          time: '2 hours ago',
          icon: Brain,
          color: 'text-indigo-600'
        }
      ]);

      // AI Insights
      setAiInsights([
        {
          id: 1,
          title: 'Conversion Opportunity',
          description: 'Mobile users show 23% higher conversion when popups trigger at 45% scroll vs 60%',
          action: 'Apply Optimization',
          priority: 'high',
          icon: TrendingUp
        },
        {
          id: 2,
          title: 'Churn Risk Alert',
          description: '45 users with declining engagement identified as high churn risk',
          action: 'Create Retention Campaign',
          priority: 'high',
          icon: AlertTriangle
        },
        {
          id: 3,
          title: 'Product Category Opportunity',
          description: 'Electronics category shows 34% higher LTV potential',
          action: 'Adjust Strategy',
          priority: 'medium',
          icon: DollarSign
        }
      ]);

      // Top Performers
      setTopPerformers([
        {
          id: 1,
          name: 'Wireless Headphones Review',
          type: 'blog',
          performance: {
            clicks: 342,
            conversions: 28,
            revenue: 560.75
          }
        },
        {
          id: 2,
          name: 'Best Gaming Laptops 2025',
          type: 'blog',
          performance: {
            clicks: 287,
            conversions: 19,
            revenue: 475.25
          }
        },
        {
          id: 3,
          name: 'Summer Travel Essentials',
          type: 'popup',
          performance: {
            clicks: 156,
            conversions: 12,
            revenue: 320.50
          }
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
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
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.full_name || user?.email.split('@')[0]}!
            </h1>
            <p className="text-blue-100 mt-1">
              Your AI-powered affiliate marketing platform is working hard for you
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <div className="text-blue-100 text-sm">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
              <div className="text-blue-100 text-sm">Conversion Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Globe size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Connected Websites</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.websites}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <Link2 size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Affiliate Links</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.affiliateLinks}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Bot size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Automations</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.automationRules}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
              <Brain size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. User LTV</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.avgLTV)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI-Powered Insights</h3>
          </div>
          <Link to="/dashboard/predictive">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight size={16} />}>
              View All Insights
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
          {aiInsights.map((insight) => (
            <div key={insight.id} className="p-6">
              <div className="flex items-start">
                <div className={`p-2 rounded-lg ${
                  insight.priority === 'high' 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                    : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                } mr-4`}>
                  <insight.icon size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{insight.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.description}</p>
                  <Button size="sm" variant="outline" className="mt-3">
                    {insight.action}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Revenue & Clicks</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setDateRange('7d')}
                className={`px-3 py-1 text-xs rounded-md ${
                  dateRange === '7d'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDateRange('30d')}
                className={`px-3 py-1 text-xs rounded-md ${
                  dateRange === '30d'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  stroke="currentColor" 
                  tick={{ fill: 'currentColor' }}
                  tickLine={{ stroke: 'currentColor' }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="currentColor"
                  tick={{ fill: 'currentColor' }}
                  tickLine={{ stroke: 'currentColor' }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  stroke="currentColor"
                  tick={{ fill: 'currentColor' }}
                  tickLine={{ stroke: 'currentColor' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    borderColor: '#374151',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  name="Revenue ($)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="clicks"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  name="Clicks"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Platform Distribution</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={{ stroke: '#6B7280', strokeWidth: 1 }}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Percentage']}
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    borderColor: '#374151',
                    color: '#F9FAFB'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Top Performers & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Top Performers</h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {topPerformers.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                    <div className="flex items-center mt-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {item.type === 'blog' ? 'Blog' : 'Popup'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {item.performance.conversions} conversions
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.performance.revenue)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.performance.clicks} clicks
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-center">
            <Link to="/dashboard/analytics" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all analytics
            </Link>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex">
                  <div className={`p-2 rounded-lg ${activity.color} bg-opacity-10 mr-3`}>
                    <activity.icon size={18} className={activity.color} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {activity.value}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-center">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all activity
            </button>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Link to="/dashboard/affiliate-links" className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-lg mr-4">
              <Link2 size={24} />
            </div>
            <div>
              <h3 className="font-medium">Create Affiliate Link</h3>
              <p className="text-sm text-blue-100 mt-1">Generate trackable links for your content</p>
            </div>
          </div>
        </Link>
        
        <Link to="/dashboard/popups" className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-lg mr-4">
              <Palette size={24} />
            </div>
            <div>
              <h3 className="font-medium">Build Smart Popup</h3>
              <p className="text-sm text-purple-100 mt-1">Create AI-optimized conversion popups</p>
            </div>
          </div>
        </Link>
        
        <Link to="/dashboard/automation" className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-lg mr-4">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="font-medium">Setup Automation</h3>
              <p className="text-sm text-green-100 mt-1">Automate affiliate marketing tasks</p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Churn Risk Alert */}
      {stats.churnRisk > 10 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Churn Risk Alert
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                <p>
                  Our AI has detected {Math.round(stats.churnRisk)}% of your users are at risk of churning. 
                  Visit the <Link to="/dashboard/predictive" className="font-medium underline">Predictive Analytics</Link> dashboard 
                  to see detailed insights and recommended actions.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardHome;