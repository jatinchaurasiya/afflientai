import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <img 
          src="/affilient.aiVideo1-ezgif.com-video-to-gif-converter (1).gif" 
          alt="Loading..." 
          className="w-32 h-32 mx-auto mb-4"
        />
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    </div>
  );
};

export default LoadingScreen;