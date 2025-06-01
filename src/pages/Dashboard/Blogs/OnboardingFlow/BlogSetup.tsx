import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight, Copy, CheckCircle } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import { useAuthStore } from '../../../../store/authStore';
import { generateVerificationToken, isValidUrl } from '../../../../lib/utils';
import { supabase } from '../../../../lib/supabase';
import { motion } from 'framer-motion';

const BlogSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [blogUrl, setBlogUrl] = useState('');
  const [blogTitle, setBlogTitle] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const handleGenerateToken = async () => {
    if (!isValidUrl(blogUrl)) {
      setError('Please enter a valid URL including http:// or https://');
      return;
    }

    setError(null);
    setIsGeneratingToken(true);
    
    try {
      const token = generateVerificationToken();
      setVerificationToken(token);
      
      if (user) {
        const { error } = await supabase.from('blogs').insert({
          user_id: user.id,
          url: blogUrl,
          title: blogTitle || null,
          verification_token: token,
          verification_status: 'pending'
        });
        
        if (error) throw error;
      }
      
      setStep(2);
    } catch (err) {
      console.error('Error generating token:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate verification token');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    setIsVerifying(true);
    
    try {
      // Simulate verification for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStep(3);
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify blog ownership');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(verificationToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finishSetup = () => {
    navigate('/dashboard/blogs');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Blog</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Connect a new blog to start displaying AI-powered product recommendations.
        </p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}

      {step === 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="space-y-6">
            <Input
              label="Blog URL"
              type="url"
              placeholder="https://yourblog.com"
              value={blogUrl}
              onChange={(e) => setBlogUrl(e.target.value)}
              leftIcon={<Globe size={18} />}
              required
            />
            
            <Input
              label="Blog Title"
              type="text"
              placeholder="My Awesome Blog"
              value={blogTitle}
              onChange={(e) => setBlogTitle(e.target.value)}
              helperText="This helps you identify your blog in the dashboard"
            />
            
            <Button 
              onClick={handleGenerateToken} 
              isLoading={isGeneratingToken}
              rightIcon={<ArrowRight size={18} />}
            >
              Continue
            </Button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Verify Blog Ownership</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Add the following verification token to your blog's HTML or as a meta tag:
          </p>
          
          <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
            <code className="text-sm text-blue-600 dark:text-blue-400 flex-1 overflow-auto">
              {verificationToken}
            </code>
            <button 
              onClick={copyToClipboard}
              className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {copied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
            </button>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Option 1: Add as a meta tag</h4>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <code className="text-sm text-blue-600 dark:text-blue-400">
                  &lt;meta name="afflient-verification" content="{verificationToken}" /&gt;
                </code>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Option 2: Add as a hidden div</h4>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <code className="text-sm text-blue-600 dark:text-blue-400">
                  &lt;div id="afflient-verification" style="display:none"&gt;{verificationToken}&lt;/div&gt;
                </code>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleVerify} 
            isLoading={isVerifying}
          >
            Verify Ownership
          </Button>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 text-center"
        >
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 mb-6">
            <CheckCircle size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Blog Verified Successfully!</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Your blog has been verified and is ready to display AI-powered product recommendations.
          </p>
          
          <Button 
            onClick={finishSetup}
            rightIcon={<ArrowRight size={18} />}
          >
            Go to Blog Dashboard
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default BlogSetup;