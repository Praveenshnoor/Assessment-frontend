import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../config/api';

const EditTestDetailsModal = ({ test, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    jobRole: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    duration: 60,
    passingPercentage: 50,
    maxAttempts: 1
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (test) {
      setFormData({
        jobRole: test.jobRole || '',
        description: test.description || '',
        startDateTime: test.startDateTime ? formatDateTimeForInput(test.startDateTime) : '',
        endDateTime: test.endDateTime ? formatDateTimeForInput(test.endDateTime) : '',
        duration: test.duration || 60,
        passingPercentage: test.passingPercentage || 50,
        maxAttempts: test.maxAttempts || 1
      });
    }
  }, [test]);

  const formatDateTimeForInput = (dateTimeString) => {
    if (!dateTimeString) return '';
    // Parse the UTC datetime from backend
    const date = new Date(dateTimeString);
    
    // Format for datetime-local input (uses local timezone automatically)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.jobRole.trim()) {
      newErrors.jobRole = 'Job role is required';
    }

    if (formData.duration < 1 || formData.duration > 300) {
      newErrors.duration = 'Duration must be between 1 and 300 minutes';
    }

    if (formData.passingPercentage < 0 || formData.passingPercentage > 100) {
      newErrors.passingPercentage = 'Passing percentage must be between 0 and 100';
    }

    if (formData.maxAttempts < 1 || formData.maxAttempts > 10) {
      newErrors.maxAttempts = 'Max attempts must be between 1 and 10';
    }

    if (formData.startDateTime && formData.endDateTime) {
      const start = new Date(formData.startDateTime);
      const end = new Date(formData.endDateTime);
      if (end <= start) {
        newErrors.endDateTime = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setSaveError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      const token = localStorage.getItem('adminToken');
      
      // Convert local datetime to UTC ISO string for backend
      const startDateTimeUTC = formData.startDateTime ? new Date(formData.startDateTime).toISOString() : null;
      const endDateTimeUTC = formData.endDateTime ? new Date(formData.endDateTime).toISOString() : null;
      
      const response = await apiFetch(`api/tests/${test.id}/details`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_role: formData.jobRole.trim(),
          description: formData.description.trim(),
          start_datetime: startDateTimeUTC,
          end_datetime: endDateTimeUTC,
          duration: parseInt(formData.duration),
          passing_percentage: parseInt(formData.passingPercentage),
          max_attempts: parseInt(formData.maxAttempts)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSave();
        onClose();
      } else {
        setSaveError(data.message || 'Failed to update test details');
      }
    } catch (error) {
      console.error('Error updating test details:', error);
      setSaveError(error.message || 'Failed to update test details');
    } finally {
      setIsSaving(false);
    }
  };

  if (!test) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3B82F6] to-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Edit Test Details</h2>
            <p className="text-blue-100 text-sm">{test.name}</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Error Message */}
          {saveError && (
            <div className="bg-red-50 border-l-4 border-red-600 text-red-700 p-3 rounded-r-lg flex items-start text-sm">
              <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Job Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Job Role <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.jobRole}
              onChange={(e) => handleChange('jobRole', e.target.value)}
              className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-[#3B82F6] transition-all text-sm ${
                errors.jobRole ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="e.g., Software Developer"
              disabled={isSaving}
            />
            {errors.jobRole && (
              <p className="text-red-600 text-xs mt-1.5 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {errors.jobRole}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Job Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-[#3B82F6] transition-all resize-none text-sm"
              placeholder="Describe the job role..."
              disabled={isSaving}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) => handleChange('startDateTime', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-[#3B82F6] transition-all text-sm"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.endDateTime}
                onChange={(e) => handleChange('endDateTime', e.target.value)}
                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-[#3B82F6] transition-all text-sm ${
                  errors.endDateTime ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isSaving}
              />
              {errors.endDateTime && (
                <p className="text-red-600 text-xs mt-1.5 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.endDateTime}
                </p>
              )}
            </div>
          </div>

          {/* Test Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Duration (min) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-[#3B82F6] transition-all text-sm ${
                  errors.duration ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isSaving}
              />
              {errors.duration && (
                <p className="text-red-600 text-xs mt-1">{errors.duration}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Passing % <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.passingPercentage}
                onChange={(e) => handleChange('passingPercentage', e.target.value)}
                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-[#3B82F6] transition-all text-sm ${
                  errors.passingPercentage ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isSaving}
              />
              {errors.passingPercentage && (
                <p className="text-red-600 text-xs mt-1">{errors.passingPercentage}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Max Attempts <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.maxAttempts}
                onChange={(e) => handleChange('maxAttempts', e.target.value)}
                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-[#3B82F6] transition-all text-sm ${
                  errors.maxAttempts ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isSaving}
              />
              {errors.maxAttempts && (
                <p className="text-red-600 text-xs mt-1">{errors.maxAttempts}</p>
              )}
            </div>
          </div>

          {/* Info Box */}
          {test.status === 'published' && (
            <div className="bg-blue-50 border-l-4 border-[#3B82F6] p-3 rounded-r-lg">
              <div className="flex items-start">
                <AlertCircle size={16} className="text-[#3B82F6] mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900">
                  <span className="font-semibold">Note:</span> Changes will be reflected immediately. Questions cannot be modified for published tests.
                </p>
              </div>
            </div>
          )}
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
            className="px-5 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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

export default EditTestDetailsModal;
