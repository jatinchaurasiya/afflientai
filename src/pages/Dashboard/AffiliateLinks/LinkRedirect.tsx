import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AffiliateService } from '../../../lib/affiliateService';
import { Loader2 } from 'lucide-react';

const LinkRedirect: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [redirecting, setRedirecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shortCode) {
      setError('Invalid link');
      setRedirecting(false);
      return;
    }

    const handleRedirect = async () => {
      try {
        // Gather click data
        const clickData = {
          ip: '', // This would be handled server-side in production
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          country: '', // Would use geolocation API
          city: '',
          device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
          browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                  navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                  navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
          sessionId: sessionStorage.getItem('session_id') || Math.random().toString(36)
        };

        // Store session ID
        if (!sessionStorage.getItem('session_id')) {
          sessionStorage.setItem('session_id', clickData.sessionId);
        }

        // Track click and get redirect URL
        const redirectUrl = await AffiliateService.trackClick(shortCode, clickData);
        
        // Redirect to affiliate URL
        window.location.href = redirectUrl;
      } catch (err) {
        console.error('Redirect error:', err);
        setError('Link not found or expired');
        setRedirecting(false);
      }
    };

    handleRedirect();
  }, [shortCode]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Link Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <a
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Redirecting...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we redirect you to the product page.
        </p>
      </div>
    </div>
  );
};

export default LinkRedirect;