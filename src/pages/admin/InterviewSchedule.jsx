import { useState } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../../config/api';

const InterviewSchedule = ({ student, testId, onClose, onScheduled }) => {
  const [formData, setFormData] = useState({
    scheduled_time: '',
    duration: 60
  });
  const [loading, setLoading] = useState(false);

  // Convert IST datetime-local to UTC ISO string (same as test scheduling)
  const convertISTToUTC = (dateTimeString) => {
    if (!dateTimeString) return null;
    // Parse the datetime-local value as IST and convert to UTC
    const [datePart, timePart] = dateTimeString.split('T');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = timePart.split(':');

    // Create date string in IST format (Asia/Kolkata = UTC+05:30)
    const istDateString = `${year}-${month}-${day}T${hours}:${minutes}:00+05:30`;
    const date = new Date(istDateString);

    return date.toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('=== INTERVIEW SCHEDULE SUBMIT ===');
    console.log('Student:', student);
    console.log('Test ID:', testId);
    console.log('Form Data (IST):', formData);

    try {
      // Convert IST to UTC before sending to backend (same as test scheduling)
      const scheduledTimeUTC = convertISTToUTC(formData.scheduled_time);

      console.log('Scheduled Time (IST input):', formData.scheduled_time);
      console.log('Scheduled Time (UTC ISO):', scheduledTimeUTC);

      const requestBody = {
        student_id: student.id,
        test_id: testId,
        scheduled_time: scheduledTimeUTC,
        duration: formData.duration
      };

      console.log('Request Body:', requestBody);

      const response = await apiFetch('api/interviews/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        alert('Interview scheduled successfully!');
        onScheduled();
        onClose();
      } else {
        alert('Failed to schedule interview');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      alert('Error scheduling interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Schedule Interview</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Student: <span className="font-semibold">{student.name}</span></p>
          <p className="text-sm text-gray-600">Email: <span className="font-semibold">{student.email}</span></p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Date & Time (IST)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Select time in Indian Standard Time (IST)</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-center"
            >
              {loading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewSchedule;
