import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Copy, CheckCircle, Layers, Palette, ArrowRight, AlertCircle, CheckSquare } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

interface WidgetPreviewProps {
  theme: string;
  position: string;
  maxProducts: number;
}

const WidgetPreview: React.FC<WidgetPreviewProps> = ({ theme, position, maxProducts }) => {
  const themeClass = theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800';
  const positionClass = 
    position === 'sidebar' ? 'w-full md:w-64' : 
    position === 'floating' ? 'w-64' : 
    'w-full';

  return (
    <div className={`${themeClass} rounded-lg shadow-md border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
      <div className={`p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h3 className="font-medium">Recommended Products</h3>
      </div>
      <div className="p-4">
        {Array.from({ length: Math.min(maxProducts, 3) }).map((_, i) => (
          <div key={i} className={`flex items-center py-3 ${i !== 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}`}>
            <div className={`w-12 h-12 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} flex-shrink-0`}></div>
            <div className="ml-3 flex-1">
              <div className={`h-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4 mb-2`}></div>
              <div className={`h-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CreateWidget: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [widgetName, setWidgetName] = useState('My First Widget');
  const [theme, setTheme] = useState('light');
  const [position, setPosition] = useState('sidebar');
  const [maxProducts, setMaxProducts] = useState(3);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [embedCode, setEmbedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Get the first blog from the database (in a real app, we'd let users select which blog)
      const { data: blogs, error: blogError } = await supabase
        .from('blogs')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (blogError) throw blogError;
      if (!blogs || blogs.length === 0) throw new Error('No blogs found. Please add a blog first.');
      
      const blogId = blogs[0].id;
      
      // Create the widget
      const { data: widget, error: widgetError } = await supabase
        .from('widgets')
        .insert({
          user_id: user.id,
          blog_id: blogId,
          name: widgetName,
          settings: {
            theme,
            position,
            max_products: maxProducts,
            categories: categories.length > 0 ? categories : undefined
          }
        })
        .select()
        .single();
      
      if (widgetError) throw widgetError;
      
      setSuccess('Widget created successfully!');
      
      // Generate embed code
      const code = `<script async src="https://affiliate-ai.example.com/widget.js?id=${widget.id}"></script>
<div id="affiliate-ai-widget" data-widget-id="${widget.id}"></div>`;
      
      setEmbedCode(code);
    } catch (err) {
      console.error('Error creating widget:', err);
      setError(err instanceof Error ? err.message : 'Failed to create widget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (embedCode) {
      navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Your Widget</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Customize how your affiliate product recommendations will appear on your blog.
        </p>
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
      
      {success && embedCode && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 mb-6 bg-green-100 rounded-lg dark:bg-green-900/30 border border-green-200 dark:border-green-800"
        >
          <div className="flex items-start text-sm text-green-700 dark:text-green-400 mb-4">
            <CheckCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            {success} Add this code to your blog to display product recommendations.
          </div>
          
          <div className="relative">
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <pre className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap">{embedCode}</pre>
            </div>
            <button 
              onClick={copyToClipboard}
              className="absolute top-3 right-3 p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
              aria-label="Copy to clipboard"
            >
              {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center">
            <Settings size={20} className="mr-2" />
            Widget Settings
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Widget Name"
              value={widgetName}
              onChange={(e) => setWidgetName(e.target.value)}
              required
              helperText="For your reference only"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={() => setTheme('light')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Light</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={() => setTheme('dark')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Dark</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="auto"
                    checked={theme === 'auto'}
                    onChange={() => setTheme('auto')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Auto (follows user's preference)</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Position
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="position"
                    value="inline"
                    checked={position === 'inline'}
                    onChange={() => setPosition('inline')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Inline (within content)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="position"
                    value="sidebar"
                    checked={position === 'sidebar'}
                    onChange={() => setPosition('sidebar')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Sidebar</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="position"
                    value="floating"
                    checked={position === 'floating'}
                    onChange={() => setPosition('floating')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Floating</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Products to Display
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={maxProducts}
                onChange={(e) => setMaxProducts(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {maxProducts} product{maxProducts !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Categories (Optional)
              </label>
              <div className="flex">
                <Input
                  placeholder="e.g., Electronics, Books"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCategory}
                  className="ml-2"
                >
                  Add
                </Button>
              </div>
              {categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <span 
                      key={category}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    >
                      {category}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(category)}
                        className="ml-1 flex-shrink-0 inline-flex text-blue-600 dark:text-blue-400 focus:outline-none"
                      >
                        <span className="sr-only">Remove {category}</span>
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Limit recommendations to specific product categories
              </p>
            </div>
            
            <div className="pt-4">
              <Button
                type="submit"
                isLoading={isSubmitting}
                leftIcon={<Layers size={18} />}
              >
                Create Widget
              </Button>
              
              {embedCode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleContinue}
                  className="ml-4"
                  rightIcon={<ArrowRight size={18} />}
                >
                  Go to Dashboard
                </Button>
              )}
            </div>
          </form>
        </div>
        
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center">
              <Palette size={20} className="mr-2" />
              Widget Preview
            </h3>
            
            <div className="flex justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <WidgetPreview 
                theme={theme === 'auto' ? 'light' : theme} 
                position={position}
                maxProducts={maxProducts}
              />
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
              This is a preview of how your widget will appear. Actual product recommendations will be generated by AI based on your blog content.
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-4">Widget Features</h3>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <CheckSquare size={18} className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-white">Context-aware recommendations</span> - 
                  AI analyzes your content to suggest relevant products
                </span>
              </div>
              
              <div className="flex items-start">
                <CheckSquare size={18} className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-white">Responsive design</span> - 
                  Adapts to all screen sizes and devices
                </span>
              </div>
              
              <div className="flex items-start">
                <CheckSquare size={18} className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-white">Performance optimized</span> - 
                  Lightweight and fast-loading for better SEO
                </span>
              </div>
              
              <div className="flex items-start">
                <CheckSquare size={18} className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-white">Built-in analytics</span> - 
                  Track impressions, clicks, and conversions
                </span>
              </div>
              
              <div className="flex items-start">
                <CheckSquare size={18} className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-white">Easy customization</span> - 
                  Edit appearance and behavior from dashboard
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWidget;