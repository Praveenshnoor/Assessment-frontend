import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, LogOut, Settings, MessageSquare, X } from 'lucide-react';
import Button from './Button';
import { useSupportSocket } from '../hooks/useSupportSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminHeader = ({ title = "Dashboard", userName = "Admin" }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotification, setToastNotification] = useState(null);
  
  // Disable support socket in interview room to avoid conflicts
  const isInterviewRoom = window.location.pathname.includes('/interview/');
  
  // Use support socket for real-time notifications with browser notifications enabled
  const { 
    notifications, 
    unreadCount: socketUnreadCount,
    clearNotifications,
    notificationPermission,
    requestPermission
  } = useSupportSocket({ 
    isAdmin: true, 
    enabled: !isInterviewRoom, // Disable in interview room
    enableBrowserNotifications: !isInterviewRoom 
  });

  // Request notification permission on first interaction if not granted
  useEffect(() => {
    if (notificationPermission === 'default') {
      // Will be requested on first user interaction
      const handleClick = () => {
        requestPermission();
        document.removeEventListener('click', handleClick);
      };
      document.addEventListener('click', handleClick, { once: true });
    }
  }, [notificationPermission, requestPermission]);

  // Show toast when new notification arrives
  useEffect(() => {
    if (notifications.length > 0 && !notifications[0].read) {
      const latestNotification = notifications[0];
      setToastNotification(latestNotification);
      
      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Update unread count when socket notifications change
  useEffect(() => {
    setUnreadCount(socketUnreadCount);
  }, [socketUnreadCount]);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const response = await fetch(`${API_URL}/api/student-messages/unread-count`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.count);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();

    // Listen for unread count changes from StudentMessages page
    const handleUnreadChange = (e) => {
      setUnreadCount(e.detail.unreadCount || 0);
      if ((e.detail.unreadCount || 0) === 0) {
        clearNotifications();
      }
    };
    window.addEventListener('admin-unread-messages-changed', handleUnreadChange);
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('admin-unread-messages-changed', handleUnreadChange);
    };
  }, [clearNotifications]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <>
    <header className="w-full bg-shnoor-navy h-[72px] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo icon */}
          <div className="w-12 h-12 bg-shnoor-lavender rounded-xl flex items-center justify-center font-bold text-shnoor-indigo text-xl">
            A
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Admin Dashboard</h1>
            <p className="text-shnoor-light opacity-80 text-xs">MCQ Management System</p>
          </div>
        </div>

        {/* Right Side: Messages, Proctoring & Logout */}
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            className="!h-10 !px-5 text-sm bg-shnoor-indigo hover:bg-[#6b6be5] hover:shadow-[0_0_15px_rgba(107,107,229,0.4)] hover:-translate-y-0.5 transition-all border-0 relative"
            onClick={() => navigate('/admin/student-messages')}
          >
            <MessageSquare size={16} className="mr-2" />
            Messages
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
          <Button
            variant="primary"
            className="!h-10 !px-5 text-sm bg-shnoor-indigo hover:bg-[#6b6be5] hover:shadow-[0_0_15px_rgba(107,107,229,0.4)] hover:-translate-y-0.5 transition-all border-0"
            onClick={() => navigate('/admin/live-proctoring')}
          >
            <Video size={16} className="mr-2" />
            Live Proctoring
          </Button>
          <Button
            variant="primary"
            className="!h-10 !px-5 text-sm bg-shnoor-indigo hover:bg-[#6b6be5] hover:shadow-[0_0_15px_rgba(107,107,229,0.4)] hover:-translate-y-0.5 transition-all border-0"
            onClick={() => navigate('/admin/settings')}
          >
            <Settings size={16} className="mr-2" />
            Settings
          </Button>
          <Button
            variant="secondary"
            className="!h-10 !px-5 text-sm bg-transparent hover:bg-white/10 text-white border border-white/20"
            onClick={handleLogout}
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>

      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div 
            className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 max-w-sm cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => {
              setToastNotification(null);
              navigate('/admin/student-messages');
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-shnoor-indigo/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare size={18} className="text-shnoor-indigo" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-shnoor-navy">
                  New Message from {toastNotification.studentName || 'Student'}
                </p>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                  {toastNotification.messagePreview}
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setToastNotification(null);
                }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHeader;
