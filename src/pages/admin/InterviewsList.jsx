import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, Clock, Users } from 'lucide-react';
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

  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
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
        
        <div className="flex space-x-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={filter.date}
              onChange={(e) => setFilter({ ...filter, date: e.target.value })}
              disabled={showAllDates}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          <div>
            <button
              onClick={() => setShowAllDates(!showAllDates)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showAllDates
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showAllDates ? 'Show Today Only' : 'Show All Dates'}
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {interview.student_name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                      {interview.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {interview.institute_name || 'No Institute'}
                    </p>
                    <p className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatTime(interview.scheduled_time)} ({interview.duration} min)
                    </p>
                    <p className="text-gray-500">{interview.student_email}</p>
                  </div>
                </div>

                {(interview.status === 'scheduled' || interview.status === 'in_progress') && (
                  <button
                    onClick={() => joinInterview(interview.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Video size={18} />
                    <span>{interview.status === 'in_progress' ? 'Resume Call' : 'Call'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewsList;
