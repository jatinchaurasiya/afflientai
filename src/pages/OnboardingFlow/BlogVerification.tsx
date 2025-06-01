import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight, Copy, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { generateVerificationToken, isValidUrl } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

const BlogVerification: React.FC = () => {
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
      // Generate a unique verification token
      const token = generateVerificationToken();
      setVerificationToken(token);
      
      // Store the blog and token in the database
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
      // In a real app, we would:
      // 1. Fetch the blog page
      // 2. Check if it contains the verification token
      // 3. Update the verification status in the database
      
      // For now, we'll simulate a successful verification
      setTimeout(() => {
        setStep(3);
        setIsVerifying(false);
      }, 2000);
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify blog ownership');
      setIsVerifying(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(verificationToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const continueToNextStep = () => {
    navigate('/onboarding/affiliate-accounts');
  };

  const steps = [
    { number: 1, title: 'Enter Blog Details' },
    { number: 2, title: 'Verify Ownership' },
    { number: 3, title: 'Verification Complete' }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <React.Fragment key={s.number}>
              <div className="flex flex-col items-center">
                <div 
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    step >= s.number 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {step > s.number ? <CheckCircle size={16} /> : s.number}
                </div>
                <span 
                  className={`mt-2 text-sm ${
                    step >= s.number 
                      ? 'text-gray-900 font-medium dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div 
                  className={`h-1 flex-1 mx-2 ${
                    step > i + 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
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
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Your Blog</h2>
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
              label="Blog Title (Optional)"
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
              className="w-full sm:w-auto"
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
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Verify Blog Ownership</h2>
          <div className="space-y-6">
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To verify ownership of your blog, please add the following verification token to your blog's HTML or as a meta tag:
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
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Option 1: Add as a meta tag</h3>
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <code className="text-sm text-blue-600 dark:text-blue-400">
                      &lt;meta name="affiliate-ai-verification" content="{verificationToken}" /&gt;
                    </code>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Option 2: Add as a hidden div</h3>
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <code className="text-sm text-blue-600 dark:text-blue-400">
                      &lt;div id="affiliate-ai-verification" style="display:none"&gt;{verificationToken}&lt;/div&gt;
                    </code>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleVerify} 
              isLoading={isVerifying}
              className="w-full sm:w-auto"
            >
              Verify Ownership
            </Button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 text-center"
        >
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 mb-6">
            <CheckCircle size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Verification Successful!</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Your blog has been successfully verified. You can now continue to set up your affiliate accounts.
          </p>
          
          <Button 
            onClick={continueToNextStep}
            rightIcon={<ArrowRight size={18} />}
          >
            Continue to Affiliate Accounts
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default BlogVerification;