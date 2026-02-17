import { Users, UserX, Smartphone, Eye } from 'lucide-react';

const AIViolationAlert = ({ violation, onDismiss }) => {
  const getIcon = () => {
    switch (violation.type) {
      case 'multiple_faces':
        return <Users className="w-6 h-6" />;
      case 'no_face':
        return <UserX className="w-6 h-6" />;
      case 'phone_detected':
      case 'looking_down':
        return <Smartphone className="w-6 h-6" />;
      default:
        return <Eye className="w-6 h-6" />;
    }
  };

  const getSeverityColor = () => {
    switch (violation.severity) {
      case 'high':
        return 'bg-red-600 border-red-700';
      case 'medium':
        return 'bg-orange-600 border-orange-700';
      case 'low':
        return 'bg-yellow-600 border-yellow-700';
      default:
        return 'bg-red-600 border-red-700';
    }
  };

  const getMessage = () => {
    switch (violation.type) {
      case 'multiple_faces':
        return 'Multiple faces detected';
      case 'no_face':
        return 'No face detected';
      case 'phone_detected':
        return 'Mobile detected';
      case 'looking_down':
        return 'Looking down detected';
      default:
        return 'Suspicious activity detected';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${getSeverityColor()} text-white px-6 py-4 rounded-lg shadow-2xl border-2 animate-pulse`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg">{getMessage()}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-white hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default AIViolationAlert;
