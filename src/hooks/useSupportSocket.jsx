import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

const sharedStore = {
  socket: null,
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  listeners: new Set(),
  seenNotificationKeys: new Set(),
  socketHandlers: null,
  consumers: 0
};

const emitStoreUpdate = () => {
  sharedStore.listeners.forEach((listener) => {
    listener({
      isConnected: sharedStore.isConnected,
      notifications: [...sharedStore.notifications],
      unreadCount: sharedStore.unreadCount
    });
  });
};

const updateUnreadCount = (nextCount) => {
  const safeCount = Number.isFinite(nextCount) ? Math.max(0, nextCount) : 0;
  sharedStore.unreadCount = safeCount;
  emitStoreUpdate();
};

const buildNotificationKey = (notification = {}) => {
  const messageId = notification.id ?? notification.messageId ?? notification.message_id ?? null;
  if (messageId !== null && messageId !== undefined) {
    return `${notification.type || 'support'}-${String(messageId)}`;
  }

  return [
    notification.type || 'support',
    notification.senderType || '',
    notification.recipient || '',
    notification.studentId || '',
    notification.createdAt || notification.timestamp || '',
    notification.messagePreview || notification.message || ''
  ].join('|');
};

const upsertNotification = (notification) => {
  const key = buildNotificationKey(notification);
  if (sharedStore.seenNotificationKeys.has(key)) {
    return;
  }

  sharedStore.seenNotificationKeys.add(key);
  const normalized = {
    ...notification,
    id: notification.id || notification.messageId || Date.now(),
    timestamp: notification.createdAt || new Date().toISOString(),
    read: false
  };

  sharedStore.notifications = [normalized, ...sharedStore.notifications].slice(0, 100);

  // Keep key history bounded to avoid unbounded growth.
  if (sharedStore.seenNotificationKeys.size > 5000) {
    const keys = Array.from(sharedStore.seenNotificationKeys).slice(-2500);
    sharedStore.seenNotificationKeys = new Set(keys);
  }

  emitStoreUpdate();
};

const attachSocketListeners = (socket) => {
  if (sharedStore.socketHandlers) {
    return;
  }

  const handlers = {
    onConnect: () => {
      sharedStore.isConnected = true;
      emitStoreUpdate();
    },
    onDisconnect: () => {
      sharedStore.isConnected = false;
      emitStoreUpdate();
    },
    onConnectError: () => {
      sharedStore.isConnected = false;
      emitStoreUpdate();
    },
    onStudentMessage: (data) => {
      upsertNotification({
        type: 'student-message',
        ...data
      });
    },
    onAdminReply: (data) => {
      upsertNotification({
        type: 'admin-reply',
        ...data
      });
    },
    onReceiveMessage: (data) => {
      console.warn('[SupportSocket] receive_message:', data?.id || data?.messageId || data?.message_id || 'no-id');
      const inferredType = data.senderType === 'admin' ? 'admin-reply' : 'student-message';
      upsertNotification({
        type: inferredType,
        ...data
      });
    },
    onNewNotification: (data) => {
      if (typeof data?.unreadCount === 'number') {
        updateUnreadCount(data.unreadCount);
      }
    }
  };

  sharedStore.socketHandlers = handlers;

  socket.on('connect', handlers.onConnect);
  socket.on('disconnect', handlers.onDisconnect);
  socket.on('connect_error', handlers.onConnectError);
  socket.on('support:new-student-message', handlers.onStudentMessage);
  socket.on('support:new-admin-reply', handlers.onAdminReply);
  socket.on('receive_message', handlers.onReceiveMessage);
  socket.on('new_notification', handlers.onNewNotification);
};

const destroySocketIfUnused = () => {
  if (sharedStore.consumers > 0 || !sharedStore.socket) {
    return;
  }

  const handlers = sharedStore.socketHandlers;
  if (handlers) {
    sharedStore.socket.off('connect', handlers.onConnect);
    sharedStore.socket.off('disconnect', handlers.onDisconnect);
    sharedStore.socket.off('connect_error', handlers.onConnectError);
    sharedStore.socket.off('support:new-student-message', handlers.onStudentMessage);
    sharedStore.socket.off('support:new-admin-reply', handlers.onAdminReply);
    sharedStore.socket.off('receive_message', handlers.onReceiveMessage);
    sharedStore.socket.off('new_notification', handlers.onNewNotification);
  }
  sharedStore.socket.disconnect();
  sharedStore.socket = null;
  sharedStore.socketHandlers = null;
  sharedStore.isConnected = false;
};

/**
 * Request browser notification permission
 */
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('[BrowserNotification] Not supported');
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
  const roleJoinedRef = useRef(false);
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

  // Add a notification locally and optionally show browser notification.
  const addNotification = useCallback((notification, showBrowserNotif = true) => {
    upsertNotification(notification);

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
    sharedStore.notifications = [];
    updateUnreadCount(0);
  }, []);

  // Mark notifications as read
  const markAllRead = useCallback(() => {
    sharedStore.notifications = sharedStore.notifications.map((n) => ({ ...n, read: true }));
    updateUnreadCount(0);
  }, []);

  // Remove a notification
  const removeNotification = useCallback((notificationId) => {
    const notification = sharedStore.notifications.find((n) => n.id === notificationId);
    sharedStore.notifications = sharedStore.notifications.filter((n) => n.id !== notificationId);
    if (notification && !notification.read) {
      updateUnreadCount(sharedStore.unreadCount - 1);
    }
    emitStoreUpdate();
  }, []);

  const syncUnreadCount = useCallback((count) => {
    updateUnreadCount(count);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled) {
      return;
    }

    sharedStore.consumers += 1;

    if (!sharedStore.socket) {
      const socket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
        timeout: 20000,
        autoConnect: true
      });

      sharedStore.socket = socket;
      attachSocketListeners(socket);
    }

    const listener = (storeState) => {
      setIsConnected(storeState.isConnected);
      setNotifications(storeState.notifications);
      setUnreadCount(storeState.unreadCount);
    };
    sharedStore.listeners.add(listener);
    listener({
      isConnected: sharedStore.isConnected,
      notifications: sharedStore.notifications,
      unreadCount: sharedStore.unreadCount
    });

    // Cleanup on unmount
    return () => {
      sharedStore.listeners.delete(listener);
      sharedStore.consumers = Math.max(0, sharedStore.consumers - 1);
      roleJoinedRef.current = false;
      destroySocketIfUnused();
    };
  }, [enabled]);

  useEffect(() => {
    if (!isConnected) {
      roleJoinedRef.current = false;
    }
  }, [isConnected]);

  // Join role-specific support rooms once connected.
  useEffect(() => {
    const socket = sharedStore.socket;
    if (!enabled || !socket || !isConnected || roleJoinedRef.current) {
      return;
    }

    if (isAdmin) {
      socket.emit('admin:join-support');
      roleJoinedRef.current = true;
      return;
    }

    if (rollNumber) {
      socket.emit('student:join-support', { rollNumber, studentName });
      roleJoinedRef.current = true;
    }
  }, [enabled, isAdmin, rollNumber, studentName, isConnected]);

  // Provide a getter function for the socket instead of directly returning ref.current
  const getSocket = useCallback(() => sharedStore.socket, []);

  const emitMarkRead = useCallback(() => {
    const socket = sharedStore.socket;
    if (!socket?.connected) {
      return;
    }

    if (isAdmin) {
      socket.emit('support:mark-read', { role: 'admin' });
    } else if (rollNumber) {
      socket.emit('support:mark-read', { role: 'student', rollNumber });
    }
  }, [isAdmin, rollNumber]);

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
    syncUnreadCount,
    emitMarkRead,
    removeNotification,
    notificationPermission,
    requestPermission
  };
};

export default useSupportSocket;
