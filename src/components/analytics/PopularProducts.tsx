import React from 'react';
import { formatCurrency } from '../../lib/utils';

const PopularProducts: React.FC = () => {
  // Mock data - would be fetched from API in real app
  const products = [
    { id: 1, name: 'Wireless Noise Cancelling Headphones', category: 'Electronics', clicks: 87, conversions: 12, revenue: 156.72 },
    { id: 2, name: 'Ultra HD 4K Action Camera', category: 'Photography', clicks: 65, conversions: 8, revenue: 124.35 },
    { id: 3, name: 'Smart Fitness Watch', category: 'Wearables', clicks: 54, conversions: 7, revenue: 87.65 },
  ];

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div 
          key={product.id}
          className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div className="flex justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</h3>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(product.revenue)}</p>
          </div>
          <div className="flex justify-between text-xs">
            <p className="text-gray-500 dark:text-gray-400">{product.category}</p>
            <p className="text-gray-500 dark:text-gray-400">{product.conversions} conversions from {product.clicks} clicks</p>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, (product.conversions / product.clicks) * 100 * 5)}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PopularProducts;