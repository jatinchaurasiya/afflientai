import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight, Copy, CheckCircle, AlertCircle, Code, WholeWord as Wordpress, Layout, Box, FileCode, ChevronDown } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import { useAuthStore } from '../../../../store/authStore';
import { generateVerificationToken, isValidUrl } from '../../../../lib/utils';
import { supabase } from '../../../../lib/supabase';
import { motion } from 'framer-motion';

type Platform = 'wordpress' | 'wix' | 'squarespace' | 'custom';

interface PlatformInfo {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  setupSteps: string[];
}

const BlogSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [blogUrl, setBlogUrl] = useState('');
  const [blogTitle, setBlogTitle] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('wordpress');
  const [verificationToken, setVerificationToken] = useState('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [showInstructions, setShowInstructions] = useState(false);

  const platforms: Record<Platform, PlatformInfo> = {
    wordpress: {
      name: 'WordPress',
      icon: <Wordpress size={24} />,
      color: 'bg-blue-500',
      description: 'Add our integration to your WordPress site without installing any plugins.',
      setupSteps: [
        'Go to WordPress Admin → Appearance → Theme Editor',
        'Select your active theme and open functions.php',
        'Add the integration code at the end of the file',
        'Save changes and verify the connection'
      ]
    },
    wix: {
      name: 'Wix',
      icon: <Layout size={24} />,
      color: 'bg-purple-500',
      description: 'Integrate with your Wix site using the Velo by Wix development platform.',
      setupSteps: [
        'Open your Wix site editor',
        'Click on the Dev Mode icon',
        'Go to Page Code files',
        'Add the integration code to your main page'
      ]
    },
    squarespace: {
      name: 'Squarespace',
      icon: <Box size={24} />,
      color: 'bg-gray-800',
      description: 'Add our integration to your Squarespace site using code injection.',
      setupSteps: [
        'Go to Settings → Advanced → Code Injection',
        'Paste the integration code in the Header section',
        'Save your changes',
        'Verify the connection'
      ]
    },
    custom: {
      name: 'Custom Website',
      icon: <FileCode size={24} />,
      color: 'bg-green-500',
      description: 'Add our integration to any custom website by adding a simple script tag.',
      setupSteps: [
        'Open your website\'s HTML file',
        'Add the integration code before the closing </head> tag',
        'Upload the changes to your server',
        'Verify the connection'
      ]
    }
  };

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
      // In a real app, we would verify the token exists on the blog
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStep(3);
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify blog ownership');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIntegrationCode = () => {
    const baseCode = `<script src="https://api.afflient.ai/widget.js?token=${verificationToken}"></script>`;
    
    switch (selectedPlatform) {
      case 'wordpress':
        return `<?php
// Add to functions.php
function afflient_integration() {
    echo '${baseCode}';
}
add_action('wp_head', 'afflient_integration');`;

      case 'wix':
        return `// Add to Page Code
$w.onReady(function() {
    const script = document.createElement('script');
    script.src = "https://api.afflient.ai/widget.js?token=${verificationToken}";
    document.head.appendChild(script);
});`;

      case 'squarespace':
        return `<!-- Add to Code Injection → Header -->
${baseCode}`;

      default:
        return `<!-- Add before </head> tag -->
${baseCode}`;
    }
  };

  const finishSetup = () => {
    navigate('/dashboard/blogs');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Blog</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Connect your blog to start displaying AI-powered product recommendations.
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

      {step === 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Select Your Platform</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(platforms).map(([key, platform]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPlatform(key as Platform)}
                  className={`flex items-center p-4 rounded-lg border transition-colors ${
                    selectedPlatform === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className={`${platform.color} p-3 rounded-lg text-white`}>
                    {platform.icon}
                  </div>
                  <div className="ml-4 text-left">
                    <h4 className="font-medium text-gray-900 dark:text-white">{platform.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{platform.description}</p>
                  </div>
                </button>
              ))}
            </div>

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
              >
                Continue
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Integration Instructions</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInstructions(!showInstructions)}
                rightIcon={<ChevronDown size={16} />}
              >
                Show Steps
              </Button>
            </div>

            {showInstructions && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Steps for {platforms[selectedPlatform].name}:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  {platforms[selectedPlatform].setupSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Integration Code
                </label>
                <div className="relative">
                  <pre className="p-4 bg-gray-800 text-gray-100 rounded-lg overflow-x-auto">
                    <code>{getIntegrationCode()}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(getIntegrationCode())}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white rounded-md bg-gray-700 hover:bg-gray-600"
                  >
                    {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Token
                </label>
                <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <code className="text-sm text-blue-600 dark:text-blue-400 flex-1 overflow-auto">
                    {verificationToken}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(verificationToken)}
                    className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {copied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleVerify} 
                  isLoading={isVerifying}
                >
                  Verify Integration
                </Button>
              </div>
            </div>
          </div>
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
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Integration Successful!</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Your blog has been successfully integrated. You can now start creating widgets and displaying product recommendations.
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