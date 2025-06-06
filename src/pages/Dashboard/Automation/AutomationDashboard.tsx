import React, { useState, useEffect } from 'react';
import { Bot, Zap, TrendingUp, Settings, Play, Pause, BarChart3 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { initializeAutomation } from '../../../lib/automationService';
import { formatCurrency } from '../../../lib/utils';
import { motion } from 'framer-motion';

interface AutomationRule {
  id: string;
  name: string;
  conditions: any;
  actions: any;
  is_active: boolean;
  created_at: string;
}

const AutomationDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [websites, setWebsites] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    websiteId: '',
    contentKeywords: '',
    minCommission: 5,
    autoCreatePopups: true,
    maxPopupsPerPage: 2
  });
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState({
    totalRules: 0,
    activeRules: 0,
    linksGenerated: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchAutomationRules();
    fetchWebsites();
    fetchStats();
  }, [user]);

  const fetchAutomationRules = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching automation rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebsites = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, url')
        .eq('user_id', user.id)
        .eq('verified', true);

      if (error) throw error;
      setWebsites(data || []);
    } catch (error) {
      console.error('Error fetching websites:', error);
    }
  };

  const fetchStats = async () => {
    try {
      if (!user) return;

      // Get automation stats
      const { data: rulesData } = await supabase
        .from('automation_rules')
        .select('is_active')
        .eq('user_id', user.id);

      const { data: linksData } = await supabase
        .from('affiliate_links')
        .select('id')
        .eq('user_id', user.id);

      const { data: analyticsData } = await supabase
        .from('link_analytics')
        .select('revenue')
        .eq('user_id', user.id);

      const totalRevenue = analyticsData?.reduce((sum, record) => sum + (record.revenue || 0), 0) || 0;

      setStats({
        totalRules: rulesData?.length || 0,
        activeRules: rulesData?.filter(rule => rule.is_active).length || 0,
        linksGenerated: linksData?.length || 0,
        revenue: totalRevenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      if (!user) throw new Error('User not authenticated');

      const conditions = {
        keywords: formData.contentKeywords.split(',').map(k => k.trim()),
        minCommission: formData.minCommission,
        websiteId: formData.websiteId
      };

      const actions = {
        autoCreateLinks: true,
        autoCreatePopups: formData.autoCreatePopups,
        maxPopupsPerPage: formData.maxPopupsPerPage,
        notifyUser: true
      };

      const { error } = await supabase
        .from('automation_rules')
        .insert({
          user_id: user.id,
          website_id: formData.websiteId,
          name: formData.name,
          conditions,
          actions,
          is_active: true
        });

      if (error) throw error;

      setShowCreateForm(false);
      setFormData({
        name: '',
        websiteId: '',
        contentKeywords: '',
        minCommission: 5,
        autoCreatePopups: true,
        maxPopupsPerPage: 2
      });
      fetchAutomationRules();
      fetchStats();
    } catch (error) {
      console.error('Error creating automation rule:', error);
    } finally {
      setCreating(false);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) throw error;
      fetchAutomationRules();
      fetchStats();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const testAutomation = async () => {
    try {
      if (!user || websites.length === 0) return;

      const sampleContent = `
        Looking for the best wireless headphones? After testing dozens of models, 
        I've found some amazing options that deliver incredible sound quality and comfort. 
        Whether you're into music production, gaming, or just want great audio for daily use,
        these headphones will transform your listening experience.
      `;

      const result = await initializeAutomation(user.id, websites[0].id, sampleContent);
      
      if (result.success) {
        alert(`Automation test successful! Generated ${result.data?.affiliateLinks.length} links and ${result.data?.popups.length} popups.`);
      } else {
        alert(`Automation test failed: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error('Error testing automation:', error);
      alert('Automation test failed. Please try again.');
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Automation Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automate your affiliate marketing with AI-powered content analysis
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={testAutomation}
            leftIcon={<Play size={18} />}
          >
            Test Automation
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            leftIcon={<Bot size={18} />}
          >
            Create Rule
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Bot size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Rules</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalRules}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <Zap size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Rules</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeRules}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <TrendingUp size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Links Generated</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.linksGenerated}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
              <BarChart3 size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.revenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Rule Modal */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create Automation Rule
            </h3>
            
            <form onSubmit={handleCreateRule} className="space-y-4">
              <Input
                label="Rule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Tech Product Automation"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <select
                  value={formData.websiteId}
                  onChange={(e) => setFormData({ ...formData, websiteId: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select a website</option>
                  {websites.map((website) => (
                    <option key={website.id} value={website.id}>
                      {website.title || website.url}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Content Keywords"
                value={formData.contentKeywords}
                onChange={(e) => setFormData({ ...formData, contentKeywords: e.target.value })}
                placeholder="headphones, audio, music, technology"
                helperText="Comma-separated keywords to trigger automation"
              />

              <Input
                label="Minimum Commission (%)"
                type="number"
                value={formData.minCommission}
                onChange={(e) => setFormData({ ...formData, minCommission: parseInt(e.target.value) })}
                min="1"
                max="100"
              />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoCreatePopups"
                  checked={formData.autoCreatePopups}
                  onChange={(e) => setFormData({ ...formData, autoCreatePopups: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoCreatePopups" className="text-sm text-gray-700 dark:text-gray-300">
                  Auto-create smart popups
                </label>
              </div>

              {formData.autoCreatePopups && (
                <Input
                  label="Max Popups Per Page"
                  type="number"
                  value={formData.maxPopupsPerPage}
                  onChange={(e) => setFormData({ ...formData, maxPopupsPerPage: parseInt(e.target.value) })}
                  min="1"
                  max="5"
                />
              )}

              <div className="flex space-x-3 pt-4">
                <Button type="submit" isLoading={creating} className="flex-1">
                  Create Rule
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Bot className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No automation rules yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create your first automation rule to start generating affiliate links automatically.
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowCreateForm(true)} leftIcon={<Bot size={18} />}>
              Create Rule
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Automation Rules</h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {rules.map((rule) => (
              <div key={rule.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {rule.name}
                      </h4>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rule.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>Keywords: {rule.conditions?.keywords?.join(', ') || 'None'}</p>
                      <p>Min Commission: {rule.conditions?.minCommission || 0}%</p>
                      <p>Auto Popups: {rule.actions?.autoCreatePopups ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRule(rule.id, rule.is_active)}
                      leftIcon={rule.is_active ? <Pause size={16} /> : <Play size={16} />}
                    >
                      {rule.is_active ? 'Pause' : 'Activate'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Settings size={16} />}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationDashboard;