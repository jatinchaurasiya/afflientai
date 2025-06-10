import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, CheckCircle, AlertCircle, Loader2, Edit3, Trash2, RefreshCw, Info, ExternalLink } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import { motion } from 'framer-motion';

type PlatformType = 'amazon' | 'ebay' | 'walmart' | 'shareasale' | 'cj_affiliate';

interface AffiliateAccount {
  id: string;
  platform: PlatformType;
  associate_tag: string | null;
  api_key: string | null;
  status: 'active' | 'inactive' | 'pending';
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PlatformInfo {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  fields: {
    name: string;
    label: string;
    type: string;
    placeholder: string;
    required: boolean;
  }[];
  instructions?: string[];
}

const AffiliateAccountsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState<AffiliateAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('amazon');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const platforms: Record<PlatformType, PlatformInfo> = {
    amazon: {
      name: 'Amazon Associates',
      icon: <ShoppingBag size={20} />,
      color: 'bg-orange-500',
      description: 'Connect your Amazon Associates account to recommend products from the world\'s largest marketplace.',
      fields: [
        { name: 'associate_tag', label: 'Associate Tag', type: 'text', placeholder: 'yourtag-20', required: true },
        { name: 'api_key', label: 'Access Key ID', type: 'password', placeholder: 'AKIAIOSFODNN7EXAMPLE', required: true },
        { name: 'api_secret', label: 'Secret Access Key', type: 'password', placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', required: true }
      ],
      instructions: [
        '✅ **Step 1: Get Your Associate Tag**',
        '• Go to Amazon Associates Central (https://affiliate-program.amazon.com)',
        '• Log in with your affiliate account',
        '• Click on your email/username in the top right → Account Settings',
        '• Under Account Information, find your Tracking ID (this is your Associate Tag)',
        '',
        '✅ **Step 2: Get Access Key ID & Secret Access Key**',
        '**Prerequisites:**',
        '• Approved Amazon Associates account',
        '• At least 3 qualifying sales to activate Product Advertising API access',
        '',
        '**Steps to get API keys:**',
        '• From Amazon Associates Central, go to Tools → Product Advertising API',
        '• Click "Join" or "Manage Your Credentials"',
        '• You\'ll be redirected to AWS Security Credentials page',
        '• Click "Create Credentials" and copy the keys:',
        '  - Access Key ID: Public key for your app',
        '  - Secret Access Key: Private key (keep this secret!)',
        '',
        '⚠️ **Important Notes:**',
        '• Keep your Secret Access Key secure and never share it',
        '• You need at least 3 sales before API access is granted',
        '• API keys may take 24-48 hours to become active'
      ]
    },
    ebay: {
      name: 'eBay Partner Network',
      icon: <ShoppingBag size={20} />,
      color: 'bg-blue-500',
      description: 'Connect to eBay\'s Partner Network to access millions of products and competitive commission rates.',
      fields: [
        { name: 'associate_tag', label: 'Campaign ID', type: 'text', placeholder: '5338-XXXXX-XXXXX', required: true },
        { name: 'api_key', label: 'Application Key', type: 'password', placeholder: 'YourAppKey', required: true }
      ]
    },
    walmart: {
      name: 'Walmart Affiliates',
      icon: <ShoppingBag size={20} />,
      color: 'bg-blue-600',
      description: 'Partner with Walmart to promote everyday low prices and a vast selection of products.',
      fields: [
        { name: 'associate_tag', label: 'Publisher ID', type: 'text', placeholder: 'Your Publisher ID', required: true },
        { name: 'api_key', label: 'Consumer ID', type: 'password', placeholder: 'Your Consumer ID', required: true },
        { name: 'api_secret', label: 'Private Key', type: 'password', placeholder: 'Your Private Key', required: true }
      ]
    },
    shareasale: {
      name: 'ShareASale',
      icon: <ShoppingBag size={20} />,
      color: 'bg-green-500',
      description: 'Access thousands of merchants and products through ShareASale\'s affiliate network.',
      fields: [
        { name: 'associate_tag', label: 'Affiliate ID', type: 'text', placeholder: 'Your Affiliate ID', required: true },
        { name: 'api_key', label: 'API Token', type: 'password', placeholder: 'Your API Token', required: true },
        { name: 'api_secret', label: 'API Secret', type: 'password', placeholder: 'Your API Secret', required: true }
      ]
    },
    cj_affiliate: {
      name: 'CJ Affiliate',
      icon: <ShoppingBag size={20} />,
      color: 'bg-purple-500',
      description: 'Connect to Commission Junction (CJ) for access to premium brands and high-converting offers.',
      fields: [
        { name: 'associate_tag', label: 'Website ID', type: 'text', placeholder: 'Your Website ID', required: true },
        { name: 'api_key', label: 'Developer Key', type: 'password', placeholder: 'Your Developer Key', required: true }
      ]
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const fetchAccounts = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('affiliate_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching affiliate accounts:', error);
      setError('Failed to load affiliate accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (!user) throw new Error('User not authenticated');

      // Validate required fields
      const requiredFields = platforms[selectedPlatform].fields
        .filter(f => f.required)
        .map(f => f.name);
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      // Check if account already exists for this platform
      const existingAccount = accounts.find(acc => acc.platform === selectedPlatform);
      
      if (existingAccount) {
        // Update existing account
        const { error } = await supabase
          .from('affiliate_accounts')
          .update({
            associate_tag: formData.associate_tag || null,
            api_key: formData.api_key || null,
            api_secret: formData.api_secret || null,
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAccount.id);

        if (error) throw error;
        setSuccess(`${platforms[selectedPlatform].name} account updated successfully!`);
      } else {
        // Create new account
        const { error } = await supabase
          .from('affiliate_accounts')
          .insert({
            user_id: user.id,
            platform: selectedPlatform,
            associate_tag: formData.associate_tag || null,
            api_key: formData.api_key || null,
            api_secret: formData.api_secret || null,
            status: 'pending'
          });

        if (error) throw error;
        setSuccess(`${platforms[selectedPlatform].name} account connected successfully!`);
      }

      setFormData({});
      setShowAddForm(false);
      fetchAccounts();
    } catch (err) {
      console.error('Error connecting affiliate account:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect affiliate account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const syncAccount = async (accountId: string) => {
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { error } = await supabase
        .from('affiliate_accounts')
        .update({
          last_sync_at: new Date().toISOString(),
          status: 'active'
        })
        .eq('id', accountId);

      if (error) throw error;
      
      fetchAccounts();
      setSuccess('Account synced successfully!');
    } catch (error) {
      console.error('Error syncing account:', error);
      setError('Failed to sync account');
    }
  };

  const deleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this affiliate account?')) return;

    try {
      const { error } = await supabase
        .from('affiliate_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
      
      fetchAccounts();
      setSuccess('Account deleted successfully!');
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account');
    }
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
            <Loader2 size={12} className="mr-1 animate-spin" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle size={12} className="mr-1" />
            Inactive
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Affiliate Accounts</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect your affiliate accounts to start earning commissions
          </p>
        </div>
        
        <Button
          onClick={() => setShowAddForm(true)}
          leftIcon={<Plus size={18} />}
        >
          Add Account
        </Button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 mb-6 flex items-start text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400"
        >
          <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
          {error}
        </motion.div>
      )}
      
      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 mb-6 flex items-start text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-400"
        >
          <CheckCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
          {success}
        </motion.div>
      )}

      {/* Add Account Modal */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Connect Affiliate Account
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <AlertCircle size={24} />
              </button>
            </div>
            
            {/* Platform Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Platform
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(platforms).map(([key, platform]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedPlatform(key as PlatformType);
                      setShowInstructions(false);
                    }}
                    className={`flex items-center p-4 rounded-lg border text-left ${
                      selectedPlatform === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className={`${platform.color} p-2 rounded-lg text-white mr-3`}>
                      {platform.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{platform.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {platform.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions Toggle for Amazon */}
            {selectedPlatform === 'amazon' && (
              <div className="mb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInstructions(!showInstructions)}
                  leftIcon={<Info size={16} />}
                  className="mb-4"
                >
                  {showInstructions ? 'Hide' : 'Show'} Setup Instructions
                </Button>

                {showInstructions && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-4 flex items-center">
                      <ExternalLink size={16} className="mr-2" />
                      Amazon Associates Setup Guide
                    </h4>
                    <div className="space-y-3 text-sm text-blue-700 dark:text-blue-400">
                      {platforms.amazon.instructions?.map((instruction, index) => (
                        <div key={index}>
                          {instruction.startsWith('✅') ? (
                            <h5 className="font-semibold text-blue-800 dark:text-blue-300 mt-4 mb-2">
                              {instruction}
                            </h5>
                          ) : instruction.startsWith('**') ? (
                            <p className="font-medium text-blue-800 dark:text-blue-300 mt-2">
                              {instruction.replace(/\*\*/g, '')}
                            </p>
                          ) : instruction.startsWith('⚠️') ? (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 mt-3">
                              <p className="font-medium text-yellow-800 dark:text-yellow-300">
                                {instruction}
                              </p>
                            </div>
                          ) : instruction === '' ? (
                            <div className="h-2" />
                          ) : (
                            <p className="ml-2">{instruction}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        <strong>Need help?</strong> Visit the{' '}
                        <a 
                          href="https://affiliate-program.amazon.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                        >
                          Amazon Associates Central
                        </a>{' '}
                        for detailed documentation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {platforms[selectedPlatform].fields.map((field) => (
                <Input
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={handleInputChange}
                  required={field.required}
                />
              ))}
              
              <div className="flex space-x-3 pt-4">
                <Button type="submit" isLoading={isSubmitting} className="flex-1">
                  Connect Account
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

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No affiliate accounts yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Connect your first affiliate account to start earning commissions.
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowAddForm(true)} leftIcon={<Plus size={18} />}>
              Add Account
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const platform = platforms[account.platform];
            return (
              <div key={account.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`${platform.color} p-3 rounded-lg text-white mr-3`}>
                      {platform.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{platform.name}</h3>
                      {getStatusBadge(account.status)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <p>Associate Tag: {account.associate_tag || 'Not set'}</p>
                  <p>Connected: {formatDate(account.created_at)}</p>
                  {account.last_sync_at && (
                    <p>Last Sync: {formatDate(account.last_sync_at)}</p>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncAccount(account.id)}
                    leftIcon={<RefreshCw size={14} />}
                  >
                    Sync
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit3 size={14} />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteAccount(account.id)}
                    leftIcon={<Trash2 size={14} />}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Platform Information */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-4">Supported Affiliate Networks</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Major Marketplaces</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Amazon Associates - World's largest marketplace
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                eBay Partner Network - Auction and fixed-price items
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                Walmart Affiliates - Everyday low prices
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Affiliate Networks</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                ShareASale - Thousands of merchants
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                CJ Affiliate - Premium brands and offers
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                More networks coming soon...
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateAccountsPage;