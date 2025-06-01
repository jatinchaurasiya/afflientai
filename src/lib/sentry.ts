import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["localhost", /^https:\/\/[^/]*\.afflient\.ai/],
    }),
    new Sentry.Replay(),
  ],
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions in development
  // Set lower in production, like 0.1 (10%)
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample rate for all sessions
  replaysOnErrorSampleRate: 1.0, // Sample rate for sessions with errors
  
  environment: import.meta.env.MODE,
  release: "afflient-ai@1.0.0",
  
  beforeSend(event) {
    // Don't send events in development
    if (import.meta.env.DEV) {
      return null;
    }
    return event;
  },
});

export default Sentry;