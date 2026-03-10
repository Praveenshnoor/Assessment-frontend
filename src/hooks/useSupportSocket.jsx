import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Request browser notification permission
 */
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('[BrowserNotification] Not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Show a browser notification
 */
const showBrowserNotification = (title, body, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: options.tag || 'support-message',
      requireInteraction: false,
      silent: false,
      ...options
    });

    notification.onclick = () => {
      window.focus();
      if (options.onClick) options.onClick();
      notification.close();
    };

    // Auto-close after 8 seconds
    setTimeout(() => notification.close(), 8000);

    return notification;
  } catch (error) {
    console.error('[BrowserNotification] Error:', error);
    return null;
  }
};

/**
 * Hook for managing support message socket connection and notifications
 * @param {Object} options - Configuration options
 * @param {boolean} options.isAdmin - Whether the user is an admin
 * @param {string} options.rollNumber - Student roll number (for student mode)
 * @param {string} options.studentName - Student name (for student mode)
 * @param {boolean} options.enabled - Whether to enable socket connection
 * @param {boolean} options.enableBrowserNotifications - Whether to show browser notifications
 * @returns {Object} Socket state and methods
 */
export const useSupportSocket = ({ 
  isAdmin = false, 
  rollNumber, 
  studentName, 
  enabled = true,
  enableBrowserNotifications = true 
} = {}) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  // Request notification permission on mount
  useEffect(() => {
    if (enableBrowserNotifications && enabled) {
      requestNotificationPermission().then(granted => {
        setNotificationPermission(granted ? 'granted' : 'denied');
      });
    }
  }, [enableBrowserNotifications, enabled]);

  // Add a notification
  const addNotification = useCallback((notification, showBrowserNotif = true) => {
    const newNotification = {
      ...notification,
      id: notification.id || Date.now(),
      timestamp: notification.createdAt || new Date().toISOString(),
      read: false
    };
    console.log('[SupportSocket] Adding notification:', newNotification);
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount(prev => prev + 1);

    // Show browser notification if enabled (show regardless of focus for immediate visibility)
    if (showBrowserNotif && enableBrowserNotifications) {
      if (notification.type === 'student-message') {
        showBrowserNotification(
          `New message from ${notification.studentName || 'Student'}`,
          notification.messagePreview || 'You have a new support message',
          { tag: `support-${notification.id}` }
        );
      } else if (notification.type === 'admin-reply') {
        showBrowserNotification(
          'New reply from Support',
          notification.messagePreview || 'You have a new reply from admin',
          { tag: `support-${notification.id}` }
        );
      }
    }
  }, [enableBrowserNotifications]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Mark notifications as read
  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Remove a notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Create socket connection
    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000,
      autoConnect: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SupportSocket] Connected:', socket.id);
      setIsConnected(true);

      // Join appropriate room based on user type
      if (isAdmin) {
        socket.emit('admin:join-support');
        console.log('[SupportSocket] Admin joining support room');
      } else if (rollNumber) {
        socket.emit('student:join-support', { rollNumber, studentName });
        console.log('[SupportSocket] Student joining support room:', `support-student-${rollNumber}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[SupportSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[SupportSocket] Connection error:', error.message);
      setIsConnected(false);
    });

    // Admin notifications - new student message
    if (isAdmin) {
      socket.on('support:new-student-message', (data) => {
        console.log('[SupportSocket] New student message received:', data);
        addNotification({
          type: 'student-message',
          id: data.id,
          studentName: data.studentName,
          studentId: data.studentId,
          college: data.college,
          messagePreview: data.messagePreview,
          topic: data.topic,
          createdAt: data.createdAt,
          hasImage: data.hasImage
        }, true);
      });

      // Listen for confirmation that we joined the room
      socket.on('admin:support-joined', (data) => {
        console.log('[SupportSocket] Admin support room joined:', data);
      });
    }

    // Student notifications - new admin reply
    if (!isAdmin && rollNumber) {
      socket.on('support:new-admin-reply', (data) => {
        console.log('[SupportSocket] New admin reply received:', data);
        addNotification({
          type: 'admin-reply',
          id: data.id,
          messagePreview: data.messagePreview,
          createdAt: data.createdAt,
          hasImage: data.hasImage
        }, true);
      });

      // Listen for confirmation that we joined the room
      socket.on('student:support-joined', (data) => {
        console.log('[SupportSocket] Student support room joined:', data);
      });
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('support:new-student-message');
        socket.off('support:new-admin-reply');
        socket.off('student:support-joined');
        socket.off('admin:support-joined');
        socket.disconnect();
      }
    };
  }, [enabled, isAdmin, rollNumber, studentName, addNotification]);

  // Provide a getter function for the socket instead of directly returning ref.current
  const getSocket = useCallback(() => socketRef.current, []);

  // Method to request notification permission
  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    return granted;
  }, []);

  return {
    getSocket,
    isConnected,
    notifications,
    unreadCount,
    addNotification,
    clearNotifications,
    markAllRead,
    removeNotification,
    notificationPermission,
    requestPermission
  };
};

export default useSupportSocket;
