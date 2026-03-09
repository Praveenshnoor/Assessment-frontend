import { useState } from 'react';
import { MessageCircle, AlertTriangle, Info, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const MESSAGE_TYPE_STYLES = {
  warning: {
    bg: 'bg-red-50 border-red-200',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    label: 'Warning',
    labelBg: 'bg-red-100 text-red-700'
  },
  instruction: {
    bg: 'bg-blue-50 border-blue-200',
    icon: Info,
    iconColor: 'text-blue-500',
    label: 'Instruction',
    labelBg: 'bg-blue-100 text-blue-700'
  },
  alert: {
    bg: 'bg-orange-50 border-orange-200',
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
    label: 'Alert',
    labelBg: 'bg-orange-100 text-orange-700'
  },
  info: {
    bg: 'bg-green-50 border-green-200',
    icon: Info,
    iconColor: 'text-green-500',
    label: 'Info',
    labelBg: 'bg-green-100 text-green-700'
  }
};

const PRIORITY_INDICATORS = {
  high: { color: 'text-red-600', bg: 'bg-red-100', label: 'HIGH' },
  medium: { color: 'text-orange-600', bg: 'bg-orange-100', label: 'MED' },
  low: { color: 'text-green-600', bg: 'bg-green-100', label: 'LOW' }
};

const StudentWarningsSidebar = ({ 
  messages = [], 
  isCollapsed = false, 
  onToggleCollapse 
}) => {
  const [expandedMessages, setExpandedMessages] = useState(new Set());

  const toggleMessageExpansion = (messageId) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / 1000 / 60);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return messageTime.toLocaleDateString();
  };

  const getMessagePreview = (message, maxLength = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (isCollapsed) {
    return (
      <div className="bg-white border-l border-gray-200 w-12 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-600 hover:text-shnoor-navy hover:bg-gray-100 rounded-lg transition-colors"
          title="Expand Messages"
        >
          <MessageCircle size={20} />
        </button>
        {messages.length > 0 && (
          <div className="mt-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {messages.length > 99 ? '99+' : messages.length}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border-l border-gray-200 w-80 flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="text-shnoor-navy" size={20} />
            <h3 className="font-semibold text-shnoor-navy">Messages from Proctor</h3>
          </div>
          <div className="flex items-center space-x-2">
            {messages.length > 0 && (
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                {messages.length}
              </span>
            )}
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Collapse Messages"
            >
              <ChevronUp size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="p-6 text-center">
            <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No messages yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Proctor messages will appear here
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {messages.map((message, index) => {
              const messageStyle = MESSAGE_TYPE_STYLES[message.messageType] || MESSAGE_TYPE_STYLES.info;
              const priorityStyle = PRIORITY_INDICATORS[message.priority] || PRIORITY_INDICATORS.medium;
              const MessageIcon = messageStyle.icon;
              const isExpanded = expandedMessages.has(message.id || index);
              const showFullMessage = message.message.length <= 50 || isExpanded;

              return (
                <div
                  key={message.id || index}
                  className={`border rounded-lg p-3 transition-all duration-200 hover:shadow-sm ${messageStyle.bg}`}
                >
                  {/* Message Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <MessageIcon size={16} className={messageStyle.iconColor} />
                      <div className="flex items-center space-x-2 flex-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${messageStyle.labelBg}`}>
                          {messageStyle.label}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${priorityStyle.color} ${priorityStyle.bg}`}>
                          {priorityStyle.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{formatRelativeTime(message.timestamp)}</span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {showFullMessage ? message.message : getMessagePreview(message.message)}
                    
                    {message.message.length > 50 && (
                      <button
                        onClick={() => toggleMessageExpansion(message.id || index)}
                        className="ml-2 text-shnoor-navy hover:underline text-xs font-medium inline-flex items-center"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={12} className="ml-1" />
                            Less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} className="ml-1" />
                            More
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="mt-2 pt-2 border-t border-gray-200 border-opacity-50">
                    <p className="text-xs text-gray-500">
                      Received at {formatTime(message.timestamp)}
                    </p>
                  </div>

                  {/* Unread Indicator */}
                  {!message.read && (
                    <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {messages.length > 0 && (
        <div className="border-t border-gray-200 p-3">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Messages are cleared after exam completion
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentWarningsSidebar;