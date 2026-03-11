import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ArrowLeft, Users, Wifi, WifiOff, Camera, Clock, MessageCircle, StopCircle, AlertTriangle } from 'lucide-react';
import AdminChatModal from '../../components/admin/AdminChatModal';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LiveProctoring = () => {
  const navigate = useNavigate();
  const [activeSessions, setActiveSessions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [frameData, setFrameData] = useState(new Map()); // studentId -> frame base64
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [stopReason, setStopReason] = useState('');
  const [isStoppingTest, setIsStoppingTest] = useState(false);
  const socketRef = useRef(null);


  useEffect(() => {
    // Check admin authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    console.log('[Admin] Initializing Socket.IO connection to:', SOCKET_URL);

    // Initialize Socket.io with polling only (WebSocket upgrade causes issues)
    const socket = io(SOCKET_URL, {
      transports: ['polling'], // Use polling only
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 30000,
      forceNew: true,
      upgrade: false, // Disable upgrade
      autoConnect: true
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[Admin] Connected to proctoring server');
      console.log('[Admin] Socket ID:', socket.id);
      console.log('[Admin] Transport:', socket.io.engine.transport.name);
      setIsConnected(true);

      // Join monitoring room
      socket.emit('admin:join-monitoring');
      console.log('[Admin] Sent admin:join-monitoring event');
    });

    socket.on('connect_error', (error) => {
      console.error('[Admin] Connection error:', error);
      console.error('[Admin] Error message:', error.message);
      console.error('[Admin] Error type:', error.type);
      console.error('[Admin] Error description:', error.description);
      setIsConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Admin] Disconnected from proctoring server. Reason:', reason);
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Admin] Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    socket.on('reconnect_error', (error) => {
      console.error('[Admin] Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Admin] Reconnection failed after all attempts');
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

    // Handle force-stop success
    socket.on('admin:force-stop-success', (data) => {
      console.log('[Admin] Force-stop successful:', data);
      alert(`✅ Test successfully terminated for ${data.studentName}\n\nThe student has been notified.`);
      setIsStopModalOpen(false);
      setStopReason('');
      setSelectedStudent(null);
      setIsStoppingTest(false);
    });

    // Handle force-stop failure
    socket.on('admin:force-stop-failed', (data) => {
      console.error('[Admin] Force-stop failed:', data);
      alert(`❌ Failed to stop test: ${data.error}`);
      setIsStoppingTest(false);
    });

    // Handle notification when another admin stops a test
    socket.on('admin:test-forcibly-stopped', (data) => {
      console.log('[Admin] Test stopped by another admin:', data);
      // Could show a toast notification here
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

  const handleOpenChat = (student) => {
    setSelectedStudent(student);
    setIsChatModalOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatModalOpen(false);
    setSelectedStudent(null);
  };

  const handleMessageSent = () => {
    // Optional: Add any additional handling when a message is sent
    console.log('[Admin] Message sent to student');
  };

  const handleOpenStopModal = (student) => {
    setSelectedStudent(student);
    setIsStopModalOpen(true);
    setStopReason('');
  };

  const handleCloseStopModal = () => {
    if (!isStoppingTest) {
      setIsStopModalOpen(false);
      setStopReason('');
      setSelectedStudent(null);
    }
  };

  const handleStopTest = () => {
    if (!stopReason.trim()) {
      alert('Please provide a reason for stopping the test');
      return;
    }

    if (!socketRef.current || !socketRef.current.connected) {
      alert('Not connected to server. Please refresh the page.');
      return;
    }

    setIsStoppingTest(true);

    const adminToken = localStorage.getItem('adminToken');
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');

    console.log('[Admin] Sending force-stop request:', {
      studentId: selectedStudent.studentId,
      testId: selectedStudent.testId,
      reason: stopReason
    });

    socketRef.current.emit('admin:force-stop-test', {
      studentId: selectedStudent.studentId,
      testId: selectedStudent.testId,
      reason: stopReason.trim(),
      adminId: adminData.id || 'admin',
      adminName: adminData.full_name || adminData.email || 'Admin',
      violationSummary: `Test stopped during live proctoring session. Duration: ${formatDuration(selectedStudent.startTime)}`
    });
  };

  return (
    <div className="min-h-screen bg-[#E0E0EF]">
      {/* Header */}
      <header className="bg-shnoor-navy text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-0 sm:h-16 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center text-shnoor-soft hover:text-white transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back
              </button>
              <div className="h-8 w-px bg-white/20"></div>
              <div>
                <h1 className="font-bold text-lg text-white">Live Proctoring</h1>
                <p className="text-xs text-shnoor-light opacity-80">Monitor students in real-time</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${isConnected ? 'bg-shnoor-success' : 'bg-shnoor-danger'
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
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-12 text-center">
            <Camera size={64} className="mx-auto text-shnoor-light mb-4" />
            <h2 className="text-xl font-bold text-shnoor-navy mb-2">No Active Sessions</h2>
            <p className="text-shnoor-indigoMedium">
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
                  className="bg-white rounded-xl shadow-sm border border-shnoor-light overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Video Feed */}
                  <div className="relative bg-shnoor-navyLight aspect-video">
                    {currentFrame ? (
                      <img
                        src={currentFrame}
                        alt={`${session.studentName} proctoring feed`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-shnoor-lavender">
                        <div className="text-center">
                          <Camera size={48} className="mx-auto text-shnoor-light mb-2" />
                          <p className="text-shnoor-soft text-sm">Waiting for video...</p>
                        </div>
                      </div>
                    )}

                    {/* Live Indicator */}
                    <div className="absolute top-3 left-3 flex items-center space-x-1 bg-shnoor-danger text-white px-2 py-1 rounded-full text-xs font-medium">
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
                  <div className="p-5">
                    <h3 className="font-bold text-shnoor-navy text-lg mb-1">
                      {session.studentName}
                    </h3>
                    <p className="text-sm text-shnoor-indigoMedium mb-3">
                      ID: {session.studentId}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-shnoor-light">
                      <div>
                        <p className="text-xs text-shnoor-soft">Test</p>
                        <p className="text-sm font-semibold text-shnoor-navy">
                          {session.testTitle}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-shnoor-success">
                        <Wifi size={16} />
                        <span className="text-xs font-medium">
                          {currentFrame ? 'Streaming' : 'Connected'}
                        </span>
                      </div>
                    </div>

                    {/* Chat Button */}
                    <div className="mt-4 pt-3 border-t border-shnoor-light">
                      <button
                        onClick={() => handleOpenChat(session)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-shnoor-navy text-white rounded-lg hover:bg-opacity-90 transition-colors"
                      >
                        <MessageCircle size={16} />
                        <span className="text-sm font-medium">Send Message</span>
                      </button>
                    </div>

                    {/* Stop Test Button */}
                    <div className="mt-3">
                      <button
                        onClick={() => handleOpenStopModal(session)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <StopCircle size={16} />
                        <span className="text-sm font-medium">Stop Test</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Chat Modal */}
      {selectedStudent && (
        <AdminChatModal
          isOpen={isChatModalOpen}
          onClose={handleCloseChat}
          student={selectedStudent}
          socket={socketRef.current}
          onMessageSent={handleMessageSent}
        />
      )}

      {/* Stop Test Confirmation Modal */}
      {isStopModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-red-600 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <AlertTriangle size={24} />
                <h2 className="text-xl font-bold">Stop Test - Confirmation Required</h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-shnoor-navy font-semibold mb-2">Student Information:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm"><span className="font-medium">Name:</span> {selectedStudent.studentName}</p>
                  <p className="text-sm"><span className="font-medium">ID:</span> {selectedStudent.studentId}</p>
                  <p className="text-sm"><span className="font-medium">Test:</span> {selectedStudent.testTitle}</p>
                </div>
              </div>

              <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-sm text-yellow-800 font-medium">⚠️ Warning:</p>
                <p className="text-sm text-yellow-700 mt-1">
                  This action will immediately terminate the student's exam and submit their current answers. The student will receive a notification that their test was stopped due to policy violations.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-shnoor-navy mb-2">
                  Reason for Termination <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                  placeholder="e.g., Multiple instances of unauthorized devices detected, suspicious behavior observed..."
                  rows={4}
                  disabled={isStoppingTest}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be logged for audit purposes and may be shared with the student.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
              <button
                onClick={handleCloseStopModal}
                disabled={isStoppingTest}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleStopTest}
                disabled={isStoppingTest || !stopReason.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isStoppingTest ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Stopping...</span>
                  </>
                ) : (
                  <>
                    <StopCircle size={16} />
                    <span>Stop Test Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LiveProctoring;