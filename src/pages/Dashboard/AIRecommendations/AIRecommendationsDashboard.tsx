import React, { useState, useEffect } from 'react';
import { Brain, Zap, TrendingUp, Target, BarChart3, Settings, Play, Pause } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { aiRecommendationService } from '../../../lib/aiRecommendationEngine';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface RecommendationStats {
  totalAnalyzed: number;
  keywordsExtracted: number;
  productsRecommended: number;
  avgBuyingIntent: number;
  conversionRate: number;
  revenue: number;
}

const AIRecommendationsDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RecommendationStats>({
    totalAnalyzed: 0,
    keywordsExtracted: 0,
    productsRecommended: 0,
    avgBuyingIntent: 0,
    conversionRate: 0,
    revenue: 0
  });
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (!user) return;

      // Fetch website analytics
      const { data: analytics } = await supabase
        .from('website_analytics')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      // Fetch recent content analyses
      const { data: analyses } = await supabase
        .from('content_analysis')
        .select(`
          *,
          websites!inner(domain, user_id)
        `)
        .eq('websites.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate stats
      const totalStats = analytics?.reduce((acc, curr) => ({
        totalAnalyzed: acc.totalAnalyzed + curr.posts_analyzed,
        keywordsExtracted: acc.keywordsExtracted + curr.keywords_extracted,
        productsRecommended: acc.productsRecommended + curr.products_recommended,
        avgBuyingIntent: acc.avgBuyingIntent + curr.avg_buying_intent
      }), {
        totalAnalyzed: 0,
        keywordsExtracted: 0,
        productsRecommended: 0,
        avgBuyingIntent: 0
      }) || { totalAnalyzed: 0, keywordsExtracted: 0, productsRecommended: 0, avgBuyingIntent: 0 };

      setStats({
        ...totalStats,
        avgBuyingIntent: analytics?.length ? totalStats.avgBuyingIntent / analytics.length : 0,
        conversionRate: 3.2, // Mock data
        revenue: 1247.50 // Mock data
      });

      setRecentAnalyses(analyses || []);

      // Performance data for charts
      const chartData = analytics?.slice(0, 7).reverse().map(item => ({
        date: formatDate(item.date),
        analyzed: item.posts_analyzed,
        keywords: item.keywords_extracted,
        products: item.products_recommended,
        intent: item.avg_buying_intent
      })) || [];

      setPerformanceData(chartData);

      // Category distribution
      const categories = analyses?.reduce((acc, analysis) => {
        const category = analysis.category || 'general';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const categoryChartData = Object.entries(categories).map(([name, value], index) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'][index % 6]
      }));

      setCategoryData(categoryChartData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processTestContent = async () => {
    setIsProcessing(true);
    try {
      // Get user's first website
      const { data: websites } = await supabase
        .from('websites')
        .select('id')
        .eq('user_id', user?.id)
        .limit(1);

      if (websites && websites.length > 0) {
        const testUrl = 'https://example.com/test-blog-post';
        await aiRecommendationService.processNewBlogPost(
          websites[0].id,
          testUrl,
          user?.id || ''
        );
        
        // Refresh data
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error processing test content:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Recommendations</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Intelligent content analysis and product recommendations
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={processTestContent}
            isLoading={isProcessing}
            leftIcon={<Brain size={18} />}
          >
            Test Analysis
          </Button>
          <Button
            variant="outline"
            leftIcon={<Settings size={18} />}
          >
            Configure AI
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <BarChart3 size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Posts Analyzed</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalAnalyzed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <Target size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Keywords Extracted</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.keywordsExtracted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Zap size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Products Recommended</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.productsRecommended}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
              <TrendingUp size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Buying Intent</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {(stats.avgBuyingIntent * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            AI Analysis Performance
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="analyzed"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Posts Analyzed"
                />
                <Line
                  type="monotone"
                  dataKey="keywords"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Keywords Extracted"
                />
                <Line
                  type="monotone"
                  dataKey="products"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Products Recommended"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Content Categories
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Content Analyses</h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentAnalyses.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No content analyses yet. Connect your website and publish content to see AI recommendations.
            </div>
          ) : (
            recentAnalyses.map((analysis) => (
              <div key={analysis.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {analysis.websites.domain}
                      </h4>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        analysis.analysis_score > 70 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : analysis.analysis_score > 40
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        Score: {analysis.analysis_score}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>Category: {analysis.category}</p>
                      <p>Keywords: {analysis.keywords?.slice(0, 5).join(', ')}</p>
                      <p>Buying Intent: {(analysis.buying_intent_score * 100).toFixed(1)}%</p>
                      <p>Analyzed: {formatDate(analysis.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Brain size={16} />}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Configuration Panel */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-4">AI Recommendation Engine</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Content Analysis Features</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <Brain size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                Natural Language Processing for keyword extraction
              </li>
              <li className="flex items-start">
                <Target size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                Buying intent detection and scoring
              </li>
              <li className="flex items-start">
                <Zap size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                Real-time product matching and recommendations
              </li>
              <li className="flex items-start">
                <TrendingUp size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                User behavior pattern analysis
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recommendation Algorithm</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <BarChart3 size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Content-based filtering (50% weight)
              </li>
              <li className="flex items-start">
                <BarChart3 size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                User behavior analysis (30% weight)
              </li>
              <li className="flex items-start">
                <BarChart3 size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Session-based recommendations (20% weight)
              </li>
              <li className="flex items-start">
                <BarChart3 size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Commission rate optimization
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendationsDashboard;