import React, { useState } from 'react';
import { CreditCard, DollarSign, Download, ChevronDown, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import { motion } from 'framer-motion';

const BillingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('payouts');
  
  // Mock data - would be fetched from API in real app
  const payouts = [
    { id: 1, amount: 245.72, status: 'paid', date: '2025-05-10', method: 'Bank Transfer' },
    { id: 2, amount: 187.35, status: 'paid', date: '2025-04-10', method: 'Bank Transfer' },
    { id: 3, amount: 203.64, status: 'processing', date: '2025-03-10', method: 'Bank Transfer' },
  ];
  
  const unpaidEarnings = 156.42;
  const nextPayoutDate = '2025-06-10';
  
  const earnings = {
    monthly: [
      { month: 'January', amount: 145.65 },
      { month: 'February', amount: 165.32 },
      { month: 'March', amount: 203.64 },
      { month: 'April', amount: 187.35 },
      { month: 'May', amount: 245.72 }
    ],
    breakdown: {
      amazon: 185.32,
      ebay: 42.15,
      walmart: 18.25
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle size={12} className="mr-1" />
            Paid
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <svg className="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Payouts</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your payment methods and view your earnings.
        </p>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <DollarSign size={20} />
            </div>
            <div className="ml-5 w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unpaid Earnings</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(unpaidEarnings)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Next payout on {formatDate(nextPayoutDate)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <DollarSign size={20} />
            </div>
            <div className="ml-5 w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month's Earnings</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(earnings.monthly[earnings.monthly.length - 1].amount)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                +{((earnings.monthly[earnings.monthly.length - 1].amount / earnings.monthly[earnings.monthly.length - 2].amount - 1) * 100).toFixed(1)}% from last month
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <CreditCard size={20} />
            </div>
            <div className="ml-5 w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">Bank Account</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span className="font-medium">**** 1234</span> · Chase Bank
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`${
                activeTab === 'payouts'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('payouts')}
            >
              Payouts
            </button>
            <button
              className={`${
                activeTab === 'earnings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('earnings')}
            >
              Earnings
            </button>
            <button
              className={`${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('settings')}
            >
              Payment Settings
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'payouts' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Payout History</h2>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download size={14} />}
              >
                Export
              </Button>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {payouts.map((payout) => (
                <div key={payout.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(payout.amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(payout.date)} · {payout.method}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {getStatusBadge(payout.status)}
                    <button className="ml-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Payout Information</h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                  <p>Payouts are processed on the 10th of each month for earnings over $50. If your balance is less than $50, it will roll over to the next month.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {activeTab === 'earnings' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Monthly Earnings</h2>
              </div>
              
              <div className="p-6">
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
                  <p className="text-gray-500 dark:text-gray-400">
                    Chart component would display monthly earnings trend.
                  </p>
                </div>
                
                <div className="mt-4">
                  {earnings.monthly.slice().reverse().map((month, index) => (
                    <div key={month.month} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{month.month}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(month.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Earnings by Platform</h2>
              </div>
              
              <div className="p-6">
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
                  <p className="text-gray-500 dark:text-gray-400">
                    Chart component would display earnings by platform.
                  </p>
                </div>
                
                <div className="mt-4">
                  {Object.entries(earnings.breakdown).map(([platform, amount]) => (
                    <div key={platform} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{platform}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Detailed Earnings</h2>
              <div className="flex space-x-2">
                <button className="inline-flex items-center px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                  <span>Last 30 days</span>
                  <ChevronDown size={14} className="ml-1" />
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download size={14} />}
                >
                  Export
                </Button>
              </div>
            </div>
            
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <p>Detailed earnings data would be displayed here, including breakdowns by blog, widget, and product category.</p>
            </div>
          </div>
        </motion.div>
      )}
      
      {activeTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Payment Methods</h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <CreditCard size={20} className="text-gray-700 dark:text-gray-300" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Bank Account (Primary)</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Chase Bank · **** 1234</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                  Edit
                </button>
              </div>
              
              <button className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                <CreditCard size={16} className="mr-2" />
                Add Payment Method
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Payout Settings</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Payout Amount
                  </label>
                  <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    <option>$50 (Default)</option>
                    <option>$100</option>
                    <option>$250</option>
                    <option>$500</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payout Frequency
                  </label>
                  <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    <option>Monthly (Default)</option>
                    <option>Bi-weekly</option>
                    <option>Weekly</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    More frequent payouts available for accounts with consistent earnings over $500/month.
                  </p>
                </div>
                
                <div className="pt-4">
                  <Button>Save Settings</Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Tax Information</h2>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                For U.S. citizens, we require a W-9 form for tax purposes. For non-U.S. citizens, we require a W-8BEN form.
              </p>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Tax form not submitted</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Required for payouts over $600 in a calendar year</p>
                </div>
                <Button size="sm">Submit Form</Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BillingDashboard;