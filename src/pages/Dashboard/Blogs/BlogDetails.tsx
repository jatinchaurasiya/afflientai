import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Globe, ExternalLink, CheckCircle, AlertCircle, Loader2, Edit3, Save, X } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';

interface Blog {
  id: string;
  title: string;
  url: string;
  verification_status: 'pending' | 'verified' | 'failed';
  verified: boolean;
  created_at: string;
  updated_at: string;
}

const BlogDetails: React.FC = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    url: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (blogId) {
      fetchBlog();
    }
  }, [blogId, user]);

  const fetchBlog = async () => {
    try {
      if (!user || !blogId) return;

      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', blogId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Blog not found or you do not have permission to view it.');
        } else {
          throw error;
        }
        return;
      }

      setBlog(data);
      setEditForm({
        title: data.title || '',
        url: data.url || ''
      });
    } catch (err) {
      console.error('Error fetching blog:', err);
      setError('Failed to load blog details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (blog) {
      setEditForm({
        title: blog.title || '',
        url: blog.url || ''
      });
    }
  };

  const handleSave = async () => {
    if (!blog || !user) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .update({
          title: editForm.title,
          url: editForm.url,
          updated_at: new Date().toISOString()
        })
        .eq('id', blog.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setBlog(data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating blog:', err);
      setError('Failed to update blog. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string, verified: boolean) => {
    if (verified) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle size={16} className="mr-2" />
          Verified
        </span>
      );
    }

    switch (status) {
      case 'failed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle size={16} className="mr-2" />
            Verification Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Loader2 size={16} className="mr-2 animate-spin" />
            Pending Verification
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

  if (error || !blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {error || 'Blog not found'}
          </p>
          <div className="mt-6">
            <Link to="/dashboard/blogs">
              <Button variant="outline" leftIcon={<ArrowLeft size={18} />}>
                Back to Blogs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard/blogs">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Details</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your blog information and settings
            </p>
          </div>
        </div>
        
        {!isEditing && (
          <Button onClick={handleEdit} leftIcon={<Edit3 size={18} />}>
            Edit Blog
          </Button>
        )}
      </div>

      {/* Blog Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Globe className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {blog.title || 'Untitled Blog'}
                </h2>
                {getStatusBadge(blog.verification_status, blog.verified)}
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Blog Title
                </label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Enter blog title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Blog URL
                </label>
                <Input
                  value={editForm.url}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                  placeholder="https://yourblog.com"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  leftIcon={saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  leftIcon={<X size={18} />}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Blog URL
                </h3>
                <div className="mt-2 flex items-center">
                  <a
                    href={blog.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                  >
                    {blog.url}
                    <ExternalLink size={16} className="ml-2" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Created
                  </h3>
                  <p className="mt-2 text-sm text-gray-900 dark:text-white">
                    {formatDate(blog.created_at)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Last Updated
                  </h3>
                  <p className="mt-2 text-sm text-gray-900 dark:text-white">
                    {formatDate(blog.updated_at)}
                  </p>
                </div>
              </div>

              {blog.verification_status === 'failed' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-400">
                    Verification Failed
                  </h4>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    We couldn't verify ownership of this blog. Please check that the verification code is properly installed and try again.
                  </p>
                </div>
              )}

              {blog.verification_status === 'pending' && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                    Verification Pending
                  </h4>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    We're currently verifying ownership of this blog. This process usually takes a few minutes.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogDetails;