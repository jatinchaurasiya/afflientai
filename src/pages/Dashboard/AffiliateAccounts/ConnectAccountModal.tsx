import React, { useState } from 'react';
import { ShoppingBag, ExternalLink, Info, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { supabase } from '../../../lib/supabase';
import { motion } from 'framer-motion';

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  platform: string;
}

interface PlatformField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
}

const ConnectAccountModal: React.FC<ConnectAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  platform
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const platforms: Record<string, {
    name: string;
    fields: PlatformField[];
    instructions?: string[];
  }> = {
    amazon: {
      name: 'Amazon Associates',
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
      fields: [
        { name: 'associate_tag', label: 'Campaign ID', type: 'text', placeholder: '5338-XXXXX-XXXXX', required: true },
        { name: 'api_key', label: 'Application Key', type: 'password', placeholder: 'YourAppKey', required: true }
      ]
    },
    walmart: {
      name: 'Walmart Affiliates',
      fields: [
        { name: 'associate_tag', label: 'Publisher ID', type: 'text', placeholder: 'Your Publisher ID', required: true },
        { name: 'api_key', label: 'Consumer ID', type: 'password', placeholder: 'Your Consumer ID', required: true },
        { name: 'api_secret', label: 'Private Key', type: 'password', placeholder: 'Your Private Key', required: true }
      ]
    },
    other: {
      name: 'Other Affiliate Network',
      fields: [
        { name: 'platform_name', label: 'Network Name', type: 'text', placeholder: 'e.g., ShareASale', required: true },
        { name: 'associate_tag', label: 'Affiliate ID', type: 'text', placeholder: 'Your Affiliate ID', required: true },
        { name: 'api_key', label: 'API Token (if applicable)', type: 'password', placeholder: 'Your API Token', required: false }
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
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      const requiredFields = platforms[platform].fields
        .filter(f => f.required)
        .map(f => f.name);
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if account already exists
      const { data: existingAccount } = await supabase
        .from('affiliate_accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .single();

      // Prepare encrypted credentials
      const credentials = {
        associate_tag: formData.associate_tag,
        api_key: formData.api_key,
        api_secret: formData.api_secret,
        platform_name: formData.platform_name
      };

      if (existingAccount) {
        // Update existing account
        const { error } = await supabase
          .from('affiliate_accounts')
          .update({
            associate_tag: formData.associate_tag || null,
            api_key: formData.api_key || null,
            api_secret: formData.api_secret || null,
            encrypted_credentials: JSON.stringify(credentials),
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAccount.id);
          
        if (error) throw error;
      } else {
        // Create new account
        const { error } = await supabase
          .from('affiliate_accounts')
          .insert({
            user_id: user.id,
            platform,
            associate_tag: formData.associate_tag || null,
            api_key: formData.api_key || null,
            api_secret: formData.api_secret || null,
            encrypted_credentials: JSON.stringify(credentials),
            status: 'active'
          });
          
        if (error) throw error;
      }
      
      onSuccess();
    } catch (err) {
      console.error('Error connecting affiliate account:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect affiliate account');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
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
            Connect {platforms[platform]?.name || 'Affiliate Account'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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

        {/* Instructions Toggle for Amazon */}
        {platform === 'amazon' && (
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
          {platforms[platform]?.fields.map((field) => (
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
            <Button
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<ShoppingBag size={18} />}
              className="flex-1"
            >
              Connect Account
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ConnectAccountModal;