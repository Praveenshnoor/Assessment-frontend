import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Calendar, Clock, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { apiFetch } from '../config/api';

const StudentInterviews = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [incomingBanner, setIncomingBanner] = useState(null); // { id, test_title, institute_name }
  const socketRef = useRef(null);
  const studentIdRef = useRef(null);

  useEffect(() => {
    fetchInterviews();
    initializeSocket();
    
    // Set up periodic refresh to update time-based logic
    const refreshInterval = setInterval(() => {
      setInterviews(prev => [...prev]); // Force re-render to update time-based logic
    }, 30000); // Check every 30 seconds
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearInterval(refreshInterval);
    };
  }, []);

  const initializeSocket = () => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      withCredentials: false
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Student dashboard socket connected');
      
      // Join student-specific room if we have student ID
      if (studentIdRef.current) {
        socket.emit('student:join-dashboard', { studentId: studentIdRef.current });
      }
    });

    // Listen for incoming call notifications
    socket.on('interview:incoming-call', (data) => {
      console.log('Incoming call notification:', data);
      const { interviewId, testTitle, instituteName } = data;
      
      setIncomingBanner({ 
        id: interviewId, 
        test_title: testTitle,
        institute_name: instituteName
      });
      
      // Play notification sound
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 880;
          gain.gain.value = 0.1;
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          setTimeout(() => {
            osc.stop();
            ctx.close();
          }, 1000);
        }
      } catch (e) {
        console.error('Audio error:', e);
      }
      
      // Refresh interviews list
      fetchInterviews();
    });

    socket.on('disconnect', () => {
      console.log('Student dashboard socket disconnected');
    });
  };

  const fetchInterviews = async () => {
    try {
      setError('');
      const token = localStorage.getItem('studentAuthToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await apiFetch('api/interviews/my-interviews', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        setInterviews([]);
        setError(data.message || 'Failed to load interviews. Please try again.');
        return;
      }

      setInterviews(Array.isArray(data.interviews) ? data.interviews : []);

      // Store student ID for socket room joining
      if (data.student_id && !studentIdRef.current) {
        studentIdRef.current = data.student_id;

        // Join student room if socket is already connected
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('student:join-dashboard', {
            studentId: studentIdRef.current
          });
        }
      }
    } catch (error) {
      console.error('Fetch interviews error:', error);
      setInterviews([]);
      setError('Unable to load interviews right now. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const joinInterview = (interviewId) => {
    navigate(`/interview-room/${interviewId}`);
  };

  const formatDateTime = (datetime) => {
    if (!datetime) {
      return { date: 'Date TBD', time: 'Time TBD' };
    }

    // Convert UTC datetime to IST for display
    const date = new Date(datetime);
    
    // Format in IST timezone
    return {
      date: date.toLocaleDateString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
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

  // Student can join when scheduled time arrives OR when admin has started the call
  const canJoinInterview = (interview) => {
    if (!interview) return false;
    
    // If interview is in progress, always allow joining
    if (interview.status === 'in_progress') return true;
    
    // If interview is scheduled, check if the scheduled time has arrived
    if (interview.status === 'scheduled' && interview.scheduled_time) {
      const now = new Date();
      const interviewStart = new Date(interview.scheduled_time);
      return now >= interviewStart;
    }
    
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-shnoor-indigo border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-shnoor-dangerLight border border-shnoor-dangerLight text-shnoor-danger rounded-2xl p-6 text-center">
        <h3 className="text-lg font-bold mb-2">Unable to Load Interviews</h3>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={fetchInterviews}
          className="px-4 py-2 bg-shnoor-danger text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    );
  }

  const upcomingInterviews = interviews.filter((interview) => interview.status === 'scheduled' || interview.status === 'in_progress');
  const pastInterviews = interviews.filter((interview) => interview.status !== 'scheduled' && interview.status !== 'in_progress');

  if (upcomingInterviews.length === 0 && pastInterviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-12 text-center">
        <Calendar className="mx-auto h-16 w-16 text-shnoor-mist mb-4" />
        <h3 className="text-xl font-bold text-shnoor-navy mb-2">No Interviews Scheduled</h3>
        <p className="text-shnoor-indigoMedium">You don't have any upcoming interviews at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {incomingBanner && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 animate-pulse">
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-800">📞 Incoming Interview Call</p>
            <p className="text-xs text-emerald-700/80 mt-1">
              {incomingBanner.test_title || 'Interview'} 
              {incomingBanner.institute_name && ` • ${incomingBanner.institute_name}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                joinInterview(incomingBanner.id);
                setIncomingBanner(null);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2"
            >
              <Video size={16} />
              Answer
            </button>
            <button
              onClick={() => setIncomingBanner(null)}
              className="px-3 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-sm font-semibold hover:bg-emerald-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-shnoor-navy mb-4">Upcoming Interviews</h2>
          <div className="grid gap-4">
            {upcomingInterviews.map((interview) => {
              const { date, time } = formatDateTime(interview.scheduled_time);
              const canJoin = canJoinInterview(interview);

              return (
                <div
                  key={interview.id}
                  className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-6 hover:shadow-[0_8px_30px_rgba(14,14,39,0.12)] transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                        <h3 className="text-lg font-bold text-shnoor-navy">
                          {interview.test_title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(interview.status)}`}>
                          {interview.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {interview.status === 'in_progress' && (
                          <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                            LIVE CALL
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm text-shnoor-indigoMedium">
                        <p className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-shnoor-indigo" />
                          <span className="font-medium">{date}</span>
                        </p>
                        <p className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-shnoor-indigo" />
                          <span className="font-medium">{time}</span>
                          <span className="ml-2 text-shnoor-soft">({interview.duration} minutes)</span>
                        </p>
                        {interview.institute_name && (
                          <p className="text-shnoor-soft">
                            Institute: {interview.institute_name}
                          </p>
                        )}
                      </div>

                      {interview.status === 'in_progress' && (
                        <div className="mt-3 flex items-center text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                          <AlertCircle size={16} className="mr-2" />
                          <span className="font-medium">Your interviewer is calling. You can join now.</span>
                        </div>
                      )}
                      {interview.status === 'scheduled' && (() => {
                        if (!interview.scheduled_time) {
                          return (
                            <div className="mt-3 flex items-center text-sm text-shnoor-soft bg-shnoor-mist/20 px-3 py-2 rounded-lg">
                              <AlertCircle size={16} className="mr-2" />
                              <span className="font-medium">Interview schedule will be shared shortly.</span>
                            </div>
                          );
                        }

                        const now = new Date();
                        const interviewStart = new Date(interview.scheduled_time);
                        const canJoinNow = now >= interviewStart;
                        
                        if (canJoinNow) {
                          return (
                            <div className="mt-3 flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                              <AlertCircle size={16} className="mr-2" />
                              <span className="font-medium">Interview time has arrived. You can join the room now.</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="mt-3 flex items-center text-sm text-shnoor-soft bg-shnoor-mist/20 px-3 py-2 rounded-lg">
                              <AlertCircle size={16} className="mr-2" />
                              <span className="font-medium">Wait here. You can join when the scheduled time arrives.</span>
                            </div>
                          );
                        }
                      })()}
                    </div>

                    <div className="w-full sm:w-auto sm:ml-4 flex-shrink-0">
                      <button
                        onClick={() => canJoin && joinInterview(interview.id)}
                        disabled={!canJoin}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-colors shadow-[0_8px_30px_rgba(14,14,39,0.06)] ${
                          canJoin
                            ? 'bg-shnoor-indigo hover:bg-shnoor-navy text-white hover:shadow-[0_8px_30px_rgba(14,14,39,0.12)]'
                            : 'bg-shnoor-mist/40 text-shnoor-indigoMedium cursor-not-allowed'
                        }`}
                      >
                        <Video size={20} />
                        <span>{
                          interview.status === 'in_progress' 
                            ? 'Answer Live Call' 
                            : canJoin 
                              ? 'Join Interview Room'
                              : 'Waiting for call'
                        }</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Interviews */}
      {pastInterviews.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-shnoor-navy mb-4">Interview History</h2>
          <div className="grid gap-4">
            {pastInterviews.map((interview) => {
              const { date, time } = formatDateTime(interview.scheduled_time);

              return (
                <div
                  key={interview.id}
                  className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-6 opacity-75"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-bold text-shnoor-navy">
                          {interview.test_title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(interview.status)}`}>
                          {(interview.status || 'completed').replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-shnoor-indigoMedium">
                        <p className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-shnoor-indigo" />
                          <span className="font-medium">{date}</span>
                        </p>
                        <p className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-shnoor-indigo" />
                          <span className="font-medium">{time}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentInterviews;