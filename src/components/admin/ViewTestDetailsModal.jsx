import { X, Calendar, Clock, FileText, Target, Users, Award, Edit3 } from 'lucide-react';
import Button from '../Button';

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
        <div className="bg-shnoor-indigo text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Test Details</h2>
            <p className="text-shnoor-indigoMedium text-sm">View test configuration</p>
          </div>
          <Button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Test Title */}
          <div className="bg-shnoor-lavender border-l-4 border-shnoor-indigo p-4 rounded-r-lg">
            <h3 className="text-lg font-bold text-shnoor-navy mb-2">{test.name}</h3>
            <div className="flex items-center space-x-4 text-sm text-shnoor-indigoMedium">
              <span className="flex items-center">
                <FileText size={16} className="mr-1.5" />
                {test.questions} Questions
              </span>
              <span className="flex items-center">
                <Clock size={16} className="mr-1.5" />
                {test.duration} minutes
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${test.status === 'published'
                  ? 'bg-shnoor-successLight text-shnoor-success border border-shnoor-successLight'
                  : 'bg-shnoor-lavender text-shnoor-navy border border-shnoor-mist'
                }`}>
                {test.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>

          {/* Job Role & Description */}
          <div className="space-y-4">
            <div className="border border-shnoor-light rounded-lg p-4 bg-white">
              <div className="flex items-center mb-2">
                <Target size={16} className="text-shnoor-indigo mr-2" />
                <h4 className="font-semibold text-shnoor-navy text-sm">Job Role</h4>
              </div>
              <p className="text-shnoor-indigoMedium  text-sm ml-6">
                {test.jobRole || <span className="text-shnoor-navy italic">Not specified</span>}
              </p>
            </div>

            <div className="border border-shnoor-light rounded-lg p-4 bg-white">
              <div className="flex items-center mb-2">
                <FileText size={16} className="text-shnoor-indigo mr-2" />
                <h4 className="font-semibold text-shnoor-navy text-sm">Description</h4>
              </div>
              <p className="text-shnoor-indigoMedium text-sm ml-6 whitespace-pre-wrap">
                {test.description || <span className="text-shnoor-navy italic">No description provided</span>}
              </p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-shnoor-light rounded-lg p-3 bg-white">
              <div className="flex items-center mb-2">
                <Calendar size={16} className="text-shnoor-success mr-2" />
                <h4 className="font-semibold text-shnoor-navy text-xs">Start Date & Time</h4>
              </div>
              <p className="text-shnoor-indigoMedium text-sm ml-6">
                {formatDateTime(test.startDateTime)}
              </p>
            </div>

            <div className="border border-shnoor-light rounded-lg p-3 bg-white">
              <div className="flex items-center mb-2">
                <Calendar size={16} className="text-shnoor-warning mr-2" />
                <h4 className="font-semibold text-shnoor-navy text-xs">End Date & Time</h4>
              </div>
              <p className="text-shnoor-indigoMedium text-sm ml-6">
                {formatDateTime(test.endDateTime)}
              </p>
            </div>
          </div>

          {/* Test Settings */}
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-shnoor-light rounded-lg p-3 text-center bg-white">
              <Clock size={20} className="text-shnoor-indigo mx-auto mb-1" />
              <h4 className="font-semibold text-shnoor-navy text-xs mb-1">Duration</h4>
              <p className="text-xl font-bold text-shnoor-indigo">{test.duration}</p>
              <p className="text-xs text-shnoor-soft">minutes</p>
            </div>

            <div className="border border-shnoor-light rounded-lg p-3 text-center bg-white">
              <Award size={20} className="text-shnoor-success mx-auto mb-1" />
              <h4 className="font-semibold text-shnoor-navy text-xs mb-1">Passing %</h4>
              <p className="text-xl font-bold text-shnoor-success">{test.passingPercentage || 50}%</p>
              <p className="text-xs text-shnoor-soft">minimum</p>
            </div>

            <div className="border border-shnoor-light rounded-lg p-3 text-center bg-white">
              <Users size={20} className="text-shnoor-indigo mx-auto mb-1" />
              <h4 className="font-semibold text-shnoor-navy text-xs mb-1">Max Attempts</h4>
              <p className="text-xl font-bold text-shnoor-indigo">{test.maxAttempts || 1}</p>
              <p className="text-xs text-shnoor-soft">per student</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-shnoor-light px-6 py-4 flex justify-between items-center">
          <p className="text-xs text-shnoor-soft">
            Created: {test.date}
          </p>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
              className="text-sm px-5 py-2 !font-bold"
            >
              Close
            </Button>
            <Button

            variant="primary"
            onClick={() => {
                onClose();
                onEdit(test);
              }}
              className="text-sm px-5 py-2 !font-bold bg-shnoor-indigo hover:bg-shnoor-navy"
            >
              <Edit3 size={16} className="mr-2" />
              <span>Edit Details</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTestDetailsModal;
