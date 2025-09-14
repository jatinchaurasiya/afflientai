import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { checkoutService } from '../../lib/checkoutService';
import { motion } from 'framer-motion';

interface CheckoutFormProps {
  amount: number;
  currency: string;
  description: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  amount,
  currency,
  description,
  onSuccess,
  onError
}) => {
  const navigate = useNavigate();
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    }
  });

  const publicKey = import.meta.env.VITE_CHECKOUT_PUBLIC_KEY || '';

  const handleCardTokenized = (token: string) => {
    setCardToken(token);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setBillingDetails(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setBillingDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      setIsProcessing(true);
      setErrorMessage('');

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPaymentStatus('success');
      
      if (onSuccess && result.paymentId) {
        onSuccess(result.paymentId);
      }

      // Redirect after successful payment
      setTimeout(() => {
        navigate('/dashboard/billing');
      }, 2000);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      
      if (onError) {
        onError(err instanceof Error ? err.message : 'Payment processing failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Details</h2>
        <div className="flex items-center text-gray-500 dark:text-gray-400">
          <Lock size={16} className="mr-1" />
          <span className="text-xs">Secure Payment</span>
        </div>
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
      
      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 mb-6 flex items-start text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-400"
        >
          <CheckCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
          {success}
        </motion.div>
      )}

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 dark:text-gray-300">Amount:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)}
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </div>
      </div>

      {paymentStatus === 'idle' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cardholder Name
            </label>
            <input
              type="text"
              value={cardDetails.name}
              onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Number
            </label>
            <input
              type="text"
              value={cardDetails.number}
              onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                value={cardDetails.expiry}
                onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="MM/YY"
                maxLength={5}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Pay Now'}
          </Button>
        </form>
      )}

      {paymentStatus === 'success' && (
        <div className="text-center py-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
          <p className="text-gray-600">Your payment has been processed successfully.</p>
        </div>
      )}

      {paymentStatus === 'error' && (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Failed</h3>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <Button
            onClick={() => setPaymentStatus('idle')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default CheckoutForm;