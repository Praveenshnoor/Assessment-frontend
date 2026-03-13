import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MailOpen, Trash2, Image, Filter, RefreshCw, CheckCheck, Clock, User, AlertCircle, X, Send, Building, MessageCircle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const showConfirm = (message) => {
  const confirmFn = globalThis?.['confirm'];
  return typeof confirmFn === 'function' ? confirmFn(message) : false;
};

const showAlert = (message) => {
  const alertFn = globalThis?.['alert'];
  if (typeof alertFn === 'function') {
    alertFn(message);
  }
};

const StudentMessages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [conversationThread, setConversationThread] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      let url = `${API_URL}/api/student-messages?page=${pagination.page}&limit=${pagination.limit}`;
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }
      if (selectedCollege) {
        url += `&college=${encodeURIComponent(selectedCollege)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
        setColleges(data.colleges || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch messages');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, selectedCollege, pagination.page, pagination.limit]);

  const fetchConversationThread = useCallback(async (messageId) => {
    try {
      setLoadingThread(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_URL}/api/student-messages/${messageId}/thread`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setConversationThread(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching thread:', err);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchMessages();
  }, [fetchMessages, navigate]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationThread]);

  const markAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/student-messages/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, status: 'read', read_at: new Date().toISOString() } : msg
          )
        );
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!showConfirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/student-messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
          setConversationThread([]);
        }
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const deleteConversation = async () => {
    if (!selectedMessage) return;

    // Some legacy messages may not have student_id; fall back to single message deletion.
    if (!selectedMessage.student_id) {
      deleteMessage(selectedMessage.id);
      return;
    }

    const confirmed = showConfirm(
      `Delete entire conversation for ${selectedMessage.name || 'this student'}? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${API_URL}/api/student-messages/conversation/${encodeURIComponent(selectedMessage.student_id)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setMessages(prev => prev.filter(msg => msg.student_id !== selectedMessage.student_id));
        setSelectedMessage(null);
        setConversationThread([]);
        setReplyMessage('');
        fetchMessages();
      } else {
        throw new Error(data.message || 'Failed to delete conversation');
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      showAlert('Failed to delete conversation. Please try again.');
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/student-messages/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchMessages();
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    
    if (!replyMessage.trim() || !selectedMessage) {
      return;
    }

    setSendingReply(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('message', replyMessage.trim());

      const response = await fetch(`${API_URL}/api/student-messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Add reply to conversation thread
        setConversationThread(prev => [...prev, {
          id: data.data.id,
          message: replyMessage.trim(),
          sender_type: 'admin',
          created_at: data.data.createdAt
        }]);
        setReplyMessage('');
      } else {
        throw new Error(data.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      showAlert('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSelectMessage = async (msg) => {
    setSelectedMessage(msg);
    if (msg.status === 'unread') {
      markAsRead(msg.id);
    }
    // Fetch conversation thread
    fetchConversationThread(msg.id);
  };

  const openImageModal = (imagePath) => {
    setImageUrl(`${API_URL}${imagePath}`);
    setImageModalOpen(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  return (
    <AdminLayout title="Student Support">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-shnoor-soft hover:text-shnoor-indigo transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-shnoor-navy">Student Support</h1>
            <p className="text-shnoor-soft text-sm mt-1">
              Manage student support messages and inquiries
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchMessages}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-shnoor-mist rounded-lg hover:bg-shnoor-lavender transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-shnoor-indigo text-white rounded-lg hover:bg-shnoor-navy transition-colors"
              >
                <CheckCheck size={16} />
                Mark All Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-shnoor-mist p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-shnoor-soft" />
            <span className="text-sm font-medium text-shnoor-navy">Filter:</span>
          </div>
          
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All Messages' },
              { key: 'unread', label: 'Unread' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === key
                    ? 'bg-shnoor-indigo text-white'
                    : 'bg-shnoor-lavender text-shnoor-navy hover:bg-shnoor-indigo/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* College Filter */}
          <div className="flex items-center gap-2">
            <Building size={16} className="text-shnoor-soft" />
            <select
              value={selectedCollege}
              onChange={(e) => {
                setSelectedCollege(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-1.5 text-sm border border-shnoor-mist rounded-lg focus:border-shnoor-indigo outline-none min-w-[200px]"
            >
              <option value="">All Colleges</option>
              {colleges.map(college => (
                <option key={college} value={college}>{college}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages sidebar */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-shnoor-mist overflow-hidden">
          <div className="p-4 border-b border-shnoor-mist bg-shnoor-lavender">
            <h2 className="font-semibold text-shnoor-navy">Messages ({pagination.total})</h2>
          </div>
          
          <div className="divide-y divide-shnoor-mist max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-shnoor-indigo/30 border-t-shnoor-indigo rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-shnoor-soft">Loading messages...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center">
                <Mail size={32} className="text-shnoor-soft mx-auto mb-2" />
                <p className="text-sm text-shnoor-soft">No messages found</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`p-4 cursor-pointer hover:bg-shnoor-lavender/50 transition-colors ${
                    selectedMessage?.id === msg.id ? 'bg-shnoor-lavender' : ''
                  } ${msg.status === 'unread' ? 'bg-shnoor-indigo/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${msg.status === 'unread' ? 'bg-shnoor-indigo/10' : 'bg-shnoor-mist'}`}>
                      {msg.status === 'unread' ? (
                        <Mail size={16} className="text-shnoor-indigo" />
                      ) : (
                        <MailOpen size={16} className="text-shnoor-soft" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm truncate ${msg.status === 'unread' ? 'font-semibold text-shnoor-navy' : 'text-shnoor-navy'}`}>
                          {msg.name}
                        </p>
                        <span className="text-xs text-shnoor-soft flex-shrink-0 ml-2">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      {msg.college && (
                        <p className="text-xs text-shnoor-indigo mb-1 flex items-center gap-1">
                          <Building size={10} />
                          {msg.college}
                        </p>
                      )}
                      <p className="text-sm text-shnoor-soft truncate">{msg.message}</p>
                      {msg.image_path && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-shnoor-indigo">
                          <Image size={12} />
                          Attachment
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-shnoor-mist flex items-center justify-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-shnoor-mist rounded hover:bg-shnoor-lavender disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-shnoor-soft">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 text-sm border border-shnoor-mist rounded hover:bg-shnoor-lavender disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Message detail / Conversation */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-shnoor-mist overflow-hidden flex flex-col" style={{ height: '700px' }}>
          {selectedMessage ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-shnoor-mist bg-shnoor-lavender flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-shnoor-indigo/10 flex items-center justify-center">
                    <User size={20} className="text-shnoor-indigo" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-shnoor-navy">{selectedMessage.name}</h2>
                    {selectedMessage.college && (
                      <p className="text-xs text-shnoor-soft flex items-center gap-1">
                        <Building size={10} />
                        {selectedMessage.college}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={deleteConversation}
                  className="p-2 text-shnoor-soft hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                  title="Delete conversation"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              {/* Conversation Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {loadingThread ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-shnoor-indigo/30 border-t-shnoor-indigo rounded-full animate-spin"></div>
                  </div>
                ) : conversationThread.length === 0 ? (
                  // Show single message if no thread
                  <div className="flex justify-start">
                    <div className="max-w-[80%]">
                      <div className="bg-white border border-shnoor-mist p-4 rounded-xl rounded-tl-none shadow-sm">
                        <p className="text-shnoor-navy whitespace-pre-wrap">{selectedMessage.message}</p>
                        {selectedMessage.image_path && (
                          <img
                            src={`${API_URL}${selectedMessage.image_path}`}
                            alt="Attachment"
                            className="mt-3 max-w-full rounded-lg cursor-pointer hover:opacity-90"
                            onClick={() => openImageModal(selectedMessage.image_path)}
                          />
                        )}
                      </div>
                      <p className="text-xs text-shnoor-soft mt-1 ml-1">
                        {formatTime(selectedMessage.created_at)}
                      </p>
                    </div>
                  </div>
                ) : (
                  conversationThread.map((msg, index) => {
                    const isAdmin = msg.sender_type === 'admin';
                    return (
                      <div key={msg.id || index} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                          {!isAdmin && (
                            <p className="text-xs text-shnoor-navy font-medium mb-1 ml-1">{selectedMessage.name}</p>
                          )}
                          {isAdmin && (
                            <p className="text-xs text-shnoor-indigo font-medium mb-1 mr-1 text-right">Admin</p>
                          )}
                          <div
                            className={`p-4 rounded-xl shadow-sm ${
                              isAdmin
                                ? 'bg-shnoor-indigo text-white rounded-tr-none'
                                : 'bg-white border border-shnoor-mist text-shnoor-navy rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                            {msg.image_path && (
                              <img
                                src={`${API_URL}${msg.image_path}`}
                                alt="Attachment"
                                className="mt-3 max-w-full rounded-lg cursor-pointer hover:opacity-90"
                                onClick={() => openImageModal(msg.image_path)}
                              />
                            )}
                          </div>
                          <p className={`text-xs text-shnoor-soft mt-1 ${isAdmin ? 'text-right mr-1' : 'ml-1'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="border-t border-shnoor-mist p-4 bg-white flex-shrink-0">
                <form onSubmit={sendReply} className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      rows={2}
                      className="w-full p-3 rounded-xl border border-shnoor-mist focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo outline-none text-sm resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendReply(e);
                        }
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className="p-3 rounded-xl bg-shnoor-indigo text-white hover:bg-shnoor-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingReply ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-shnoor-soft">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">Select a message to view conversation</p>
                <p className="text-sm mt-1">Click on a message to view details and reply</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setImageModalOpen(false)}
          >
            <X size={32} />
          </button>
          <img
            src={imageUrl}
            alt="Full size attachment"
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </AdminLayout>
  );
};

export default StudentMessages;