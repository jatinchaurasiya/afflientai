import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Globe, 
  BarChart3, 
  CreditCard, 
  Settings, 
  Users, 
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  Bell,
  Bot,
  Palette,
  Brain,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';

const DashboardLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New AI recommendation generated', time: '5 minutes ago' },
    { id: 2, text: 'Content analysis completed', time: '1 hour ago' },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Websites', href: '/dashboard/websites', icon: Globe },
    { name: 'Blogs', href: '/dashboard/blogs', icon: Globe },
    { name: 'Affiliate Accounts', href: '/dashboard/affiliate-accounts', icon: ShoppingBag },
    { name: 'Smart Popups', href: '/dashboard/smart-popups', icon: Palette },
    { name: 'AI Recommendations', href: '/dashboard/ai-recommendations', icon: Brain },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  ];
  
  const bottomNavigation = [
    { name: 'Help & Support', href: '/dashboard/support', icon: HelpCircle },
    { name: 'Invite Team', href: '/dashboard/invite', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const isCurrentPath = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    if (path !== '/dashboard' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: "-100%", opacity: 0 }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="relative z-10 bg-white dark:bg-gray-800 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <button 
                className="p-2 rounded-md text-gray-500 md:hidden"
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              
              <NavLink to="/" className="flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg">
                  <Zap size={24} />
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Afflient.ai
                </span>
              </NavLink>
            </div>
            
            <div className="flex items-center">
              <div className="relative">
                <button 
                  onClick={toggleNotifications}
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none relative"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {notifications.length}
                  </span>
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-20 border border-gray-200 dark:border-gray-700">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                      <button className="text-xs text-blue-600 dark:text-blue-400">Mark all as read</button>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div key={notification.id} className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <p className="text-sm text-gray-800 dark:text-gray-200">{notification.text}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No new notifications
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
                      <button className="text-xs text-blue-600 dark:text-blue-400">View all notifications</button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="ml-3 relative">
                <div>
                  <button
                    className="flex items-center max-w-xs rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu-button"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center overflow-hidden">
                      {user?.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.full_name || user.email}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        user?.full_name?.[0] || user?.email[0] || 'U'
                      )}
                    </div>
                    <span className="ml-2 text-gray-700 dark:text-gray-300 hidden md:block">
                      {user?.full_name || user?.email.split('@')[0]}
                    </span>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* Mobile sidebar */}
        <motion.div 
          className="fixed inset-0 z-40 md:hidden"
          initial="closed"
          animate={isMobileMenuOpen ? "open" : "closed"}
          variants={{
            open: { opacity: 1, x: 0 },
            closed: { opacity: 0, x: "-100%" }
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Overlay */}
          <motion.div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            initial={{ opacity: 0 }}
            animate={{ opacity: isMobileMenuOpen ? 0.75 : 0 }}
            transition={{ duration: 0.3 }}
            onClick={toggleMobileMenu}
          ></motion.div>
          
          {/* Sidebar */}
          <motion.div 
            className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-900 h-full"
            variants={sidebarVariants}
          >
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={toggleMobileMenu}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg">
                  <Zap size={24} />
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Afflient.ai
                </span>
              </div>
              
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `${
                        isCurrentPath(item.href)
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 dark:from-blue-900/20 dark:to-purple-900/20 dark:text-blue-500'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-500'
                      } group flex items-center px-2 py-2 text-base font-medium rounded-md transition-all duration-200`
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon
                      className="mr-4 h-6 w-6 flex-shrink-0"
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-3">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center">
                    {user?.full_name?.[0] || user?.email[0] || 'U'}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800 dark:text-white">
                    {user?.full_name || 'User'}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 px-2 space-y-1">
                {bottomNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="inline mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                ))}
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                >
                  Sign out
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Desktop sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 pt-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `${
                        isCurrentPath(item.href)
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 dark:from-blue-900/20 dark:to-purple-900/20 dark:text-blue-500 border-r-2 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-500'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200`
                    }
                  >
                    <item.icon
                      className="mr-3 h-5 w-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-6 px-2 mt-auto">
              {bottomNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `${
                      isCurrentPath(item.href)
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 dark:from-blue-900/20 dark:to-purple-900/20 dark:text-blue-500'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-500'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 transition-all duration-200`
                  }
                >
                  <item.icon
                    className="mr-3 h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
              
              <button
                onClick={signOut}
                className="w-full mt-2 flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
              >
                <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="md:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;