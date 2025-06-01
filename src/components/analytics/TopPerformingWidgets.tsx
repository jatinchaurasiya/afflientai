import React from 'react';
import { Boxes } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

const TopPerformingWidgets: React.FC = () => {
  // Mock data - would be fetched from API in real app
  const widgets = [
    { id: 1, name: 'Sidebar Recommendations', blog: 'Travel Blog', impressions: 4523, clicks: 287, revenue: 345.72 },
    { id: 2, name: 'In-Content Links', blog: 'Tech Review Blog', impressions: 3876, clicks: 254, revenue: 276.35 },
    { id: 3, name: 'End of Post Widget', blog: 'Cooking Blog', impressions: 2934, clicks: 165, revenue: 198.21 },
  ];

  return (
    <div className="space-y-4">
      {widgets.map((widget) => (
        <div 
          key={widget.id}
          className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center"
        >
          <div className="flex-shrink-0 p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <Boxes size={20} />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{widget.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{widget.blog}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(widget.revenue)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{widget.clicks} clicks</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopPerformingWidgets;