import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, Clock, Users, Trash2, Edit2 } from 'lucide-react';
import { apiFetch } from '../../config/api';

const InterviewsList = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [showAllDates, setShowAllDates] = useState(false);
  const [editing, setEditing] = useState(null); // { id, scheduled_time, duration, student_name }

  const toDatetimeLocalIST = (datetime) => {
    if (!datetime) return '';
    const date = new Date(datetime);
    if (Number.isNaN(date.getTime())) return '';

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(date);

    const get = (type) => parts.find(p => p.type === type)?.value;
    const yyyy = get('year');
    const mm = get('month');
    const dd = get('day');
    const hh = get('hour');
    const min = get('minute');
    if (!yyyy || !mm || !dd || !hh || !min) return '';
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };
// .....................
  useEffect(() => {
    fetchInterviews();
  }, [filter, showAllDates]);

  const fetchInterviews = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (!showAllDates && filter.date) params.append('date', filter.date);
      
      const response = await apiFetch(`api/interviews/list?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setInterviews(data.interviews);
      }
    } catch (error) {
      console.error('Fetch interviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinInterview = (interviewId) => {
    navigate(`/admin/interview-room/${interviewId}`);
  };

  const deleteInterview = async (interviewId, studentName) => {
    if (!confirm(`Are you sure you want to delete the interview with ${studentName}?`)) {
      return;
    }

    try {
      const response = await apiFetch(`api/interviews/${interviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Interview deleted successfully');
        fetchInterviews(); // Refresh the list
      } else {
        alert(data.message || 'Failed to delete interview');
      }
    } catch (error) {
      console.error('Delete interview error:', error);
      alert('Failed to delete interview');
    }
  };

  const openEditModal = (interview) => {
    setEditing({
      id: interview.id,
      student_name: interview.student_name,
      // Always edit in Asia/Kolkata wall-clock time
      scheduled_time: toDatetimeLocalIST(interview.scheduled_time),
      duration: interview.duration
    });
  };

  const handleEditChange = (field, value) => {
    setEditing(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const saveSchedule = async () => {
    if (!editing) return;
    try {
      const response = await apiFetch(`api/interviews/${editing.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          scheduled_time: editing.scheduled_time,
          duration: editing.duration
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Interview rescheduled successfully');
        setEditing(null);
        fetchInterviews();
      } else {
        alert(data.message || 'Failed to reschedule interview');
      }
    } catch (error) {
      console.error('Reschedule interview error:', error);
      alert('Failed to reschedule interview');
    }
  };

  const formatDateTime = (datetime) => {
    // Format date and time in IST timezone (same as test scheduling)
    return new Date(datetime).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Interviews</h1>
        
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 md:items-end">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={filter.date}
              onChange={(e) => setFilter({ ...filter, date: e.target.value })}
              disabled={showAllDates}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          <div className="w-full md:w-auto">
            <button
              onClick={() => setShowAllDates(!showAllDates)}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                showAllDates
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showAllDates ? 'Show Today Only' : 'Show All Dates'}
            </button>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-600">No interviews scheduled for this date</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {interviews.map((interview) => (
            <div
              key={interview.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-start space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-2">
                    <h3 className="text-lg font-semibold text-gray-800 break-words">
                      {interview.student_name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${getStatusColor(interview.status)}`}>
                      {interview.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center">
                      <Users className="w-4 h-4 mr-2 shrink-0" />
                      <span className="truncate">{interview.institute_name || 'No Institute'}</span>
                    </p>
                    <p className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 shrink-0" />
                      {formatDateTime(interview.scheduled_time)} ({interview.duration} min)
                    </p>
                    <p className="text-gray-500 truncate">{interview.student_email}</p>
                  </div>
                </div>

                <div className="flex items-center sm:justify-end space-x-2 w-full sm:w-auto mt-4 sm:mt-0">
                  {(interview.status === 'scheduled' || interview.status === 'in_progress') && (
                    <button
                      onClick={() => joinInterview(interview.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Video size={18} />
                      <span className="whitespace-nowrap">{interview.status === 'in_progress' ? 'Resume Call' : 'Call'}</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => openEditModal(interview)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                    title="Edit schedule"
                  >
                    <Edit2 size={18} />
                  </button>
                  
                  <button
                    onClick={() => deleteInterview(interview.id, interview.student_name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    title="Delete interview"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Reschedule Interview • {editing.student_name}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={editing.scheduled_time || ''}
                  onChange={(e) => handleEditChange('scheduled_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  step="5"
                  value={editing.duration}
                  onChange={(e) => handleEditChange('duration', parseInt(e.target.value, 10) || 60)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveSchedule}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewsList;
