import { useState, useEffect, useRef } from 'react';
import { X, Send, AlertTriangle, Info, MessageCircle, Clock } from 'lucide-react';

const MESSAGE_TYPES = {
  warning: { label: 'Warning', color: 'bg-red-500', icon: AlertTriangle },
  instruction: { label: 'Instruction', color: 'bg-blue-500', icon: Info },
  alert: { label: 'Alert', color: 'bg-orange-500', icon: AlertTriangle },
  info: { label: 'Info', color: 'bg-green-500', icon: Info }
};

const PRIORITY_LEVELS = {
  high: { label: 'High', color: 'text-red-600 bg-red-50 border-red-200' },
  medium: { label: 'Medium', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  low: { label: 'Low', color: 'text-green-600 bg-green-50 border-green-200' }
};

const AdminChatModal = ({ 
  isOpen, 
  onClose, 
  student, 
  socket,
  onMessageSent 
}) => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('warning');
  const [priority, setPriority] = useState('medium');
  const [messageHistory, setMessageHistory] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const messagesEndRef = useRef(null);

  // Clear delivery status after 3 seconds
  useEffect(() => {
    if (deliveryStatus) {
      const timer = setTimeout(() => setDeliveryStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [deliveryStatus]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleMessageDelivered = (data) => {
      console.log('[AdminChat] Message delivered event:', data);
      // Use loose equality to handle string/number mismatch
      if (String(data.studentId) === String(student.studentId)) {
        setDeliveryStatus({ type: 'success', message: 'Message delivered successfully!' });
        setMessageHistory(prev => [...prev, {
          ...data,
          id: Date.now(),
          sent: true,
          deliveredAt: new Date()
        }]);
        setMessage('');
        setIsSending(false);
        if (onMessageSent) onMessageSent();
      }
    };

    const handleMessageFailed = (data) => {
      console.log('[AdminChat] Message failed event:', data);
      // Use loose equality to handle string/number mismatch
      if (String(data.studentId) === String(student.studentId)) {
        setDeliveryStatus({ type: 'error', message: `Failed to send: ${data.error}` });
        setIsSending(false);
      }
    };

    const handleMessageRead = (data) => {
      if (String(data.studentId) === String(student.studentId)) {
        setMessageHistory(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, read: true, readAt: data.readAt }
            : msg
        ));
      }
    };

    socket.on('admin:message-delivered', handleMessageDelivered);
    socket.on('admin:message-failed', handleMessageFailed);
    socket.on('student:message-read', handleMessageRead);

    // Request message history when modal opens
    if (student) {
      socket.emit('admin:get-message-history', {
        studentId: student.studentId,
        testId: student.testId
      });
    }

    return () => {
      socket.off('admin:message-delivered', handleMessageDelivered);
      socket.off('admin:message-failed', handleMessageFailed);
      socket.off('student:message-read', handleMessageRead);
    };
  }, [socket, isOpen, student, onMessageSent]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageHistory]);

  const handleSendMessage = () => {
    if (!message.trim() || !socket || isSending) return;

    console.log('[AdminChat] Sending message to student:', student.studentId);
    console.log('[AdminChat] Socket connected:', socket.connected);

    // Check if socket is connected
    if (!socket.connected) {
      setDeliveryStatus({ type: 'error', message: 'Socket not connected. Please refresh the page.' });
      return;
    }

    setIsSending(true);
    setDeliveryStatus(null);

    const messagePayload = {
      studentId: String(student.studentId),
      message: message.trim(),
      messageType,
      priority,
      adminId: 'admin',
      testId: student.testId
    };

    console.log('[AdminChat] Emitting admin:send-message with payload:', messagePayload);
    socket.emit('admin:send-message', messagePayload);

    // Timeout handler - reset sending state if no response after 10 seconds
    setTimeout(() => {
      setIsSending(currentSending => {
        if (currentSending) {
          setDeliveryStatus({ type: 'error', message: 'Message timeout - student may not be active' });
          return false;
        }
        return currentSending;
      });
    }, 10000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (!isOpen) return null;

  const MessageTypeIcon = MESSAGE_TYPES[messageType]?.icon || Info;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageCircle className="text-shnoor-navy" size={24} />
            <div>
              <h3 className="text-lg font-bold text-shnoor-navy">
                Message Student
              </h3>
              <p className="text-sm text-shnoor-indigoMedium">
                {student.studentName} (ID: {student.studentId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 max-h-64">
          {messageHistory.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No messages sent yet</p>
            </div>
          ) : (
            messageHistory.map((msg, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${MESSAGE_TYPES[msg.messageType]?.color} text-white`}>
                      {MESSAGE_TYPES[msg.messageType]?.label}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${PRIORITY_LEVELS[msg.priority]?.color}`}>
                      {PRIORITY_LEVELS[msg.priority]?.label}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{formatTime(msg.timestamp || msg.deliveredAt)}</span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{msg.message}</p>
                {msg.read && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Read at {formatTime(msg.readAt)}
                  </p>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Delivery Status */}
        {deliveryStatus && (
          <div className={`mx-4 mb-2 p-3 rounded-lg text-sm ${
            deliveryStatus.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {deliveryStatus.message}
          </div>
        )}

        {/* Message Input Section */}
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Message Type & Priority */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Message Type
              </label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-shnoor-navy focus:border-transparent"
              >
                {Object.entries(MESSAGE_TYPES).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-shnoor-navy focus:border-transparent"
              >
                {Object.entries(PRIORITY_LEVELS).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message Input */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-3">
                <MessageTypeIcon size={20} className={`text-gray-600`} />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message to the student..."
                  className="flex-1 bg-transparent border-none resize-none focus:outline-none text-sm"
                  rows="2"
                  disabled={isSending}
                />
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending}
              className="px-4 py-2 bg-shnoor-navy text-white rounded-lg hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>

          {/* Quick Message Templates */}
          <div className="flex flex-wrap gap-2">
            {[
              'Please look directly at the camera',
              'Maintain focus on your screen', 
              'No external materials allowed',
              'Keep your face visible at all times'
            ].map((template) => (
              <button
                key={template}
                onClick={() => setMessage(template)}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors"
                disabled={isSending}
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatModal;