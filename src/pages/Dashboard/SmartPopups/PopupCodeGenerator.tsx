import React, { useState } from 'react';
import { Code, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { motion } from 'framer-motion';

interface PopupCodeGeneratorProps {
  websiteId: string;
  popupId: string;
  integrationKey: string;
}

const PopupCodeGenerator: React.FC<PopupCodeGeneratorProps> = ({
  websiteId,
  popupId,
  integrationKey
}) => {
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const baseCode = `<!-- AffiliateAI Popup Integration -->
<script>
  (function() {
    window.AffiliateAI = window.AffiliateAI || {};
    window.AffiliateAI.config = {
      siteId: '${websiteId}',
      apiKey: '${integrationKey}',
      popupId: '${popupId}',
      baseUrl: 'https://api.affilient.ai',
      options: {
        scrollThreshold: 0.7,
        timeDelay: 5000,
        maxPopupsPerSession: 3
      }
    };
    
    var script = document.createElement('script');
    script.src = 'https://cdn.affilient.ai/popup-injector.min.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;

  const advancedCode = `<!-- AffiliateAI Popup Integration (Advanced) -->
<script>
  (function() {
    window.AffiliateAI = window.AffiliateAI || {};
    window.AffiliateAI.config = {
      siteId: '${websiteId}',
      apiKey: '${integrationKey}',
      popupId: '${popupId}',
      baseUrl: 'https://api.affilient.ai',
      options: {
        scrollThreshold: 0.7,
        timeDelay: 5000,
        maxPopupsPerSession: 3,
        cooldownPeriod: 300000, // 5 minutes
        respectDoNotTrack: true,
        enableLogging: false,
        maxRetries: 3,
        retryDelay: 1000
      }
    };
    
    var script = document.createElement('script');
    script.src = 'https://cdn.affilient.ai/popup-injector.min.js';
    script.async = true;
    document.head.appendChild(script);
    
    // Optional: Custom event listeners
    window.addEventListener('AffiliateAI:popupShown', function(e) {
      console.log('Popup shown:', e.detail);
    });
    
    window.addEventListener('AffiliateAI:popupClicked', function(e) {
      console.log('Popup clicked:', e.detail);
    });
  })();
</script>`;

  const copyToClipboard = () => {
    const codeToCopy = showAdvanced ? advancedCode : baseCode;
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <Code size={20} className="mr-2" />
          Integration Code
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Show Basic' : 'Show Advanced'}
        </Button>
      </div>
      
      <div className="relative">
        <pre className="p-4 bg-gray-800 text-gray-100 rounded-lg overflow-x-auto text-sm">
          <code>{showAdvanced ? advancedCode : baseCode}</code>
        </pre>
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white rounded-md bg-gray-700 hover:bg-gray-600"
          title="Copy to clipboard"
        >
          {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Add this code to your website's <code className="text-pink-500 dark:text-pink-400">&lt;head&gt;</code> section to enable AI-powered product recommendation popups.</p>
        
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
            <Info size={16} className="mr-2" />
            Installation Instructions
          </h4>
          
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
            <li className="flex items-start">
              <span className="font-medium mr-2">1.</span>
              Copy the code above
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">2.</span>
              Paste it into your website's HTML, just before the closing <code className="text-pink-500 dark:text-pink-400">&lt;/head&gt;</code> tag
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">3.</span>
              Save your changes and publish your website
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">4.</span>
              Visit your website to verify the integration is working
            </li>
          </ul>
          
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <strong>Need help?</strong> Check out our{' '}
              <a 
                href="#" 
                className="underline hover:no-underline"
              >
                integration guide
              </a>{' '}
              or{' '}
              <a 
                href="#" 
                className="underline hover:no-underline"
              >
                contact support
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupCodeGenerator;