import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, ChevronLeft, Send, Upload, Image, AlertCircle, Check, RefreshCw, Bell } from 'lucide-react';
import { CHATBOT_TOPICS, CHATBOT_QA, TOPIC_ICONS } from '../../data/chatbotData';
import { apiFetch } from '../../config/api';
import { useSupportSocket } from '../../hooks/useSupportSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Icon = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const StudentSupportChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('topics'); // 'topics', 'questions', 'chat', 'contact'
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToastNotification, setShowToastNotification] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const processedNotificationsRef = useRef(new Set()); // Track which notifications we've processed

  // Get student info from localStorage
  const studentName = localStorage.getItem('studentName') || 'Student';
  const studentEmail = localStorage.getItem('studentEmail') || '';
  // Use rollNumber as student_id for consistent message tracking
  const studentId = localStorage.getItem('rollNumber') || '';
  const institute = localStorage.getItem('institute') || '';

  // Support socket for real-time notifications
  const { 
    notifications, 
    markAllRead: socketMarkAllRead,
    notificationPermission,
    requestPermission,
    isConnected
  } = useSupportSocket({ 
    isAdmin: false, 
    rollNumber: studentId, 
    studentName, 
    enabled: !!studentId,
    enableBrowserNotifications: true 
  });

  // Debug: Log socket connection status
  useEffect(() => {
    console.log('[StudentChatbot] Socket connection status:', isConnected);
    console.log('[StudentChatbot] Student ID (rollNumber):', studentId);
  }, [isConnected, studentId]);

  // Request notification permission on first user interaction
  useEffect(() => {
    if (notificationPermission === 'default') {
      const handleClick = () => {
        requestPermission();
        document.removeEventListener('click', handleClick);
      };
      document.addEventListener('click', handleClick, { once: true });
    }
  }, [notificationPermission, requestPermission]);

  // Fetch unread count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!studentId) return;
      
      try {
        const token = localStorage.getItem('studentAuthToken');
        const response = await apiFetch('api/student-messages/student-unread-count', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUnreadCount(data.count);
          }
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Poll every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [studentId]);

  // Handle socket notifications for new admin replies
  useEffect(() => {
    console.log('[StudentChatbot] Notifications changed:', notifications.length);
    
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      const notificationId = latestNotification.id;
      
      console.log('[StudentChatbot] Latest notification:', latestNotification);
      console.log('[StudentChatbot] Already processed?', processedNotificationsRef.current.has(notificationId));
      
      // Only process if we haven't already processed this notification
      if (!latestNotification.read && !processedNotificationsRef.current.has(notificationId)) {
        console.log('[StudentChatbot] Showing toast for new notification ID:', notificationId);
        
        // Mark as processed
        processedNotificationsRef.current.add(notificationId);
        
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        setToastMessage(latestNotification);
        setShowToastNotification(true);
        
        // Auto-hide toast
        const timer = setTimeout(() => {
          setShowToastNotification(false);
          setToastMessage(null);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  // Mark messages as read when opening contact view
  const markMessagesAsRead = useCallback(async () => {
    if (!studentId) return;
    
    try {
      const token = localStorage.getItem('studentAuthToken');
      await apiFetch('api/student-messages/mark-student-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUnreadCount(0);
      socketMarkAllRead();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [studentId, socketMarkAllRead]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, conversationHistory]);

  // Clear send status after 3 seconds
  useEffect(() => {
    if (sendStatus) {
      const timer = setTimeout(() => setSendStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [sendStatus]);

  // Fetch conversation history when Contact/Support is opened
  const fetchConversationHistory = useCallback(async () => {
    if (!studentId) return;
    
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('studentAuthToken');
      const response = await apiFetch(`api/student-messages/conversation`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConversationHistory(data.messages || []);
        }
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [studentId]);

  const handleOpen = () => {
    setIsOpen(true);
    setCurrentView('topics');
    setSelectedTopic(null);
    setMessages([]);
    setSendStatus(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  const resetState = () => {
    setCurrentView('topics');
    setSelectedTopic(null);
    setMessages([]);
    setNewMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    setSendStatus(null);
    setConversationHistory([]);
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    
    // If Contact/Support topic, go directly to chat view
    if (topic.id === 'contact') {
      setCurrentView('contact');
      fetchConversationHistory();
      // Mark admin replies as read when opening support chat
      markMessagesAsRead();
    } else {
      setCurrentView('questions');
      setMessages([{
        type: 'bot',
        content: `You selected "${topic.title}". Here are some common questions:`
      }]);
    }
  };

  const handleQuestionClick = (qa) => {
    setMessages(prev => [
      ...prev,
      { type: 'user', content: qa.question },
      { type: 'bot', content: qa.answer }
    ]);
    setCurrentView('chat');
  };

  const handleBackToTopics = () => {
    setCurrentView('topics');
    setSelectedTopic(null);
    setMessages([]);
    setConversationHistory([]);
  };

  const handleBackToQuestions = () => {
    setCurrentView('questions');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !selectedImage) {
      return;
    }

    setIsSending(true);
    setSendStatus(null);

    try {
      const token = localStorage.getItem('studentAuthToken');
      const formData = new FormData();
      formData.append('message', newMessage.trim());
      formData.append('topic', 'Contact / Support');
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch(`${API_URL}/api/student-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSendStatus('success');
        // Add message to conversation history locally
        setConversationHistory(prev => [...prev, {
          id: data.data.id,
          message: newMessage.trim(),
          image_path: data.data.imagePath || null,
          sender_type: 'student',
          created_at: new Date().toISOString()
        }]);
        setNewMessage('');
        removeImage();
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Render topic selection
  const renderTopics = () => (
    <div className="p-4 space-y-3">
      <p className="text-sm text-shnoor-soft mb-4">
        Hi {studentName}! 👋 How can I help you today? Select a topic below:
      </p>
      {CHATBOT_TOPICS.map((topic) => (
        <button
          key={topic.id}
          onClick={() => handleTopicSelect(topic)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group ${
            topic.id === 'contact' 
              ? 'border-shnoor-indigo bg-shnoor-lavender hover:bg-shnoor-indigo/20' 
              : 'border-shnoor-mist bg-white hover:bg-shnoor-lavender hover:border-shnoor-indigo/30'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            topic.id === 'contact' 
              ? 'bg-shnoor-indigo/20 group-hover:bg-shnoor-indigo/30' 
              : 'bg-shnoor-lavender group-hover:bg-shnoor-indigo/20'
          }`}>
            <Icon d={TOPIC_ICONS[topic.icon]} className="w-5 h-5 text-shnoor-indigo" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-shnoor-navy">{topic.title}</p>
            <p className="text-xs text-shnoor-soft">{topic.description}</p>
          </div>
        </button>
      ))}
    </div>
  );

  // Render questions for selected topic (no Contact Admin option)
  const renderQuestions = () => {
    const questions = CHATBOT_QA[selectedTopic.id] || [];
    
    return (
      <div className="p-4 space-y-2">
        {questions.map((qa, index) => (
          <button
            key={index}
            onClick={() => handleQuestionClick(qa)}
            className="w-full text-left p-3 rounded-lg border border-shnoor-mist bg-white hover:bg-shnoor-lavender hover:border-shnoor-indigo/30 transition-all text-sm text-shnoor-navy"
          >
            {qa.question}
          </button>
        ))}
      </div>
    );
  };

  // Render chat messages (FAQ answers)
  const renderChat = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] p-3 rounded-xl text-sm whitespace-pre-wrap ${
              msg.type === 'user'
                ? 'bg-shnoor-indigo text-white rounded-tr-none'
                : 'bg-shnoor-lavender text-shnoor-navy rounded-tl-none'
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
      
      {/* Show more questions button */}
      {currentView === 'chat' && selectedTopic && (
        <div className="pt-4">
          <button
            onClick={handleBackToQuestions}
            className="w-full text-center p-2 rounded-lg border border-shnoor-mist bg-white hover:bg-shnoor-lavender text-sm text-shnoor-indigo font-medium"
          >
            Show more questions
          </button>
        </div>
      )}
    </div>
  );

  // Render Contact/Support chat interface
  const renderContactSupport = () => (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-shnoor-indigo/30 border-t-shnoor-indigo rounded-full animate-spin"></div>
          </div>
        ) : conversationHistory.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={48} className="mx-auto mb-4 text-shnoor-soft opacity-30" />
            <p className="text-sm text-shnoor-soft">No messages yet.</p>
            <p className="text-xs text-shnoor-soft mt-1">Send your first message to get support!</p>
          </div>
        ) : (
          <>
            {conversationHistory.map((msg, index) => {
              const isStudent = msg.sender_type === 'student';
              const showDate = index === 0 || 
                formatDate(msg.created_at) !== formatDate(conversationHistory[index - 1].created_at);
              
              return (
                <div key={msg.id || index}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="text-xs text-shnoor-soft bg-shnoor-lavender px-3 py-1 rounded-full">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${isStudent ? 'order-2' : 'order-1'}`}>
                      {!isStudent && (
                        <p className="text-xs text-shnoor-indigo font-medium mb-1 ml-1">Admin</p>
                      )}
                      <div
                        className={`p-3 rounded-xl text-sm ${
                          isStudent
                            ? 'bg-shnoor-indigo text-white rounded-tr-none'
                            : 'bg-shnoor-lavender text-shnoor-navy rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        {msg.image_path && (
                          <img
                            src={`${API_URL}${msg.image_path}`}
                            alt="Attachment"
                            className="mt-2 max-w-full rounded-lg cursor-pointer"
                            onClick={() => window.open(`${API_URL}${msg.image_path}`, '_blank')}
                          />
                        )}
                      </div>
                      <p className={`text-xs text-shnoor-soft mt-1 ${isStudent ? 'text-right mr-1' : 'ml-1'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-shnoor-mist p-4 bg-white">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-shnoor-mist"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Status messages */}
        {sendStatus === 'success' && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 text-green-700 text-xs mb-2">
            <Check size={14} />
            Message sent!
          </div>
        )}
        {sendStatus === 'error' && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 text-red-700 text-xs mb-2">
            <AlertCircle size={14} />
            Failed to send. Try again.
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              className="w-full p-3 pr-10 rounded-xl border border-shnoor-mist focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo outline-none text-sm resize-none max-h-24"
              style={{ minHeight: '44px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3 bottom-3 text-shnoor-soft hover:text-shnoor-indigo transition-colors"
              title="Attach image"
            >
              <Image size={18} />
            </button>
          </div>
          <button
            type="submit"
            disabled={isSending || (!newMessage.trim() && !selectedImage)}
            className="p-3 rounded-xl bg-shnoor-indigo text-white hover:bg-shnoor-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Toast Notification for New Admin Reply - positioned at top for global visibility */}
      {showToastNotification && toastMessage && (
        <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
          <div 
            className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 max-w-sm cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => {
              setShowToastNotification(false);
              setToastMessage(null);
              handleOpen();
              // Directly go to contact view
              setSelectedTopic({ id: 'contact' });
              setCurrentView('contact');
              fetchConversationHistory();
              markMessagesAsRead();
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-shnoor-indigo/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell size={18} className="text-shnoor-indigo" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-shnoor-navy">
                  New Reply from Support
                </p>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                  {toastMessage.messagePreview}
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowToastNotification(false);
                  setToastMessage(null);
                }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        onClick={handleOpen}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-shnoor-indigo text-white shadow-lg hover:bg-shnoor-navy transition-all hover:scale-110 flex items-center justify-center ${isOpen ? 'hidden' : ''}`}
        aria-label="Open support chat"
      >
        <MessageCircle size={24} />
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-shnoor-indigo text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {(currentView !== 'topics') && (
                <button
                  onClick={handleBackToTopics}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div>
                <h3 className="font-bold text-base">
                  {currentView === 'topics' && 'Help Center'}
                  {currentView === 'questions' && selectedTopic?.title}
                  {currentView === 'chat' && selectedTopic?.title}
                  {currentView === 'contact' && 'Contact / Support'}
                </h3>
                <p className="text-xs text-white/70">
                  {currentView === 'topics' && 'SHNOOR Assessment Portal'}
                  {currentView === 'contact' && 'Chat with Admin'}
                  {(currentView === 'questions' || currentView === 'chat') && 'Frequently asked questions'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentView === 'contact' && (
                <button
                  onClick={fetchConversationHistory}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  title="Refresh messages"
                >
                  <RefreshCw size={18} />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden bg-gray-50/50 flex flex-col">
            {currentView === 'topics' && (
              <div className="overflow-y-auto">{renderTopics()}</div>
            )}
            {currentView === 'questions' && (
              <div className="overflow-y-auto">{renderQuestions()}</div>
            )}
            {currentView === 'chat' && renderChat()}
            {currentView === 'contact' && renderContactSupport()}
          </div>

          {/* Footer */}
          {currentView !== 'contact' && (
            <div className="p-3 border-t border-shnoor-mist bg-white text-center flex-shrink-0">
              <p className="text-xs text-shnoor-soft">
                Powered by SHNOOR Assessments
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default StudentSupportChatbot;
