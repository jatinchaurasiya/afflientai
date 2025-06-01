import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, PlusCircle, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';

interface Blog {
  id: string;
  title: string;
  url: string;
  verification_status: 'pending' | 'verified' | 'failed';
  created_at: string;
}

const BlogList: React.FC = () => {
  const { user } = useAuthStore();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, [user]);

  const fetchBlogs = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load blogs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle size={12} className="mr-1" />
            Verified
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle size={12} className="mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Loader2 size={12} className="mr-1 animate-spin" />
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Blogs</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your connected blogs and their product recommendations
          </p>
        </div>
        
        <Link to="/dashboard/blogs/new">
          <Button leftIcon={<PlusCircle size={18} />}>
            Add Blog
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {blogs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No blogs yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by adding your first blog.
          </p>
          <div className="mt-6">
            <Link to="/dashboard/blogs/new">
              <Button leftIcon={<PlusCircle size={18} />}>
                Add Blog
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {blogs.map((blog) => (
              <li key={blog.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      {blog.title || 'Untitled Blog'}
                    </h3>
                    <div className="mt-1 flex items-center">
                      <a
                        href={blog.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                      >
                        {blog.url}
                        <ExternalLink size={14} className="ml-1" />
                      </a>
                    </div>
                    <div className="mt-2 flex items-center space-x-4">
                      {getStatusBadge(blog.verification_status)}
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Added {formatDate(blog.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex items-center space-x-4">
                    <Link
                      to={`/dashboard/blogs/${blog.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BlogList;