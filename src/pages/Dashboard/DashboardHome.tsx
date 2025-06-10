import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, MousePointer, Calendar, Download, Filter,
  Globe, Bot, Brain, Zap, AlertTriangle, CheckCircle, ArrowRight, Palette, ShoppingBag
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { aiRecommendationService } from '../../lib/aiRecommendationEngine';

interface DashboardStats {
  websites: number;
  affiliateAccounts: number;
  activePopups: number;
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
    affiliateAccounts: 0,
    activePopups: 0,
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
        accountsResult,
        popupsResult,
        analyticsResult
      ] = await Promise.all([
        supabase.from('websites').select('id').eq('user_id', user.id),
        supabase.from('affiliate_accounts').select('id').eq('user_id', user.id).eq('status', 'active'),
        supabase.from('popups').select('id').eq('status', 'active'),
        supabase.from('link_analytics').select('*').eq('user_id', user.id)
      ]);

      // Calculate stats from real data
      const totalRevenue = analyticsResult.data?.reduce((sum, record) => sum + (record.revenue || 0), 0) || 0;
      const totalClicks = analyticsResult.data?.reduce((sum, record) => sum + (record.clicks || 0), 0) || 0;
      const totalConversions = analyticsResult.data?.reduce((sum, record) => sum + (record.conversions || 0), 0) || 0;

      setStats({
        websites: websitesResult.data?.length || 0,
        affiliateAccounts: accountsResult.data?.length || 0,
        activePopups: popupsResult.data?.length || 0,
        totalRevenue,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        avgLTV: 187.25,
        churnRisk: 15.3
      });

      // Generate mock timeseries data
      const days = dateRange === '7d' ? 7 : 30;
      const mockTimeseriesData = Array.from({ length: days }, (_, i) => {
        const date = subDays(new Date(), days - 1 - i);
        return {
          date: format(date, 'MMM dd'),
          revenue: Math.floor(Math.random() * 100) + 50,
          clicks: Math.floor(Math.random() * 200) + 100,
          conversions: Math.floor(Math.random() * 20) + 5
        };
      });

      setTimeseriesData(mockTimeseriesData);

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
          type: 'ai_analysis',
          message: 'AI analyzed new blog post and found 5 product opportunities',
          value: '5 products',
          time: '2 minutes ago',
          icon: Brain,
          color: 'text-purple-600'
        },
        {
          id: 2,
          type: 'popup_created',
          message: 'Smart popup created for Electronics category',
          value: 'Auto-generated',
          time: '15 minutes ago',
          icon: Palette,
          color: 'text-blue-600'
        },
        {
          id: 3,
          type: 'account_connected',
          message: 'Amazon Associates account connected successfully',
          value: 'Active',
          time: '1 hour ago',
          icon: ShoppingBag,
          color: 'text-green-600'
        },
        {
          id: 4,
          type: 'conversion',
          message: 'New conversion tracked from smart popup',
          value: '$24.50',
          time: '2 hours ago',
          icon: DollarSign,
          color: 'text-yellow-600'
        }
      ]);

      // AI Insights
      setAiInsights([
        {
          id: 1,
          title: 'High-Intent Content Detected',
          description: 'Your latest blog post shows 85% buying intent. Perfect for product recommendations.',
          action: 'View Analysis',
          priority: 'high',
          icon: Brain
        },
        {
          id: 2,
          title: 'Optimization Opportunity',
          description: 'Electronics category shows 34% higher conversion potential.',
          action: 'Optimize Strategy',
          priority: 'medium',
          icon: TrendingUp
        },
        {
          id: 3,
          title: 'New Products Available',
          description: '12 new products added to your connected affiliate accounts.',
          action: 'Review Products',
          priority: 'low',
          icon: ShoppingBag
        }
      ]);

      // Top Performers
      setTopPerformers([
        {
          id: 1,
          name: 'Tech Review Blog',
          type: 'website',
          performance: {
            clicks: 1234,
            conversions: 45,
            revenue: 567.89
          }
        },
        {
          id: 2,
          name: 'Electronics Popup',
          type: 'popup',
          performance: {
            clicks: 890,
            conversions: 32,
            revenue: 423.56
          }
        },
        {
          id: 3,
          name: 'Amazon Headphones',
          type: 'product',
          performance: {
            clicks: 567,
            conversions: 28,
            revenue: 345.67
          }
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    try {
      switch (action) {
        case 'analyze_content':
          // Trigger AI content analysis
          if (stats.websites > 0) {
            const { data: websites } = await supabase
              .from('websites')
              .select('id')
              .eq('user_id', user?.id)
              .limit(1);

            if (websites && websites.length > 0) {
              await aiRecommendationService.processNewBlogPost(
                websites[0].id,
                'https://example.com/test-post',
                user?.id || ''
              );
            }
          }
          break;
        case 'create_popup':
          // Navigate to popup builder
          window.location.href = '/dashboard/popups';
          break;
        case 'connect_account':
          // Navigate to affiliate accounts
          window.location.href = '/dashboard/affiliate-accounts';
          break;
      }
    } catch (error) {
      console.error('Quick action error:', error);
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
              <ShoppingBag size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Affiliate Accounts</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.affiliateAccounts}</p>
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
              <Palette size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Popups</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activePopups}</p>
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
          <Link to="/dashboard/ai-recommendations">
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
                    : insight.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
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
                        {item.type}
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
        
        <Link to="/dashboard/affiliate-accounts" className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-lg mr-4">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h3 className="font-medium">Connect Affiliate Account</h3>
              <p className="text-sm text-blue-100 mt-1">Link Amazon, eBay, Walmart & more</p>
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
        
        <Link to="/dashboard/ai-recommendations" className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-lg mr-4">
              <Brain size={24} />
            </div>
            <div>
              <h3 className="font-medium">AI Recommendations</h3>
              <p className="text-sm text-green-100 mt-1">View intelligent product suggestions</p>
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
                Optimization Opportunity
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                <p>
                  Our AI has detected optimization opportunities for {Math.round(stats.churnRisk)}% of your content. 
                  Visit the <Link to="/dashboard/ai-recommendations" className="font-medium underline">AI Recommendations</Link> dashboard 
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