import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, TrendingUp, Zap, PenTool, BarChart, DollarSign } from 'lucide-react';
import Button from '../components/ui/Button';

const LandingPage: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 pt-16 pb-20 lg:pt-24 lg:pb-28">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                <span className="block">AI-Powered Affiliate</span>
                <span className="block text-blue-600 dark:text-blue-500">Recommendations</span>
              </h1>
              <p className="mt-6 text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                Automatically recommend relevant affiliate products on your blog using advanced AI. Maximize your revenue without the manual work.
              </p>
              <div className="mt-10 flex justify-center">
                <Link to="/signup">
                  <Button size="lg" rightIcon={<ArrowRight size={18} />}>
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/demo" className="ml-4">
                  <Button variant="outline" size="lg">
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Features tailored for bloggers
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400">
              Everything you need to monetize your content with AI-powered recommendations.
            </p>
          </div>
          
          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Zap size={24} />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">AI-Powered Recommendations</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Our advanced AI analyzes your content to suggest the most relevant affiliate products for your audience.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <PenTool size={24} />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Easy Integration</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Simply add our JavaScript widget to your blog and start displaying product recommendations instantly.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                  <BarChart size={24} />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Detailed Analytics</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Track impressions, clicks, and conversions with our comprehensive analytics dashboard.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-white">
                  <TrendingUp size={24} />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Maximize Revenue</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Our AI continuously learns from performance data to optimize recommendations for higher conversions.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-500 text-white">
                  <DollarSign size={24} />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Seamless Payouts</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Get paid automatically with our Stripe Connect integration. You earn 95%, we take just 5%.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Shield size={24} />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Complete Control</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Customize the appearance and behavior of your widgets to match your blog's design and audience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* How it Works Section */}
      <div className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400">
              Get started in just a few simple steps.
            </p>
          </div>
          
          <div className="mt-16">
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 mx-auto">
                  <span className="text-xl font-semibold">1</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Sign up and verify</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Create an account and verify ownership of your blog by adding a verification token.
                </p>
              </div>
              
              <div className="mt-10 lg:mt-0 text-center">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 mx-auto">
                  <span className="text-xl font-semibold">2</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Connect accounts</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Link your affiliate accounts (Amazon Associates, etc.) and set up your payment method with Stripe.
                </p>
              </div>
              
              <div className="mt-10 lg:mt-0 text-center">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 mx-auto">
                  <span className="text-xl font-semibold">3</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Embed and earn</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Add our widget to your blog with a simple JavaScript snippet and start earning commissions right away.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Trusted by bloggers worldwide
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400">
              See what our users are saying about AffiliateAI.
            </p>
          </div>
          
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white">JD</div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Jane Doe</h4>
                  <p className="text-gray-500 dark:text-gray-400">Travel Blogger</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">
                "Since implementing AffiliateAI on my travel blog, my Amazon commissions have increased by 47%. The AI recommends perfect travel gear for my destination guides."
              </p>
              <div className="mt-4 flex">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Verified Customer</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center text-white">MS</div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Mike Smith</h4>
                  <p className="text-gray-500 dark:text-gray-400">Tech Reviewer</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">
                "The contextual recommendations are spot-on. My readers appreciate the relevant product suggestions, and I've seen a 3x increase in my conversion rate."
              </p>
              <div className="mt-4 flex">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Verified Customer</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center text-white">SW</div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Sarah Wilson</h4>
                  <p className="text-gray-500 dark:text-gray-400">Food Blogger</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">
                "The setup was incredibly easy, and the analytics help me understand which recipes drive the most affiliate revenue. Great tool for food bloggers!"
              </p>
              <div className="mt-4 flex">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Verified Customer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-16 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to boost your affiliate revenue?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-blue-100">
              Join thousands of bloggers who are using AffiliateAI to increase their passive income.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-blue-50"
                  rightIcon={<ArrowRight size={18} />}
                >
                  Get Started Free
                </Button>
              </Link>
              <Link to="/demo" className="ml-4">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white text-white hover:bg-blue-700"
                >
                  View Demo
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-blue-100">
              No credit card required. Free plan available with premium upgrades.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;