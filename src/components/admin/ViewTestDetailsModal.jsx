import { X, Calendar, Clock, FileText, Target, Users, Award, Edit3 } from 'lucide-react';

const ViewTestDetailsModal = ({ test, onClose, onEdit }) => {
  if (!test) return null;

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not set';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3B82F6] to-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Test Details</h2>
            <p className="text-blue-100 text-sm">View test configuration</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Test Title */}
          <div className="bg-blue-50 border-l-4 border-[#3B82F6] p-4 rounded-r-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{test.name}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <FileText size={16} className="mr-1.5" />
                {test.questions} Questions
              </span>
              <span className="flex items-center">
                <Clock size={16} className="mr-1.5" />
                {test.duration} minutes
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                test.status === 'published' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {test.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>

          {/* Job Role & Description */}
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Target size={16} className="text-[#3B82F6] mr-2" />
                <h4 className="font-semibold text-gray-900 text-sm">Job Role</h4>
              </div>
              <p className="text-gray-700 text-sm ml-6">
                {test.jobRole || <span className="text-gray-400 italic">Not specified</span>}
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FileText size={16} className="text-[#3B82F6] mr-2" />
                <h4 className="font-semibold text-gray-900 text-sm">Description</h4>
              </div>
              <p className="text-gray-700 text-sm ml-6 whitespace-pre-wrap">
                {test.description || <span className="text-gray-400 italic">No description provided</span>}
              </p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <Calendar size={16} className="text-green-600 mr-2" />
                <h4 className="font-semibold text-gray-900 text-xs">Start Date & Time</h4>
              </div>
              <p className="text-gray-700 text-sm ml-6">
                {formatDateTime(test.startDateTime)}
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <Calendar size={16} className="text-red-600 mr-2" />
                <h4 className="font-semibold text-gray-900 text-xs">End Date & Time</h4>
              </div>
              <p className="text-gray-700 text-sm ml-6">
                {formatDateTime(test.endDateTime)}
              </p>
            </div>
          </div>

          {/* Test Settings */}
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-gray-200 rounded-lg p-3 text-center">
              <Clock size={20} className="text-[#3B82F6] mx-auto mb-1" />
              <h4 className="font-semibold text-gray-900 text-xs mb-1">Duration</h4>
              <p className="text-xl font-bold text-[#3B82F6]">{test.duration}</p>
              <p className="text-xs text-gray-500">minutes</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 text-center">
              <Award size={20} className="text-green-600 mx-auto mb-1" />
              <h4 className="font-semibold text-gray-900 text-xs mb-1">Passing %</h4>
              <p className="text-xl font-bold text-green-600">{test.passingPercentage || 50}%</p>
              <p className="text-xs text-gray-500">minimum</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 text-center">
              <Users size={20} className="text-purple-600 mx-auto mb-1" />
              <h4 className="font-semibold text-gray-900 text-xs mb-1">Max Attempts</h4>
              <p className="text-xl font-bold text-purple-600">{test.maxAttempts || 1}</p>
              <p className="text-xs text-gray-500">per student</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Created: {test.date}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(test);
              }}
              className="px-5 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center space-x-2"
            >
              <Edit3 size={16} />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTestDetailsModal;
