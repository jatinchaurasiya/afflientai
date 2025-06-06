import React, { useState, useEffect } from 'react';
import { Palette, Eye, Settings, Zap, Play, Pause, BarChart3 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import { motion } from 'framer-motion';

interface PopupTemplate {
  id: string;
  name: string;
  type: 'overlay' | 'slide-in' | 'banner' | 'exit-intent';
  preview: string;
  settings: any;
}

interface Popup {
  id: string;
  website_id: string;
  name: string;
  config: any;
  trigger_rules: any;
  design_settings: any;
  targeting_rules: any;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
}

const PopupBuilder: React.FC = () => {
  const { user } = useAuthStore();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PopupTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    websiteId: '',
    affiliateLinkId: '',
    template: 'overlay-center',
    headline: '',
    description: '',
    ctaText: 'Learn More',
    triggerType: 'scroll_percentage',
    triggerValue: 50,
    colors: {
      primary: '#4F46E5',
      secondary: '#10B981',
      background: '#FFFFFF',
      text: '#1F2937'
    }
  });
  const [creating, setCreating] = useState(false);

  const templates: PopupTemplate[] = [
    {
      id: 'overlay-center',
      name: 'Center Overlay',
      type: 'overlay',
      preview: '/api/placeholder/300/200',
      settings: { width: '400px', height: 'auto', position: 'center' }
    },
    {
      id: 'slide-in-bottom',
      name: 'Bottom Slide-in',
      type: 'slide-in',
      preview: '/api/placeholder/300/200',
      settings: { position: 'bottom-right', width: '350px' }
    },
    {
      id: 'top-banner',
      name: 'Top Banner',
      type: 'banner',
      preview: '/api/placeholder/300/200',
      settings: { position: 'top', height: '60px' }
    },
    {
      id: 'exit-intent',
      name: 'Exit Intent Modal',
      type: 'exit-intent',
      preview: '/api/placeholder/300/200',
      settings: { width: '500px', height: 'auto' }
    }
  ];

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      if (!user) return;

      // Fetch popups
      const { data: popupsData } = await supabase
        .from('popups')
        .select(`
          *,
          websites!inner(domain, name)
        `)
        .order('created_at', { ascending: false });

      // Fetch websites
      const { data: websitesData } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Fetch affiliate links
      const { data: linksData } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      setPopups(popupsData || []);
      setWebsites(websitesData || []);
      setAffiliateLinks(linksData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      if (!user) throw new Error('User not authenticated');

      const popupConfig = {
        id: `popup_${Date.now()}`,
        websiteId: formData.websiteId,
        affiliateLink: affiliateLinks.find(l => l.id === formData.affiliateLinkId)?.affiliate_url || '',
        product: {
          name: affiliateLinks.find(l => l.id === formData.affiliateLinkId)?.title || 'Product',
          image: affiliateLinks.find(l => l.id === formData.affiliateLinkId)?.image_url || ''
        },
        trigger: {
          type: formData.triggerType,
          value: formData.triggerValue,
          delay: 1000
        },
        design: {
          template: formData.template,
          colors: formData.colors,
          content: {
            headline: formData.headline,
            description: formData.description,
            cta: formData.ctaText,
            image: affiliateLinks.find(l => l.id === formData.affiliateLinkId)?.image_url || ''
          }
        }
      };

      const { error } = await supabase
        .from('popups')
        .insert({
          website_id: formData.websiteId,
          affiliate_link_id: formData.affiliateLinkId,
          name: formData.name,
          config: popupConfig,
          trigger_rules: popupConfig.trigger,
          design_settings: popupConfig.design,
          targeting_rules: {
            frequency: 'once_per_session',
            userSegment: 'all'
          },
          status: 'active'
        });

      if (error) throw error;

      setShowBuilder(false);
      setFormData({
        name: '',
        websiteId: '',
        affiliateLinkId: '',
        template: 'overlay-center',
        headline: '',
        description: '',
        ctaText: 'Learn More',
        triggerType: 'scroll_percentage',
        triggerValue: 50,
        colors: {
          primary: '#4F46E5',
          secondary: '#10B981',
          background: '#FFFFFF',
          text: '#1F2937'
        }
      });
      fetchData();
    } catch (error) {
      console.error('Error creating popup:', error);
    } finally {
      setCreating(false);
    }
  };

  const togglePopupStatus = async (popupId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('popups')
        .update({ status: newStatus })
        .eq('id', popupId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling popup status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Draft
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Popup Builder</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create intelligent popups that convert visitors into customers
          </p>
        </div>
        
        <Button
          onClick={() => setShowBuilder(true)}
          leftIcon={<Palette size={18} />}
        >
          Create Popup
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Palette size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Popups</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{popups.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <Zap size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Popups</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {popups.filter(p => p.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Eye size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Views</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">12,456</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
              <BarChart3 size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">3.2%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Builder Modal */}
      {showBuilder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Create Smart Popup
            </h3>
            
            <form onSubmit={handleCreatePopup} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Configuration */}
                <div className="space-y-6">
                  <Input
                    label="Popup Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Product Showcase Popup"
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
                          {website.name || website.domain}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Affiliate Link
                    </label>
                    <select
                      value={formData.affiliateLinkId}
                      onChange={(e) => setFormData({ ...formData, affiliateLinkId: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select an affiliate link</option>
                      {affiliateLinks.map((link) => (
                        <option key={link.id} value={link.id}>
                          {link.title || link.product_id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, template: template.id });
                            setSelectedTemplate(template);
                          }}
                          className={`p-3 border rounded-lg text-left ${
                            formData.template === template.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{template.type}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    label="Headline"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="Discover Amazing Products"
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Check out these hand-picked products just for you"
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <Input
                    label="Call-to-Action Text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="Learn More"
                    required
                  />
                </div>

                {/* Right Column - Trigger & Design */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Trigger Type
                    </label>
                    <select
                      value={formData.triggerType}
                      onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="scroll_percentage">Scroll Percentage</option>
                      <option value="time_delay">Time Delay</option>
                      <option value="exit_intent">Exit Intent</option>
                    </select>
                  </div>

                  <Input
                    label={formData.triggerType === 'scroll_percentage' ? 'Scroll Percentage' : 
                           formData.triggerType === 'time_delay' ? 'Delay (seconds)' : 'Exit Intent Sensitivity'}
                    type="number"
                    value={formData.triggerValue}
                    onChange={(e) => setFormData({ ...formData, triggerValue: parseInt(e.target.value) })}
                    min="1"
                    max={formData.triggerType === 'scroll_percentage' ? 100 : 300}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Color Scheme
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Primary Color</label>
                        <input
                          type="color"
                          value={formData.colors.primary}
                          onChange={(e) => setFormData({
                            ...formData,
                            colors: { ...formData.colors, primary: e.target.value }
                          })}
                          className="w-full h-10 rounded border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Secondary Color</label>
                        <input
                          type="color"
                          value={formData.colors.secondary}
                          onChange={(e) => setFormData({
                            ...formData,
                            colors: { ...formData.colors, secondary: e.target.value }
                          })}
                          className="w-full h-10 rounded border border-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Live Preview
                    </label>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                      <div 
                        className="bg-white rounded-lg p-4 shadow-md max-w-sm mx-auto"
                        style={{ borderColor: formData.colors.primary }}
                      >
                        <h4 className="font-semibold text-lg mb-2" style={{ color: formData.colors.text }}>
                          {formData.headline || 'Your Headline'}
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          {formData.description || 'Your description will appear here'}
                        </p>
                        <button 
                          className="px-4 py-2 rounded text-white text-sm font-medium"
                          style={{ backgroundColor: formData.colors.primary }}
                        >
                          {formData.ctaText}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button type="submit" isLoading={creating} className="flex-1">
                  Create Popup
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBuilder(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Popups List */}
      {popups.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Palette className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No popups yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create your first smart popup to start converting visitors.
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowBuilder(true)} leftIcon={<Palette size={18} />}>
              Create Popup
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Popups</h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {popups.map((popup) => (
              <div key={popup.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {popup.name}
                      </h4>
                      <div className="ml-3">
                        {getStatusBadge(popup.status)}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>Template: {popup.design_settings?.template || 'Custom'}</p>
                      <p>Trigger: {popup.trigger_rules?.type || 'Unknown'} - {popup.trigger_rules?.value || 0}%</p>
                      <p>Created: {formatDate(popup.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePopupStatus(popup.id, popup.status)}
                      leftIcon={popup.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                    >
                      {popup.status === 'active' ? 'Pause' : 'Activate'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye size={16} />}
                    >
                      Preview
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<BarChart3 size={16} />}
                    >
                      Analytics
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

export default PopupBuilder;