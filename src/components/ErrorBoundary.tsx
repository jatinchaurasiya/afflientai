import React from 'react';
import * as Sentry from "@sentry/react";

const FallbackComponent = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Oops! Something went wrong
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        We've been notified and are working to fix the issue.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

export const withErrorBoundary = (Component: React.ComponentType) => {
  return Sentry.withErrorBoundary(Component, {
    fallback: FallbackComponent,
    showDialog: true
  });
};