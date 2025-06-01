import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Lock, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

type PlatformType = 'amazon' | 'ebay' | 'walmart' | 'other';

interface PlatformInfo {
  name: string;
  icon: React.ReactNode;
  color: string;
  fields: {
    name: string;
    label: string;
    type: string;
    placeholder: string;
    required: boolean;
  }[];
}

const AffiliateAccounts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('amazon');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const platforms: Record<PlatformType, PlatformInfo> = {
    amazon: {
      name: 'Amazon Associates',
      icon: <ShoppingBag size={24} />,
      color: 'bg-orange-500',
      fields: [
        { name: 'associate_tag', label: 'Associate Tag', type: 'text', placeholder: 'yourtag-20', required: true },
        { name: 'api_key', label: 'API Key (Access Key ID)', type: 'password', placeholder: '••••••••••••••••••••', required: true },
        { name: 'api_secret', label: 'API Secret (Secret Key)', type: 'password', placeholder: '••••••••••••••••••••', required: true }
      ]
    },
    ebay: {
      name: 'eBay Partner Network',
      icon: <ShoppingBag size={24} />,
      color: 'bg-blue-500',
      fields: [
        { name: 'associate_tag', label: 'Campaign ID', type: 'text', placeholder: '5338-XXXXX', required: true },
        { name: 'api_key', label: 'API Key', type: 'password', placeholder: '••••••••••••••••••••', required: true }
      ]
    },
    walmart: {
      name: 'Walmart Affiliates',
      icon: <ShoppingBag size={24} />,
      color: 'bg-blue-600',
      fields: [
        { name: 'associate_tag', label: 'Publisher ID', type: 'text', placeholder: 'Your Publisher ID', required: true },
        { name: 'api_key', label: 'Impact ID', type: 'password', placeholder: '••••••••••••••••••••', required: true }
      ]
    },
    other: {
      name: 'Other Affiliate Program',
      icon: <ShoppingBag size={24} />,
      color: 'bg-purple-500',
      fields: [
        { name: 'platform_name', label: 'Platform Name', type: 'text', placeholder: 'e.g., ShareASale', required: true },
        { name: 'associate_tag', label: 'Affiliate ID', type: 'text', placeholder: 'Your Affiliate ID', required: true },
        { name: 'api_key', label: 'API Key (if applicable)', type: 'password', placeholder: '••••••••••••••••••••', required: false }
      ]
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
      // Validate required fields
      const requiredFields = platforms[selectedPlatform].fields.filter(f => f.required).map(f => f.name);
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }
      
      // Save to database
      if (user) {
        const { error } = await supabase.from('affiliate_accounts').insert({
          user_id: user.id,
          platform: selectedPlatform,
          associate_tag: formData.associate_tag || null,
          api_key: formData.api_key || null,
          api_secret: formData.api_secret || null,
          status: 'pending'
        });
        
        if (error) throw error;
        
        setSuccess(`Your ${platforms[selectedPlatform].name} account has been successfully connected!`);
        setFormData({});
      }
    } catch (err) {
      console.error('Error connecting affiliate account:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect affiliate account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    navigate('/onboarding/create-widget');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connect Affiliate Accounts</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Connect your affiliate accounts to start recommending products and earning commissions.
        </p>
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

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-wrap gap-3 mb-6">
          {Object.entries(platforms).map(([key, platform]) => (
            <button
              key={key}
              onClick={() => setSelectedPlatform(key as PlatformType)}
              className={`flex items-center px-4 py-2 rounded-lg border ${
                selectedPlatform === key 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <div className={`w-6 h-6 rounded-full ${platform.color} flex items-center justify-center text-white mr-2`}>
                {platform.icon}
              </div>
              <span>{platform.name}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              leftIcon={field.type === 'password' ? <Lock size={18} /> : undefined}
            />
          ))}
          
          <div className="flex flex-wrap gap-4">
            <Button
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<PlusCircle size={18} />}
            >
              Connect Account
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleContinue}
              rightIcon={<ArrowRight size={18} />}
            >
              Continue to Next Step
            </Button>
          </div>
        </form>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Why connect your affiliate accounts?</h3>
        <p className="text-blue-700 dark:text-blue-400 text-sm mb-4">
          Connecting your affiliate accounts allows our AI to recommend products using your affiliate links, ensuring you earn commissions for every sale.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <CheckCircle size={18} className="text-green-500 dark:text-green-400 mr-2 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Automatically use your affiliate IDs</span>
          </div>
          <div className="flex items-start">
            <CheckCircle size={18} className="text-green-500 dark:text-green-400 mr-2 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Track conversions and earnings</span>
          </div>
          <div className="flex items-start">
            <CheckCircle size={18} className="text-green-500 dark:text-green-400 mr-2 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Higher conversion rates with API access</span>
          </div>
          <div className="flex items-start">
            <CheckCircle size={18} className="text-green-500 dark:text-green-400 mr-2 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Access to exclusive product data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateAccounts;