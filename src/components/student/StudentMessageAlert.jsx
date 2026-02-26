import { useEffect, useRef } from 'react';
import { X, AlertTriangle, Info, Clock } from 'lucide-react';

const MESSAGE_TYPE_STYLES = {
  warning: {
    bg: 'bg-gradient-to-r from-red-500 to-red-600',
    border: 'border-red-300',
    icon: AlertTriangle,
    textColor: 'text-white'
  },
  instruction: {
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    border: 'border-blue-300',
    icon: Info,
    textColor: 'text-white'
  },
  alert: {
    bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
    border: 'border-orange-300',
    icon: AlertTriangle,
    textColor: 'text-white'
  },
  info: {
    bg: 'bg-gradient-to-r from-green-500 to-green-600',
    border: 'border-green-300',
    icon: Info,
    textColor: 'text-white'
  }
};

const PRIORITY_STYLES = {
  high: {
    animation: 'animate-bounce',
    shadow: 'shadow-2xl shadow-red-500/25',
    ring: 'ring-4 ring-red-200'
  },
  medium: {
    animation: 'animate-pulse',
    shadow: 'shadow-xl shadow-orange-500/20',
    ring: 'ring-2 ring-orange-200'
  },
  low: {
    animation: '',
    shadow: 'shadow-lg shadow-green-500/15',
    ring: 'ring-1 ring-green-200'
  }
};

const StudentMessageAlert = ({ 
  message, 
  isVisible, 
  onDismiss, 
  autoHideDelay = 10000 
}) => {
  // Derive isAnimating directly from isVisible
  const isAnimating = isVisible;
  const progressRef = useRef(null);
  
  // Use the message id as key to reset the timer when a new message arrives
  const messageId = message?.id;

  useEffect(() => {
    if (!isVisible) return;
    
    // Auto-hide timer
    const hideTimer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, autoHideDelay);

    // Trigger progress bar animation
    if (progressRef.current) {
      progressRef.current.style.transition = 'none';
      progressRef.current.style.width = '100%';
      // Force reflow
      progressRef.current.offsetHeight;
      progressRef.current.style.transition = `width ${autoHideDelay}ms linear`;
      progressRef.current.style.width = '0%';
    }

    return () => {
      clearTimeout(hideTimer);
    };
  }, [isVisible, messageId, autoHideDelay, onDismiss]);

  if (!message || !isVisible) return null;

  const messageStyle = MESSAGE_TYPE_STYLES[message.messageType] || MESSAGE_TYPE_STYLES.info;
  const priorityStyle = PRIORITY_STYLES[message.priority] || PRIORITY_STYLES.medium;
  const MessageIcon = messageStyle.icon;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-30 z-50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onDismiss}
      />
      
      {/* Alert Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}>
        <div
          className={`
            max-w-lg w-full bg-white rounded-2xl shadow-2xl border-2 
            transform transition-all duration-500 pointer-events-auto
            ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
            ${messageStyle.border}
            ${priorityStyle.shadow}
            ${priorityStyle.ring}
            ${message.priority === 'high' ? priorityStyle.animation : ''}
          `}
        >
          {/* Header */}
          <div className={`${messageStyle.bg} ${messageStyle.textColor} p-4 rounded-t-xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 bg-white bg-opacity-20 rounded-lg ${
                  message.priority === 'medium' ? priorityStyle.animation : ''
                }`}>
                  <MessageIcon size={24} className={messageStyle.textColor} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    Message from Proctor
                  </h3>
                  <p className="text-sm opacity-90">
                    {message.messageType.charAt(0).toUpperCase() + message.messageType.slice(1)} • {' '}
                    {message.priority.charAt(0).toUpperCase() + message.priority.slice(1)} Priority
                  </p>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="text-white hover:text-opacity-80 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-10"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Message Content */}
          <div className="p-6">
            <div className="text-gray-800 text-lg leading-relaxed mb-4">
              {message.message}
            </div>
            
            {/* Timestamp */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>
                Received at {new Date(message.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Auto-dismiss in {Math.round(autoHideDelay / 1000)}s</span>
              </div>
              <button
                onClick={onDismiss}
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Acknowledge
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
              <div 
                ref={progressRef}
                className={`${messageStyle.bg} h-1 rounded-full`}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sound Effect for High Priority Messages */}
      {message.priority === 'high' && isVisible && (
        <audio autoPlay>
          <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbBSGOzfPTgjMGJIXB9diRRwsXYrPl7oVSFgxTreP1x2EcBTGG2u7dfjAHLIXI8N2GRAwa" type="audio/wav" />
        </audio>
      )}
    </>
  );
};

export default StudentMessageAlert;