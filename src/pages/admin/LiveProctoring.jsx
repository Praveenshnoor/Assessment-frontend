import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ArrowLeft, Users, Wifi, WifiOff, Camera, Clock } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LiveProctoring = () => {
  const navigate = useNavigate();
  const [activeSessions, setActiveSessions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [frameData, setFrameData] = useState(new Map()); // studentId -> frame base64
  const socketRef = useRef(null);

  useEffect(() => {
    // Check admin authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Initialize Socket.io
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('connect', () => {
      console.log('[Admin] Connected to proctoring server');
      setIsConnected(true);
      socket.emit('admin:join-monitoring');
    });

    socket.on('disconnect', () => {
      console.log('[Admin] Disconnected from proctoring server');
      setIsConnected(false);
    });

    // Receive active sessions list
    socket.on('active-sessions', (sessions) => {
      console.log('[Admin] Active sessions:', sessions);
      // Ensure all studentIds are strings for consistent key matching
      const normalizedSessions = sessions.map(s => ({
        ...s,
        studentId: String(s.studentId)
      }));
      setActiveSessions(normalizedSessions);
    });

    // New student joined
    socket.on('student:joined', (studentData) => {
      console.log('[Admin] Student joined:', studentData);
      // Ensure studentId is a string for consistent key matching
      const normalizedData = {
        ...studentData,
        studentId: String(studentData.studentId)
      };
      setActiveSessions(prev => [...prev, normalizedData]);
    });

    // Student left
    socket.on('student:left', (data) => {
      console.log('[Admin] Student left:', data);
      const leftStudentId = String(data.studentId);
      setActiveSessions(prev => prev.filter(s => String(s.studentId) !== leftStudentId));
      
      // Remove frame data
      setFrameData(prev => {
        const newMap = new Map(prev);
        newMap.delete(leftStudentId);
        return newMap;
      });
    });

    // Receive video frames from students
    socket.on('proctoring:frame', (data) => {
      const { studentId, frame } = data;
      
      // Update frame data for this student
      setFrameData(prev => {
        const newMap = new Map(prev);
        // Ensure studentId is a string for consistent key matching
        newMap.set(String(studentId), frame);
        return newMap;
      });
    });

    socketRef.current = socket;

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  const formatDuration = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = Math.floor((now - start) / 1000 / 60); // minutes
    return `${diff} min`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back
              </button>
              <div className="h-8 w-px bg-gray-600"></div>
              <div>
                <h1 className="font-bold text-lg">Live Proctoring</h1>
                <p className="text-xs text-gray-400">Monitor students in real-time</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
                isConnected ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 rounded-lg">
                <Users size={16} />
                <span className="text-sm font-medium">{activeSessions.length} Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Camera size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Sessions</h2>
            <p className="text-gray-600">
              Students taking exams with proctoring enabled will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSessions.map((session) => {
              // Ensure consistent string key for lookup
              const sessionKey = String(session.studentId);
              const currentFrame = frameData.get(sessionKey);
              
              return (
                <div
                  key={sessionKey}
                  className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Video Feed */}
                  <div className="relative bg-gray-900 aspect-video">
                    {currentFrame ? (
                      <img
                        src={currentFrame}
                        alt={`${session.studentName} proctoring feed`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Camera size={48} className="mx-auto text-gray-600 mb-2" />
                          <p className="text-gray-400 text-sm">Waiting for video...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Live Indicator */}
                    <div className="absolute top-3 left-3 flex items-center space-x-1 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>

                    {/* Duration */}
                    <div className="absolute top-3 right-3 flex items-center space-x-1 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium">
                      <Clock size={12} />
                      <span>{formatDuration(session.startTime)}</span>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {session.studentName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      ID: {session.studentId}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">Test</p>
                        <p className="text-sm font-medium text-gray-900">
                          {session.testTitle}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600">
                        <Wifi size={16} />
                        <span className="text-xs font-medium">
                          {currentFrame ? 'Streaming' : 'Connected'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default LiveProctoring;
