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
        return <Unlock className="w-5 h-5 text-shnoor-indigo" />;
      case 'closed':
        return <Lock className="w-5 h-5 text-shnoor-indigo" />;
      case 'paused':
        return <Pause className="w-5 h-5 text-shnoor-indigoMedium" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-shnoor-lavender border-shnoor-light text-shnoor-indigo';
      case 'closed':
        return 'bg-shnoor-lavender border-shnoor-light text-shnoor-indigo';
      case 'paused':
        return 'bg-shnoor-lavender border-shnoor-light text-shnoor-indigoMedium';
      default:
        return 'bg-shnoor-lavender border-shnoor-light text-shnoor-indigoMedium';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-shnoor-indigo to-shnoor-navy text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Registration Control</h2>
            <p className="text-shnoor-lavender text-sm">{institute.display_name}</p>
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
            <div className="bg-shnoor-lavender border-l-4 border-shnoor-indigo text-shnoor-navy p-3 rounded-r-lg flex items-start text-sm">
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
              statusColor = 'bg-shnoor-lavender border-shnoor-light text-shnoor-indigoMedium';
              statusIcon = <Lock className="w-5 h-5 text-shnoor-indigoMedium" />;
            }
            // Override if deadline passed
            else if (deadlinePassed && effectiveStatus === 'open') {
              effectiveStatus = 'closed';
              statusText = 'Closed (Deadline Passed)';
              statusColor = 'bg-shnoor-lavender border-shnoor-light text-shnoor-indigo';
              statusIcon = <Lock className="w-5 h-5 text-shnoor-indigo" />;
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
            <label className="block text-sm font-semibold text-shnoor-navy mb-3">
              Registration Status <span className="text-shnoor-indigo">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-shnoor-light rounded-lg cursor-pointer hover:bg-shnoor-lavender transition-colors">
                <input
                  type="radio"
                  name="status"
                  value="open"
                  checked={formData.registration_status === 'open'}
                  onChange={(e) => setFormData({ ...formData, registration_status: e.target.value })}
                  className="w-4 h-4 text-shnoor-indigo"
                  disabled={isSaving}
                />
                <div className="ml-3 flex items-center space-x-2">
                  <Unlock className="w-5 h-5 text-shnoor-indigo" />
                  <div>
                    <p className="font-medium text-shnoor-navy">Open</p>
                    <p className="text-sm text-shnoor-indigoMedium">Students can register</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-shnoor-light rounded-lg cursor-pointer hover:bg-shnoor-lavender transition-colors">
                <input
                  type="radio"
                  name="status"
                  value="paused"
                  checked={formData.registration_status === 'paused'}
                  onChange={(e) => setFormData({ ...formData, registration_status: e.target.value })}
                  className="w-4 h-4 text-shnoor-indigoMedium"
                  disabled={isSaving}
                />
                <div className="ml-3 flex items-center space-x-2">
                  <Pause className="w-5 h-5 text-shnoor-indigoMedium" />
                  <div>
                    <p className="font-medium text-shnoor-navy">Paused</p>
                    <p className="text-sm text-shnoor-indigoMedium">Temporarily disabled</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-shnoor-light rounded-lg cursor-pointer hover:bg-shnoor-lavender transition-colors">
                <input
                  type="radio"
                  name="status"
                  value="closed"
                  checked={formData.registration_status === 'closed'}
                  onChange={(e) => setFormData({ ...formData, registration_status: e.target.value })}
                  className="w-4 h-4 text-shnoor-indigo"
                  disabled={isSaving}
                />
                <div className="ml-3 flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-shnoor-indigo" />
                  <div>
                    <p className="font-medium text-shnoor-navy">Closed</p>
                    <p className="text-sm text-shnoor-indigoMedium">Registration permanently closed</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Registration Start Time */}
          <div>
            <label className="block text-sm font-semibold text-shnoor-navy mb-2">
              Registration Start Time (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-shnoor-soft w-5 h-5" />
              <input
                type="datetime-local"
                value={formData.registration_start_time}
                onChange={(e) => setFormData({ ...formData, registration_start_time: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border-2 border-shnoor-light rounded-lg focus:ring-2 focus:ring-shnoor-lavender focus:border-shnoor-indigo transition-all text-sm"
                disabled={isSaving}
              />
            </div>
            <p className="text-xs text-shnoor-indigoMedium mt-2">
              Leave empty for immediate registration. Time is in IST (Asia/Kolkata timezone).
            </p>
          </div>

          {/* Registration Deadline */}
          <div>
            <label className="block text-sm font-semibold text-shnoor-navy mb-2">
              Registration Deadline (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-shnoor-soft w-5 h-5" />
              <input
                type="datetime-local"
                value={formData.registration_deadline}
                onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border-2 border-shnoor-light rounded-lg focus:ring-2 focus:ring-shnoor-lavender focus:border-shnoor-indigo transition-all text-sm"
                disabled={isSaving}
              />
            </div>
            <p className="text-xs text-shnoor-indigoMedium mt-2">
              Leave empty for no deadline. Time is in IST (Asia/Kolkata timezone).
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-shnoor-lavender border-l-4 border-shnoor-indigo p-4 rounded-r-lg">
            <div className="flex items-start">
              <AlertCircle size={16} className="text-shnoor-indigo mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-shnoor-navy">
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
        <div className="bg-shnoor-lavender border-t border-shnoor-light px-6 py-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-shnoor-light text-shnoor-navy rounded-lg hover:bg-shnoor-mist transition-colors text-sm font-medium"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 bg-shnoor-indigo text-white rounded-lg hover:bg-shnoor-navy transition-all shadow-lg hover:-translate-y-0.5 text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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
