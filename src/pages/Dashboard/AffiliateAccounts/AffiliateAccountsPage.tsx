import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, CheckCircle, AlertCircle, Loader2, Edit3, Trash2, RefreshCw, Info, ExternalLink } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import { motion } from 'framer-motion';
import ConnectAccountModal from './ConnectAccountModal';

type PlatformType = 'amazon' | 'ebay' | 'walmart' | 'other';

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
}

const AffiliateAccountsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState<AffiliateAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('amazon');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncingAccount, setSyncingAccount] = useState<string | null>(null);

  const platforms: Record<PlatformType, PlatformInfo> = {
    amazon: {
      name: 'Amazon Associates',
      icon: <ShoppingBag size={20} />,
      color: 'bg-orange-500',
      description: 'Connect your Amazon Associates account to recommend products from the world\'s largest marketplace.',
    },
    ebay: {
      name: 'eBay Partner Network',
      icon: <ShoppingBag size={20} />,
      color: 'bg-blue-500',
      description: 'Connect to eBay\'s Partner Network to access millions of products and competitive commission rates.',
    },
    walmart: {
      name: 'Walmart Affiliates',
      icon: <ShoppingBag size={20} />,
      color: 'bg-blue-600',
      description: 'Partner with Walmart to promote everyday low prices and a vast selection of products.',
    },
    other: {
      name: 'Other Affiliate Network',
      icon: <ShoppingBag size={20} />,
      color: 'bg-purple-500',
      description: 'Connect to any other affiliate network like ShareASale, CJ Affiliate, or Impact.',
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

  const handleOpenAddModal = (platform: PlatformType) => {
    setSelectedPlatform(platform);
    setShowAddModal(true);
  };

  const handleAccountConnected = () => {
    setShowAddModal(false);
    setSuccess(`${platforms[selectedPlatform].name} account connected successfully!`);
    fetchAccounts();
  };

  const syncAccount = async (accountId: string) => {
    setSyncingAccount(accountId);
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
    } finally {
      setSyncingAccount(null);
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

      {/* Platform Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Connect Affiliate Account
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(platforms).map(([key, platform]) => (
            <div 
              key={key}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className={`${platform.color} p-3 rounded-lg text-white`}>
                  {platform.icon}
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">{platform.name}</h4>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {platform.description}
              </p>
              
              <Button 
                onClick={() => handleOpenAddModal(key as PlatformType)}
                variant="outline"
                leftIcon={<Plus size={16} />}
                className="w-full"
              >
                Connect
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Connect Account Modal */}
      <ConnectAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAccountConnected}
        platform={selectedPlatform}
      />

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No affiliate accounts yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Connect your first affiliate account to start earning commissions.
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Your Connected Accounts
          </h3>
          
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
                      isLoading={syncingAccount === account.id}
                      leftIcon={<RefreshCw size={14} />}
                    >
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAddModal(account.platform)}
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