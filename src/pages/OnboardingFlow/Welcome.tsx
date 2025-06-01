import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const steps = [
    {
      title: 'Verify Your Blog',
      description: 'Add your blog URL and verify ownership with a simple verification code.',
      icon: <Globe className="h-6 w-6" />,
    },
    {
      title: 'Connect Affiliate Accounts',
      description: 'Link your Amazon Associates and other affiliate accounts to enable product recommendations.',
      icon: <Link2 className="h-6 w-6" />,
    },
    {
      title: 'Create Your Widget',
      description: 'Customize how product recommendations will appear on your blog.',
      icon: <Layout className="h-6 w-6" />,
    },
    {
      title: 'Start Earning',
      description: 'Embed the widget on your blog and start earning affiliate commissions automatically.',
      icon: <DollarSign className="h-6 w-6" />,
    },
  ];

  const handleContinue = () => {
    navigate('/onboarding/blog-verification');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
            Welcome to <span className="text-blue-600 dark:text-blue-500">AffiliateAI</span>
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Let's get you set up to start earning affiliate commissions with AI-powered recommendations.
          </p>
        </motion.div>
        
        {user?.full_name && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-4 text-lg text-gray-700 dark:text-gray-300"
          >
            Hi, {user.full_name}! We're excited to have you on board.
          </motion.p>
        )}
      </div>
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700 mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Getting Started in 4 Simple Steps
        </h2>
        
        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              variants={item}
              className="flex"
            >
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  {step.icon}
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-8"
      >
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-4">Why bloggers choose AffiliateAI</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <CheckCircle size={18} className="text-green-500 dark:text-green-400 mr-2 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Higher conversion rates</span> with context-aware recommendations
            </span>
          </div>
          
          <div className="flex items-start">
            <CheckCircle size={18} className="text-green-500 dark:text-green-400 mr-2 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Save time</span> with automatic product selection
            </span>
          </div>
          
          <div className="flex items-start">
            <CheckCircle size={18} className="text-green-500 dark:text-green-400 mr-2 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Transparent pricing</span> with no upfront costs
            </span>
          </div>
          
          <div className="flex items-start">
            <CheckCircle size={18} className="text-green-500 dark:text-green-400 mr-2 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Detailed analytics</span> to optimize your earnings
            </span>
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-center"
      >
        <Button
          size="lg"
          onClick={handleContinue}
          rightIcon={<ArrowRight size={18} />}
        >
          Let's Get Started
        </Button>
        
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Expected setup time: ~5 minutes
        </p>
      </motion.div>
    </div>
  );
};

// Need to import these at the top but showing them here due to scope
import { Globe, Link2, Layout, DollarSign } from 'lucide-react';

export default Welcome;