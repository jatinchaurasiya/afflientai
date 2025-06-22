import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import CheckoutForm from '../../components/payment/CheckoutForm';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  
  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const planId = queryParams.get('plan');
  const amount = planId === 'pro' ? 4900 : planId === 'business' ? 9900 : 1900; // in cents
  const planName = planId === 'pro' ? 'Pro Plan' : planId === 'business' ? 'Business Plan' : 'Basic Plan';
  
  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/signin?redirect=checkout');
    }
  }, [user, navigate]);

  const handlePaymentSuccess = (id: string) => {
    setPaymentId(id);
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  if (isComplete) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center"
        >
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 mb-6">
            <CheckCircle size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Payment Successful!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Thank you for your purchase. Your payment has been processed successfully and your account has been upgraded to the {planName}.
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Payment ID:</span>
              <span className="text-gray-900 dark:text-white font-medium">{paymentId}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Plan:</span>
              <span className="text-gray-900 dark:text-white font-medium">{planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Amount:</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100)}
              </span>
            </div>
          </div>
          
          <Button onClick={handleContinue}>
            Continue to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Processing Payment</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we process your payment. This may take a few moments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Complete Your Purchase</h2>
            
            <CheckoutForm
              amount={amount}
              currency="USD"
              description={`Afflient.ai ${planName} Subscription`}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        </div>
        
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{planName}</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="text-gray-900 dark:text-white font-medium">$0.00</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Billed monthly
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-400">
              <div className="flex">
                <ShieldCheck size={18} className="text-blue-600 dark:text-blue-500 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-300">Secure Checkout</p>
                  <p className="mt-1">Your payment information is encrypted and secure.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;