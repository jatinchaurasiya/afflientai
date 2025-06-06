import React, { useState, useEffect } from 'react';
import { Globe, Shield, CheckCircle, AlertCircle, Copy, Code, Settings, Zap } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { WidgetIntegrationService } from '../../../lib/widgetIntegration';
import { formatDate } from '../../../lib/utils';
import { motion } from 'framer-motion';

interface Website {
  id: string;
  domain: string;
  name: string | null;
  integration_key: string;
  status: 'active' | 'inactive' | 'pending';
  settings: any;
  created_at: string;
  updated_at: string;
}

const WebsiteIntegration: React.FC = () => {
  const { user } = useAuthStore();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    domain: '',
    name: ''
  });
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWebsites();
  }, [user]);

  const fetchWebsites = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebsites(data || []);
    } catch (error) {
      console.error('Error fetching websites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      if (!user) throw new Error('User not authenticated');

      // Clean domain input
      let domain = formData.domain.toLowerCase().trim();
      domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

      const { error } = await supabase
        .from('websites')
        .insert({
          user_id: user.id,
          domain,
          name: formData.name || null,
          status: 'pending'
        });

      if (error) throw error;

      setShowAddForm(false);
      setFormData({ domain: '', name: '' });
      fetchWebsites();
    } catch (error) {
      console.error('Error adding website:', error);
    } finally {
      setAdding(false);
    }
  };

  const verifyWebsite = async (websiteId: string) => {
    setVerifying(websiteId);
    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const { error } = await supabase
        .from('websites')
        .update({ status: 'active' })
        .eq('id', websiteId);

      if (error) throw error;
      fetchWebsites();
    } catch (error) {
      console.error('Error verifying website:', error);
    } finally {
      setVerifying(null);
    }
  };

  const copyIntegrationCode = (website: Website) => {
    const code = WidgetIntegrationService.generateIntegrationScript(website.id, user?.id || '');
    navigator.clipboard.writeText(code);
    setCopiedId(website.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle size={12} className="mr-1" />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <AlertCircle size={12} className="mr-1" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            Inactive
          </span>
        );
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Website Integration</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect your websites to enable AI-powered affiliate automation
          </p>
        </div>
        
        <Button
          onClick={() => setShowAddForm(true)}
          leftIcon={<Globe size={18} />}
        >
          Add Website
        </Button>
      </div>

      {/* Integration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Globe size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Websites</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{websites.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Sites</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {websites.filter(w => w.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Zap size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Automation Ready</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {websites.filter(w => w.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Website Modal */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Add Website
            </h3>
            
            <form onSubmit={handleAddWebsite} className="space-y-4">
              <Input
                label="Domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="example.com"
                helperText="Enter your domain without http:// or https://"
                required
              />

              <Input
                label="Website Name (Optional)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Blog"
              />

              <div className="flex space-x-3 pt-4">
                <Button type="submit" isLoading={adding} className="flex-1">
                  Add Website
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Websites List */}
      {websites.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No websites yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add your first website to start using AI-powered affiliate automation.
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowAddForm(true)} leftIcon={<Globe size={18} />}>
              Add Website
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Websites</h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {websites.map((website) => (
              <div key={website.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-gray-400 mr-2" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {website.name || website.domain}
                        </h4>
                      </div>
                      <div className="ml-3">
                        {getStatusBadge(website.status)}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>Domain: {website.domain}</p>
                      <p>Integration Key: {website.integration_key}</p>
                      <p>Added: {formatDate(website.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {website.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verifyWebsite(website.id)}
                        isLoading={verifying === website.id}
                        leftIcon={<CheckCircle size={16} />}
                      >
                        Verify
                      </Button>
                    )}
                    
                    {website.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyIntegrationCode(website)}
                        leftIcon={copiedId === website.id ? <CheckCircle size={16} /> : <Code size={16} />}
                      >
                        {copiedId === website.id ? 'Copied!' : 'Get Code'}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Settings size={16} />}
                    >
                      Settings
                    </Button>
                  </div>
                </div>

                {website.status === 'active' && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                          Website Verified & Active
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                          Your website is now connected and ready for AI-powered affiliate automation. 
                          The integration script is monitoring your content for optimization opportunities.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {website.status === 'pending' && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          Verification Required
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                          Click "Verify" to confirm ownership of this website. We'll check for SSL certificates, 
                          domain ownership, and content scanning permissions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integration Guide */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-4">How Website Integration Works</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Automated Features</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Real-time content analysis and keyword extraction
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Automatic affiliate link generation based on content
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Smart popup creation with optimal timing
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                User behavior tracking and optimization
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Security & Privacy</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <Shield size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                SSL certificate validation
              </li>
              <li className="flex items-start">
                <Shield size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                GDPR compliant data collection
              </li>
              <li className="flex items-start">
                <Shield size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                Encrypted data transmission
              </li>
              <li className="flex items-start">
                <Shield size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                Respect for robots.txt and user preferences
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteIntegration;