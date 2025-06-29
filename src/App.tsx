import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import { useAuthStore } from './store/authStore';
import { withErrorBoundary } from './components/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import LandingPage from './pages/LandingPage';
import DashboardHome from './pages/Dashboard/DashboardHome';
import SignInForm from './components/auth/SignInForm';
import SignUpForm from './components/auth/SignUpForm';
import Welcome from './pages/OnboardingFlow/Welcome';
import BlogVerification from './pages/OnboardingFlow/BlogVerification';
import AffiliateAccounts from './pages/OnboardingFlow/AffiliateAccounts';
import CreateWidget from './pages/OnboardingFlow/CreateWidget';
import AnalyticsDashboard from './pages/Analytics/AnalyticsDashboard';
import BillingDashboard from './pages/Billing/BillingDashboard';
import LoadingScreen from './components/ui/LoadingScreen';
import BlogList from './pages/Dashboard/Blogs/BlogList';
import BlogSetup from './pages/Dashboard/Blogs/OnboardingFlow/BlogSetup';
import BlogDetails from './pages/Dashboard/Blogs/BlogDetails';
import WebsiteIntegration from './pages/Dashboard/Websites/WebsiteIntegration';
import PopupBuilder from './pages/Dashboard/SmartPopups/PopupBuilder';
import AIRecommendationsDashboard from './pages/Dashboard/AIRecommendations/AIRecommendationsDashboard';
import AffiliateAccountsPage from './pages/Dashboard/AffiliateAccounts/AffiliateAccountsPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <SentryRoutes>
        {/* Public routes */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="signin" element={<SignInForm />} />
          <Route path="signup" element={<SignUpForm />} />
          <Route path="checkout" element={<CheckoutPage />} />
        </Route>
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="websites" element={<WebsiteIntegration />} />
          <Route path="blogs" element={<BlogList />} />
          <Route path="blogs/new" element={<BlogSetup />} />
          <Route path="blogs/:blogId" element={<BlogDetails />} />
          <Route path="affiliate-accounts" element={<AffiliateAccountsPage />} />
          <Route path="smart-popups" element={<PopupBuilder />} />
          <Route path="ai-recommendations" element={<AIRecommendationsDashboard />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="billing" element={<BillingDashboard />} />
          <Route path="settings" element={<Navigate to="/dashboard" replace />} />
        </Route>
        
        {/* Onboarding flow */}
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Welcome />} />
          <Route path="blog-verification" element={<BlogVerification />} />
          <Route path="affiliate-accounts" element={<AffiliateAccounts />} />
          <Route path="create-widget" element={<CreateWidget />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </SentryRoutes>
    </Router>
  );
}

export default withErrorBoundary(App);