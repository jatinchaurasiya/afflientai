import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckoutProvider, Frames, CardNumber, ExpiryDate, Cvv } from '@checkout.com/frames-react';
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
      if (!cardToken) {
        throw new Error('Please enter valid card details');
      }

      // Process payment
      const result = await checkoutService.processPayment(
        {
          cardToken,
          billingDetails
        },
        {
          amount,
          currency,
          description
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      setSuccess('Payment processed successfully!');
      
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

      <CheckoutProvider
        publicKey={publicKey}
        onCardTokenized={handleCardTokenized}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              value={billingDetails.name}
              onChange={handleInputChange}
              placeholder="John Doe"
              required
            />
            
            <Input
              label="Email"
              type="email"
              name="email"
              value={billingDetails.email}
              onChange={handleInputChange}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              <Frames
                config={{
                  frameStyles: {
                    base: {
                      color: '#333',
                      fontSize: '16px',
                      padding: '12px'
                    },
                    focus: {
                      border: '1px solid #4F46E5'
                    },
                    invalid: {
                      color: '#EF4444'
                    }
                  },
                  cardNumber: {
                    label: 'Card Number'
                  },
                  expiryDate: {
                    label: 'Expiry Date'
                  },
                  cvv: {
                    label: 'CVV'
                  }
                }}
              >
                <div className="p-3 border-b border-gray-300 dark:border-gray-600">
                  <CardNumber />
                </div>
                <div className="flex">
                  <div className="flex-1 p-3 border-r border-gray-300 dark:border-gray-600">
                    <ExpiryDate />
                  </div>
                  <div className="flex-1 p-3">
                    <Cvv />
                  </div>
                </div>
              </Frames>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <Input
              label="Address Line 1"
              name="address.line1"
              value={billingDetails.address.line1}
              onChange={handleInputChange}
              placeholder="123 Main St"
              required
            />
            
            <Input
              label="Address Line 2 (Optional)"
              name="address.line2"
              value={billingDetails.address.line2}
              onChange={handleInputChange}
              placeholder="Apt 4B"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                name="address.city"
                value={billingDetails.address.city}
                onChange={handleInputChange}
                placeholder="New York"
                required
              />
              
              <Input
                label="State/Province"
                name="address.state"
                value={billingDetails.address.state}
                onChange={handleInputChange}
                placeholder="NY"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Postal Code"
                name="address.zip"
                value={billingDetails.address.zip}
                onChange={handleInputChange}
                placeholder="10001"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <select
                  name="address.country"
                  value={billingDetails.address.country}
                  onChange={(e) => setBillingDetails(prev => ({
                    ...prev,
                    address: {
                      ...prev.address,
                      country: e.target.value
                    }
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<CreditCard size={18} />}
              className="w-full"
            >
              Pay {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)}
            </Button>
          </div>
          
          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            By proceeding, you agree to our Terms of Service and Privacy Policy.
          </div>
        </form>
      </CheckoutProvider>
    </div>
  );
};

export default CheckoutForm;