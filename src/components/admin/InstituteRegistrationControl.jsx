import { useState } from 'react';
import { Calendar, Lock, Unlock, Pause, X, Save, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../config/api';

const InstituteRegistrationControl = ({ institute, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    registration_status: institute.registration_status || 'open',
    registration_start_time: institute.registration_start_time 
      ? formatDateTimeForInput(institute.registration_start_time) 
      : '',
    registration_deadline: institute.registration_deadline 
      ? formatDateTimeForInput(institute.registration_deadline) 
      : ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  function formatDateTimeForInput(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    const hours = String(istDate.getHours()).padStart(2, '0');
    const minutes = String(istDate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function convertISTToUTC(dateTimeString) {
    if (!dateTimeString) return null;
    const [datePart, timePart] = dateTimeString.split('T');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = timePart.split(':');
    const istDateString = `${year}-${month}-${day}T${hours}:${minutes}:00+05:30`;
    const date = new Date(istDateString);
    return date.toISOString();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes/${institute.id}/registration-control`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          registration_status: formData.registration_status,
          registration_start_time: convertISTToUTC(formData.registration_start_time),
          registration_deadline: convertISTToUTC(formData.registration_deadline)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onUpdate();
        onClose();
      } else {
        setError(data.message || 'Failed to update registration control');
      }
    } catch (error) {
      console.error('Error updating registration control:', error);
      setError(error.message || 'Failed to update registration control');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Unlock className="w-5 h-5 text-green-600" />;
      case 'closed':
        return <Lock className="w-5 h-5 text-red-600" />;
      case 'paused':
        return <Pause className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'closed':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'paused':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Registration Control</h2>
            <p className="text-blue-100 text-sm">{institute.display_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 text-red-700 p-3 rounded-r-lg flex items-start text-sm">
              <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Status Info */}
          {(() => {
            const now = new Date();
            const startTime = institute.registration_start_time ? new Date(institute.registration_start_time) : null;
            const deadline = institute.registration_deadline ? new Date(institute.registration_deadline) : null;
            const notYetOpen = startTime && now < startTime;
            const deadlinePassed = deadline && now > deadline;
            
            let effectiveStatus = institute.registration_status || 'open';
            let statusText = effectiveStatus;
            let statusColor = getStatusColor(effectiveStatus);
            let statusIcon = getStatusIcon(effectiveStatus);
            
            // Override if not yet open
            if (notYetOpen) {
              effectiveStatus = 'not_yet_open';
              statusText = 'Not Yet Open';
              statusColor = 'bg-gray-50 border-gray-200 text-gray-700';
              statusIcon = <Lock className="w-5 h-5 text-gray-600" />;
            }
            // Override if deadline passed
            else if (deadlinePassed && effectiveStatus === 'open') {
              effectiveStatus = 'closed';
              statusText = 'Closed (Deadline Passed)';
              statusColor = 'bg-red-50 border-red-200 text-red-700';
              statusIcon = <Lock className="w-5 h-5 text-red-600" />;
            }
            
            return (
              <div className={`border-2 rounded-lg p-4 ${statusColor}`}>
                <div className="flex items-center space-x-3">
                  {statusIcon}
                  <div>
                    <p className="font-semibold">Current Status</p>
                    <p className="text-sm capitalize">{statusText}</p>
                  </div>
                </div>
                {institute.registration_start_time && (
                  <p className="text-sm mt-2">
                    Start: {new Date(institute.registration_start_time).toLocaleString('en-IN', { 
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })} IST
                    {notYetOpen && <span className="ml-2 font-semibold">(Not Yet Open)</span>}
                  </p>
                )}
                {institute.registration_deadline && (
                  <p className="text-sm mt-2">
                    Deadline: {new Date(institute.registration_deadline).toLocaleString('en-IN', { 
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })} IST
                    {deadlinePassed && <span className="ml-2 font-semibold">(Passed)</span>}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Registration Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Registration Status <span className="text-red-600">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="status"
                  value="open"
                  checked={formData.registration_status === 'open'}
                  onChange={(e) => setFormData({ ...formData, registration_status: e.target.value })}
                  className="w-4 h-4 text-green-600"
                  disabled={isSaving}
                />
                <div className="ml-3 flex items-center space-x-2">
                  <Unlock className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Open</p>
                    <p className="text-sm text-gray-600">Students can register</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="status"
                  value="paused"
                  checked={formData.registration_status === 'paused'}
                  onChange={(e) => setFormData({ ...formData, registration_status: e.target.value })}
                  className="w-4 h-4 text-yellow-600"
                  disabled={isSaving}
                />
                <div className="ml-3 flex items-center space-x-2">
                  <Pause className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-900">Paused</p>
                    <p className="text-sm text-gray-600">Temporarily disabled</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="status"
                  value="closed"
                  checked={formData.registration_status === 'closed'}
                  onChange={(e) => setFormData({ ...formData, registration_status: e.target.value })}
                  className="w-4 h-4 text-red-600"
                  disabled={isSaving}
                />
                <div className="ml-3 flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Closed</p>
                    <p className="text-sm text-gray-600">Registration permanently closed</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Registration Start Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Registration Start Time (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="datetime-local"
                value={formData.registration_start_time}
                onChange={(e) => setFormData({ ...formData, registration_start_time: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-600 transition-all text-sm"
                disabled={isSaving}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Leave empty for immediate registration. Time is in IST (Asia/Kolkata timezone).
            </p>
          </div>

          {/* Registration Deadline */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Registration Deadline (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="datetime-local"
                value={formData.registration_deadline}
                onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-600 transition-all text-sm"
                disabled={isSaving}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Leave empty for no deadline. Time is in IST (Asia/Kolkata timezone).
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
            <div className="flex items-start">
              <AlertCircle size={16} className="text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Status "Closed" or "Paused" blocks all registrations</li>
                  <li>Start time blocks registrations before the specified time</li>
                  <li>Deadline automatically blocks registrations after the specified time</li>
                  <li>You can manually reopen registration anytime by changing status to "Open"</li>
                </ul>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstituteRegistrationControl;
