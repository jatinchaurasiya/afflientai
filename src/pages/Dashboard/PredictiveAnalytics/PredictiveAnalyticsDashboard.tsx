import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, Users, Zap, AlertTriangle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { formatCurrency } from '../../../lib/utils';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface PredictionData {
  conversionProbability: number;
  optimalTiming: string;
  userLTV: number;
  churnRisk: number;
  recommendedActions: string[];
}

const PredictiveAnalyticsDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [modelPerformance, setModelPerformance] = useState({
    accuracy: 87.3,
    precision: 84.1,
    recall: 89.2,
    f1Score: 86.5
  });

  // Mock data for demonstration
  const conversionTrendData = [
    { date: '2024-01-01', predicted: 3.2, actual: 3.1 },
    { date: '2024-01-02', predicted: 3.5, actual: 3.4 },
    { date: '2024-01-03', predicted: 3.8, actual: 3.9 },
    { date: '2024-01-04', predicted: 4.1, actual: 4.0 },
    { date: '2024-01-05', predicted: 4.3, actual: 4.2 },
    { date: '2024-01-06', predicted: 4.0, actual: 4.1 },
    { date: '2024-01-07', predicted: 3.9, actual: 3.8 }
  ];

  const userSegmentData = [
    { name: 'High Value', value: 25, color: '#10B981' },
    { name: 'Medium Value', value: 45, color: '#3B82F6' },
    { name: 'Developing', value: 20, color: '#F59E0B' },
    { name: 'Low Value', value: 10, color: '#EF4444' }
  ];

  const churnRiskData = [
    { segment: 'High Risk', count: 45, percentage: 15 },
    { segment: 'Medium Risk', count: 120, percentage: 40 },
    { segment: 'Low Risk', count: 135, percentage: 45 }
  ];

  useEffect(() => {
    fetchPredictiveData();
  }, [user]);

  const fetchPredictiveData = async () => {
    try {
      // In a real implementation, this would fetch from your ML models
      // For now, we'll simulate the data
      
      const mockPredictions: PredictionData[] = [
        {
          conversionProbability: 0.73,
          optimalTiming: 'scroll_60%',
          userLTV: 245.50,
          churnRisk: 0.15,
          recommendedActions: ['Display high-intent popup', 'Offer premium products', 'Personalize content']
        },
        {
          conversionProbability: 0.45,
          optimalTiming: 'time_30s',
          userLTV: 120.25,
          churnRisk: 0.35,
          recommendedActions: ['Nurture with educational content', 'Provide value-add offers', 'Engage with email sequence']
        }
      ];

      setPredictions(mockPredictions);
    } catch (error) {
      console.error('Error fetching predictive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runPredictionModel = async (modelType: string) => {
    try {
      // Simulate running a prediction model
      console.log(`Running ${modelType} prediction model...`);
      
      // In a real implementation, this would trigger your ML pipeline
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh data after model run
      fetchPredictiveData();
    } catch (error) {
      console.error('Error running prediction model:', error);
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Predictive Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered insights to optimize your affiliate marketing performance
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => runPredictionModel('conversion')}
            leftIcon={<Brain size={18} />}
          >
            Run Conversion Model
          </Button>
          <Button
            onClick={() => runPredictionModel('all')}
            leftIcon={<Zap size={18} />}
          >
            Refresh All Models
          </Button>
        </div>
      </div>

      {/* Model Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Target size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Model Accuracy</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{modelPerformance.accuracy}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <TrendingUp size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Precision</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{modelPerformance.precision}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Brain size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Recall</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{modelPerformance.recall}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
              <Zap size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">F1 Score</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{modelPerformance.f1Score}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Conversion Prediction Accuracy */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Conversion Prediction vs Actual
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversionTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Predicted"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Actual"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Segment Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            User LTV Segments
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userSegmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userSegmentData.map((entry, index) => (
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

      {/* Churn Risk Analysis */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Churn Risk Analysis
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={churnRiskData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="segment" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High-Priority Recommendations */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="mr-2 text-orange-500" size={20} />
            High-Priority Recommendations
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-medium text-orange-800 dark:text-orange-300">
                Optimize Popup Timing for Mobile Users
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                Mobile users show 23% higher conversion when popups trigger at 45% scroll vs 60%
              </p>
              <div className="mt-2">
                <Button size="sm" variant="outline">Apply Optimization</Button>
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-medium text-red-800 dark:text-red-300">
                45 Users at High Churn Risk
              </h4>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                Implement retention campaign for users with declining engagement
              </p>
              <div className="mt-2">
                <Button size="sm" variant="outline">Create Campaign</Button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-300">
                Product Category Opportunity
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Electronics category shows 34% higher LTV potential - increase focus
              </p>
              <div className="mt-2">
                <Button size="sm" variant="outline">Adjust Strategy</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Model Insights */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Brain className="mr-2 text-purple-500" size={20} />
            Model Insights
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-purple-800 dark:text-purple-300">
                Conversion Probability Model
              </h4>
              <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                Top factors: Time on page (32%), Scroll depth (28%), Device type (18%)
              </p>
              <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                Last updated: 2 hours ago
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-800 dark:text-green-300">
                LTV Prediction Model
              </h4>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                Average predicted LTV: {formatCurrency(187.25)} with 89% confidence
              </p>
              <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                Last updated: 4 hours ago
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
                Churn Prevention Model
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                Early warning system identified 12 at-risk users this week
              </p>
              <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                Last updated: 1 hour ago
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;