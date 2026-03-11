import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, PhoneOff, MessageSquare, Send } from 'lucide-react';
import Peer from 'peerjs';
import { io } from 'socket.io-client';
import { apiFetch } from '../config/api';

// Backend Socket.IO implementation is now complete
// Enable socket-driven signaling/chat for full functionality
const SOCKET_ENABLED = true;

const InterviewRoom = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [peer, setPeer] = useState(null);
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [call, setCall] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [notes, setNotes] = useState('');
  const [adminJoined, setAdminJoined] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isInterviewTimeValid, setIsInterviewTimeValid] = useState(false);
  
  // New state for improved UX
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callState, setCallState] = useState('idle'); // 'idle', 'calling', 'ringing', 'connected', 'ended'
  const [reconnecting, setReconnecting] = useState(false);
  const [participants, setParticipants] = useState(new Map());
  
  const chatEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const socketRef = useRef(null);
  const pollRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const isAdmin = !!localStorage.getItem('adminToken');
  const isStudent = !!localStorage.getItem('studentAuthToken') && !isAdmin;
  const role = isAdmin ? 'admin' : 'student';

  useEffect(() => {
    let isMounted = true; // Prevent duplicate initialization in StrictMode
    
    const initializeInterview = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        await fetchInterviewDetails();
        await initializeSocketAndPeer();
        
        // Fallback: Enable admin call button after 5 seconds even if socket fails
        if (isAdmin && isMounted) {
          const fallbackTimer = setTimeout(() => {
            if (isMounted) {
              console.log('Fallback: Enabling admin call button');
              setAdminJoined(true);
            }
          }, 5000);
          
          return () => {
            clearTimeout(fallbackTimer);
          };
        }
      } catch (err) {
        if (isMounted) {
          console.error('Interview initialization error:', err);
          setError('Failed to initialize interview room. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeInterview();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, []);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Handle reconnection logic
  useEffect(() => {
    const handleReconnection = () => {
      if (reconnecting && socketRef.current && socketRef.current.connected && peerId) {
        console.log('Attempting to reconnect to interview room');
        socketRef.current.emit('interview:reconnect', {
          interviewId,
          peerId,
          role
        });
        setReconnecting(false);
      }
    };

    if (reconnecting) {
      const timeout = setTimeout(handleReconnection, 2000);
      reconnectTimeoutRef.current = timeout;
      return () => clearTimeout(timeout);
    }
  }, [reconnecting, peerId, role, interviewId]);

  const checkInterviewTimeValidity = (scheduledTime, duration) => {
    const now = new Date();
    const interviewStart = new Date(scheduledTime);
    
    // Enable button at scheduled time and keep it enabled indefinitely
    const isValid = now >= interviewStart;
    setIsInterviewTimeValid(isValid);
    
    // Update connection status based on time validity
    if (!isValid) {
      const timeUntilValid = interviewStart.getTime() - now.getTime();
      const minutesUntil = Math.ceil(timeUntilValid / (1000 * 60));
      setConnectionStatus(`Interview starts in ${minutesUntil} minutes`);
      
      // Set up a timer to check again when it becomes valid
      setTimeout(() => {
        checkInterviewTimeValidity(scheduledTime, duration);
      }, Math.min(timeUntilValid, 60000)); // Check every minute or when valid
    } else {
      setConnectionStatus(isStudent ? 'Ready - waiting for interviewer...' : 'Ready');
    }
  };

  const fetchInterviewDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentAuthToken');
      const response = await apiFetch(`api/interviews/${interviewId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setInterview(data.interview);
        
        // Check if current time is within interview schedule (only for students)
        if (data.interview?.scheduled_time && isStudent) {
          checkInterviewTimeValidity(data.interview.scheduled_time, data.interview.duration);
        } else if (isStudent) {
          setIsInterviewTimeValid(true); // If no scheduled time, allow interview
        }
      }
    } catch (error) {
      console.error('Fetch interview error:', error);
    }
  };

  const initializeSocketAndPeer = async () => {
    try {
      setIsConnecting(true);
      
      // Prevent duplicate connections
      if (socketRef.current && socketRef.current.connected) {
        console.log('Socket already connected, skipping initialization');
        setIsConnecting(false);
        return;
      }
      
      // Fallback path: PeerJS only + DB polling for peer_id.
      if (!SOCKET_ENABLED) {
        if (isAdmin) setAdminJoined(true);

        const newPeer = new Peer();

        newPeer.on('open', async (id) => {
          console.log('My peer ID:', id);
          setPeerId(id);
          setConnectionStatus(isStudent ? 'Ready - waiting for interviewer...' : 'Ready');

          // Student registers their peer ID in DB so admin can call them.
          if (isStudent) {
            try {
              await apiFetch(`api/interviews/${interviewId}/join`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('studentAuthToken')}`
                },
                body: JSON.stringify({ peer_id: id })
              });
            } catch (e) {
              console.error('Failed to register peer id:', e);
              setError('Failed to register for interview. Please refresh and try again.');
            }
          }
        });

        // Incoming PeerJS call (admin -> student)
        newPeer.on('call', (incoming) => {
          if (!isStudent) {
            incoming.close();
            return;
          }
          console.log('Receiving call...');
          setConnectionStatus('Incoming call...');
          setCallState('ringing');
          answerCall(incoming);
        });

        newPeer.on('error', (err) => {
          console.error('Peer error:', err);
          setConnectionStatus('Connection error - ' + err.type);
          setError('WebRTC connection failed. Please check your network and try again.');
        });

        setPeer(newPeer);

        // Admin polls interview details to get the latest student peer_id.
        if (isAdmin) {
          pollRef.current = setInterval(async () => {
            try {
              const token = localStorage.getItem('adminToken');
              const response = await apiFetch(`api/interviews/${interviewId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await response.json();
              if (response.ok && data.success && data.interview?.peer_id) {
                setRemotePeerId(String(data.interview.peer_id));
              }
            } catch (e) {
              // ignore polling errors
            }
          }, 1500);
        }

        setIsConnecting(false);
        return;
      }

      // Initialize Socket.IO with proper configuration
      const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      console.log('Connecting to socket URL:', socketUrl);
      
      const socket = io(socketUrl, {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        withCredentials: false,
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: false
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setConnectionStatus('Connected to server');
        setReconnecting(false);
        
        // If admin, mark as joined immediately since they don't need to wait for themselves
        if (isAdmin) {
          setAdminJoined(true);
          console.log('Admin connected - enabling call button');
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionStatus('Connection error');
        setError('Failed to connect to interview server. Please check your internet connection.');
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setConnectionStatus('Disconnected');
        
        // Auto-reconnect if server disconnected us
        if (reason === 'io server disconnect') {
          console.log('Server disconnected, attempting to reconnect...');
          setReconnecting(true);
          socket.connect();
        }
      });
      
      socket.on('reconnect', () => {
        console.log('Socket reconnected successfully');
        setConnectionStatus('Reconnected');
        setReconnecting(true); // Trigger interview room reconnection
      });
      
      socket.on('connection-timeout', (data) => {
        console.warn('Connection timeout:', data);
        setConnectionStatus('Connection timeout - reconnecting...');
        socket.connect();
      });

      // Initialize PeerJS
      const newPeer = new Peer();
      
      newPeer.on('open', (id) => {
        console.log('My peer ID:', id);
        console.log('Role:', role);
        console.log('Interview ID:', interviewId);
        console.log('Socket connected:', socket.connected);
        setPeerId(id);
        setConnectionStatus('Ready');
        
        // Wait for socket to be connected before emitting (with retry limit)
        let retryCount = 0;
        const maxRetries = 10;
        
        const emitPeerInfo = () => {
          if (socket.connected) {
            console.log('Emitting interview:join with peer ID:', id);
            socket.emit('interview:join', {
              interviewId,
              peerId: id,
              role
            });
            
            // Signal peer ID to other participant
            console.log('Emitting interview:signal-peer');
            socket.emit('interview:signal-peer', {
              interviewId,
              peerId: id
            });
          } else if (retryCount < maxRetries) {
            retryCount++;
            console.warn(`Socket not connected, retry ${retryCount}/${maxRetries} in 500ms...`);
            setTimeout(emitPeerInfo, 500);
          } else {
            console.error('Socket connection failed after max retries');
            setConnectionStatus('Connection failed - please refresh');
            setError('Failed to join interview room. Please refresh and try again.');
          }
        };
        
        emitPeerInfo();
      });

      // Enhanced socket event handlers
      setupSocketEventHandlers(socket, newPeer);

      newPeer.on('error', (err) => {
        console.error('Peer error:', err);
        setConnectionStatus('Connection error - ' + err.type);
        setError('WebRTC connection failed: ' + err.message);
      });

      setPeer(newPeer);
      setIsConnecting(false);
    } catch (error) {
      console.error('Initialize error:', error);
      setError('Failed to initialize interview room: ' + error.message);
      setIsConnecting(false);
    }
  };

  const setupSocketEventHandlers = (socket, peer) => {
    // Handle incoming PeerJS calls
    peer.on('call', (incoming) => {
      console.log('Receiving call...');
      setConnectionStatus('Incoming call...');
      setCallState('ringing');
      answerCall(incoming);
    });

    // Listen for existing participants when joining
    socket.on('interview:existing-participants', (data) => {
      console.log('Existing participants:', data.participants);
      data.participants.forEach(participant => {
        setParticipants(prev => new Map(prev.set(participant.socketId, participant)));
        if (participant.role !== role) {
          setRemotePeerId(participant.peerId);
          setConnectionStatus(`${participant.role === 'admin' ? 'Interviewer' : 'Student'} is ready`);
          if (participant.role === 'admin') {
            setAdminJoined(true);
          }
        }
      });
    });

    // Listen for other participant's peer ID
    socket.on('interview:peer-available', (data) => {
      console.log('Peer available event received:', data);
      const peerIdString = typeof data.peerId === 'string' ? data.peerId : String(data.peerId);
      console.log('Setting remote peer ID to:', peerIdString);
      setRemotePeerId(peerIdString);
      setConnectionStatus(`${data.role === 'admin' ? 'Interviewer' : 'Student'} is ready`);
      
      // Track if admin joined
      if (data.role === 'admin') {
        setAdminJoined(true);
        console.log('Admin joined - adminJoined set to true');
      }
    });

    // Listen for peer joining
    socket.on('interview:peer-joined', (data) => {
      console.log('Peer joined:', data);
      const peerIdString = typeof data.peerId === 'string' ? data.peerId : String(data.peerId);
      console.log('Setting remotePeerId to:', peerIdString);
      setRemotePeerId(peerIdString);
      setConnectionStatus(`${data.role === 'admin' ? 'Interviewer' : 'Student'} joined`);
      
      // Track participants
      setParticipants(prev => new Map(prev.set(data.socketId, data)));
      
      // Track if admin joined
      if (data.role === 'admin') {
        setAdminJoined(true);
      }
    });

    // Listen for peer reconnection
    socket.on('interview:peer-reconnected', (data) => {
      console.log('Peer reconnected:', data);
      const peerIdString = typeof data.peerId === 'string' ? data.peerId : String(data.peerId);
      setRemotePeerId(peerIdString);
      setConnectionStatus(`${data.role === 'admin' ? 'Interviewer' : 'Student'} reconnected`);
      
      // Update participants
      setParticipants(prev => new Map(prev.set(data.socketId, data)));
      
      if (data.role === 'admin') {
        setAdminJoined(true);
      }
    });

    // Listen for peer leaving
    socket.on('interview:peer-left', (data) => {
      console.log('Peer left:', data);
      setRemotePeerId('');
      setConnectionStatus(`${data.role === 'admin' ? 'Interviewer' : 'Student'} left`);
      
      // Remove from participants
      setParticipants(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.socketId);
        return newMap;
      });
      
      // Track if admin left
      if (data.role === 'admin') {
        setAdminJoined(false);
      }
      
      if (call) {
        call.close();
        setCall(null);
        setCallState('ended');
      }
    });
    
    // Listen for admin starting call (student notification)
    socket.on('interview:call-started', (data) => {
      console.log('Admin started call:', data);
      if (isStudent) {
        // Show "Answer Call" button for student
        setIncomingCall(true);
        setCallState('ringing');
        setConnectionStatus('Interviewer is calling...');
        
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
      }
    });

    // Listen for call initiation confirmation (admin side)
    socket.on('interview:call-initiated', (data) => {
      console.log('Call initiated successfully:', data);
      if (isAdmin) {
        setCallState('calling');
        setConnectionStatus('Calling student...');
      }
    });

    // Listen for call failure (admin side)
    socket.on('interview:call-failed', (data) => {
      console.error('Call failed:', data);
      if (isAdmin) {
        setCallState('idle');
        setConnectionStatus('Call failed - please try again');
        setError('Failed to start call: ' + data.error);
      }
    });

    // Listen for student ready to receive call (admin side)
    socket.on('interview:student-ready', async (data) => {
      console.log('Student ready to receive call:', data);
      if (isAdmin && data.peerId && peer && localStreamRef.current) {
        // Initiate PeerJS call to student
        try {
          setCallState('connecting');
          const outgoingCall = peer.call(data.peerId, localStreamRef.current);
          setCall(outgoingCall);
          setConnectionStatus('Connecting...');

          outgoingCall.on('stream', (remoteStream) => {
            console.log('Received remote stream from student');
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
            setConnectionStatus('Connected');
            setCallState('connected');
          });

          outgoingCall.on('close', () => {
            setConnectionStatus('Call ended');
            setCall(null);
            setCallState('ended');
          });

          outgoingCall.on('error', (error) => {
            console.error('Call error:', error);
            setConnectionStatus('Call failed');
            setCallState('idle');
            setError('Call connection failed: ' + error.message);
          });
        } catch (error) {
          console.error('Error calling student:', error);
          setConnectionStatus('Failed to connect');
          setCallState('idle');
          setError('Failed to establish call: ' + error.message);
        }
      }
    });

    // Listen for chat messages
    socket.on('interview:chat-message', (data) => {
      console.log('Received chat message from server:', data);
      setChatMessages(prev => {
        console.log('Adding message to chat, current count:', prev.length);
        return [...prev, data];
      });
    });

    // Listen for chat history
    socket.on('interview:chat-history', (data) => {
      console.log('Received chat history:', data);
      if (data.success && data.messages) {
        setChatMessages(data.messages.map(msg => ({
          sender: msg.sender_type,
          senderName: msg.sender_name,
          text: msg.message,
          timestamp: msg.created_at
        })));
      }
    });

    // Listen for chat sent confirmation
    socket.on('interview:chat-sent', (data) => {
      console.log('Chat message sent confirmation:', data);
      if (!data.success) {
        setError('Failed to send message: ' + data.error);
      }
    });

    // Request chat history when joining
    socket.emit('interview:get-chat-history', { interviewId });
  };

  const answerCall = async (incoming) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      incoming.answer(stream);
      setCall(incoming);
      setIncomingCall(false); // Hide "Answer Call" button

      incoming.on('stream', (remoteStream) => {
        console.log('Received remote stream');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setConnectionStatus('Connected');
      });

      incoming.on('close', () => {
        setConnectionStatus('Call ended');
        setCall(null);
        setIncomingCall(false);
      });
    } catch (error) {
      console.error('Failed to get media:', error);
      setConnectionStatus('Media access denied');
    }
  };
  
  const answerIncomingCall = async () => {
    try {
      setIncomingCall(false);
      setConnectionStatus('Answering call...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Notify admin that student is ready to receive the call
      if (socketRef.current && peerId) {
        socketRef.current.emit('interview:student-ready', {
          interviewId,
          peerId
        });
      }
      
      setConnectionStatus('Ready - waiting for connection...');
      
      // The PeerJS call will arrive automatically from admin
      // The answerCall function will handle it when it arrives
    } catch (error) {
      console.error('Answer call error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Please allow camera and microphone access to answer the call');
      } else {
        alert('Failed to access camera/microphone');
      }
      setIncomingCall(true);
      setConnectionStatus('Interviewer is calling...');
    }
  };

  const startCall = async () => {
    try {
      console.log('=== STARTING CALL ===');
      console.log('Admin joined:', adminJoined);
      console.log('Socket connected:', socketRef.current?.connected);
      console.log('Interview data:', interview);
      console.log('Remote peer ID:', remotePeerId);
      console.log('Peer object:', peer);
      
      setCallState('calling');
      setConnectionStatus('Starting call...');
      
      // Get media access first
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Enhanced call flow: Admin calls → Student notification → Student answers → Admin sees student → Admin calls again → Connection
      if (isAdmin) {
        // Step 1: Notify student via Socket.io that admin wants to start call
        if (socketRef.current && SOCKET_ENABLED) {
          console.log('Emitting interview:start-call event...');
          console.log('Event data:', {
            interviewId,
            studentId: interview?.student_id
          });
          
          socketRef.current.emit('interview:start-call', {
            interviewId,
            studentId: interview?.student_id
          });
          setConnectionStatus('Notifying student...');
        } else {
          console.log('Socket not available, using fallback...');
          // Fallback: Direct PeerJS call if socket disabled
          if (remotePeerId && peer) {
            console.log('Direct PeerJS call to:', remotePeerId);
            const outgoingCall = peer.call(remotePeerId, stream);
            setCall(outgoingCall);
            setConnectionStatus('Calling...');

            outgoingCall.on('stream', (remoteStream) => {
              console.log('Received remote stream');
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
              setConnectionStatus('Connected');
              setCallState('connected');
            });

            outgoingCall.on('close', () => {
              setConnectionStatus('Call ended');
              setCall(null);
              setCallState('ended');
            });

            outgoingCall.on('error', (error) => {
              console.error('Call error:', error);
              setConnectionStatus('Call failed');
              setCallState('idle');
              setError('Call connection failed: ' + error.message);
            });
          } else {
            setConnectionStatus('Waiting for student to join...');
          }
        }
        
        // Mark interview as started in database
        try {
          console.log('Marking interview as started in database...');
          await apiFetch(`api/interviews/${interviewId}/start`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          });
          console.log('Interview marked as started successfully');
        } catch (e) {
          console.error('Failed to start interview via API:', e);
        }
      }
    } catch (error) {
      console.error('Start call error:', error);
      setCallState('idle');
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setError('Please allow camera and microphone access to start the call');
        setConnectionStatus('Media access denied');
      } else {
        setError('Failed to access camera/microphone: ' + error.message);
        setConnectionStatus('Media access failed');
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !socketRef.current) {
      console.log('Cannot send message:', { 
        hasInput: !!chatInput.trim(), 
        hasSocket: !!socketRef.current,
        socketConnected: socketRef.current?.connected 
      });
      return;
    }

    const message = {
      interviewId,
      sender: isAdmin ? 'admin' : 'student',
      senderName: isAdmin ? 'Interviewer' : interview?.student_name || 'Student',
      text: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    console.log('Sending chat message:', message);

    // Emit to server
    socketRef.current.emit('interview:send-chat', message);

    // Add to local state immediately
    setChatMessages(prev => [...prev, message]);
    setChatInput('');
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing and revert to camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      // Revert local video preview to camera
      if (localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      
      // Replace the video track being sent to the other person with camera track
      if (call && call.peerConnection && localStreamRef.current) {
        const sender = call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        const cameraTrack = localStreamRef.current.getVideoTracks()[0];
        if (sender && cameraTrack) {
          await sender.replaceTrack(cameraTrack);
          console.log('Reverted to camera video');
        }
      }
      
      setIsScreenSharing(false);
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        
        // Update local video preview to show screen
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Replace the video track being sent to the other person with screen track
        if (call && call.peerConnection) {
          const sender = call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            await sender.replaceTrack(screenStream.getVideoTracks()[0]);
            console.log('Started screen sharing');
          }
        }

        // Auto-stop when user stops sharing from browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error('Screen share error:', error);
        alert('Failed to share screen');
      }
    }
  };

  const endInterview = async () => {
    if (isAdmin) {
      const feedback = {
        admin_notes: '', // Notes removed, using chat instead
        technical_score: null,
        communication_score: null,
        recommendation: 'on_hold'
      };

      try {
        await apiFetch(`api/interviews/${interviewId}/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: JSON.stringify(feedback)
        });
      } catch (error) {
        console.error('End interview error:', error);
      }
    }

    cleanup();
    navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
  };

  const leaveRoom = () => {
    cleanup();
    navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (call) {
      call.close();
    }
    if (peer) {
      peer.destroy();
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    // Student leaving: clear their peer_id so admin never calls a stale ID
    if (isStudent) {
      const token = localStorage.getItem('studentAuthToken');
      apiFetch(`api/interviews/${interviewId}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {});
    }
  };

  if (!interview) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-shnoor-navy via-gray-900 to-black flex flex-col overflow-hidden">
      <div className="px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-black/40 border-b border-white/10 flex-shrink-0 gap-3 sm:gap-0">
        <div className="w-full sm:w-auto">
          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/60">
            {isAdmin ? 'Interviewer View' : 'Candidate View'}
          </p>
          <h1 className="text-white text-sm sm:text-lg font-semibold truncate max-w-full sm:max-w-md">
            {interview.test_title || 'Interview'} • {interview.student_name}
          </h1>
          <p className="text-xs sm:text-sm text-white/70">{connectionStatus}</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 self-end sm:self-auto">
          <span className="text-[10px] sm:text-xs text-white/50 hidden sm:inline">
            {remotePeerId ? 'Other participant ready' : 'Waiting...'}
          </span>
          {isAdmin && (
            <button
              onClick={endInterview}
              className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors whitespace-nowrap"
            >
              End<span className="hidden sm:inline"> Interview</span>
            </button>
          )}
          <button
            onClick={leaveRoom}
            className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-lg border border-white/20 text-white/90 hover:bg-white/10 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row items-stretch min-h-0">
        <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-4 max-w-5xl mx-auto min-h-0">
          <div className="w-full max-w-4xl mx-auto rounded-2xl bg-black/40 border border-white/10 overflow-hidden relative aspect-video flex-shrink-0">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover bg-black"
            />
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 text-xs text-white flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>{isAdmin ? interview.student_name : 'Interviewer'}</span>
            </div>

            {!call && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <p className="text-white/80 text-sm font-medium mb-2">
                  {isStudent 
                    ? 'Waiting for interviewer to start the call' 
                    : 'Click "Call Student" to begin'}
                </p>
                <p className="text-white/60 text-xs max-w-md">
                  {remotePeerId ? 'Other participant is ready' : 'Waiting for other participant...'}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-4 max-w-4xl mx-auto w-full flex-shrink-0">
            <div className="w-full lg:w-64 rounded-2xl bg-black/40 border border-white/10 overflow-hidden relative aspect-video max-h-40 flex-shrink-0">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover bg-black"
              />
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-xs text-white">
                {isAdmin ? 'You (Interviewer)' : 'You'} {isScreenSharing && '(Screen sharing)'}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center space-y-3">
              {!call && isAdmin && (
                <button
                  onClick={startCall}
                  disabled={!adminJoined}
                  className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold flex items-center space-x-2 shadow-lg shadow-emerald-500/30"
                >
                  <Video size={20} />
                  <span>
                    {!adminJoined 
                      ? 'Connecting...' 
                      : 'Call Student'}
                  </span>
                </button>
              )}
              
              {!call && isStudent && incomingCall && (
                <button
                  onClick={answerIncomingCall}
                  className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center space-x-2 shadow-lg shadow-emerald-500/30 animate-pulse"
                >
                  <Video size={20} />
                  <span>Answer Call</span>
                </button>
              )}

              {call && (
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full ${
                      isVideoOn
                        ? 'bg-white/10 hover:bg-white/20'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isVideoOn ? (
                      <Video className="text-white" size={22} />
                    ) : (
                      <VideoOff className="text-white" size={22} />
                    )}
                  </button>

                  <button
                    onClick={toggleAudio}
                    className={`p-3 rounded-full ${
                      isAudioOn
                        ? 'bg-white/10 hover:bg-white/20'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isAudioOn ? (
                      <Mic className="text-white" size={22} />
                    ) : (
                      <MicOff className="text-white" size={22} />
                    )}
                  </button>

                  <button
                    onClick={toggleScreenShare}
                    className={`p-3 rounded-full ${
                      isScreenSharing
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {isScreenSharing ? (
                      <MonitorOff className="text-white" size={22} />
                    ) : (
                      <Monitor className="text-white" size={22} />
                    )}
                  </button>

                  <button
                    onClick={isAdmin ? endInterview : leaveRoom}
                    className="p-3 rounded-full bg-red-600 hover:bg-red-700"
                  >
                    <PhoneOff className="text-white" size={22} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {(isAdmin || isStudent) && (
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 bg-black/40 flex flex-col h-1/2 lg:h-full flex-shrink-0 lg:flex-shrink">
            <div className="px-5 py-4 border-b border-white/10 flex items-center space-x-2 flex-shrink-0">
              <MessageSquare className="text-white/70" size={18} />
              <span className="text-sm font-semibold text-white">Chat</span>
            </div>
            
            {/* Chat messages - Fixed height with scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {chatMessages.length === 0 ? (
                <div className="text-center text-white/40 text-sm mt-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      (isAdmin && msg.sender === 'admin') || (isStudent && msg.sender === 'student')
                        ? 'items-end'
                        : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 ${
                        (isAdmin && msg.sender === 'admin') || (isStudent && msg.sender === 'student')
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1 opacity-80">
                        {msg.senderName}
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input - Fixed at bottom */}
            <div className="p-4 border-t border-white/10 flex-shrink-0">
              <div className="flex items-end space-x-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-black/40 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-white/10 text-sm max-h-24"
                  rows="2"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim()}
                  className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white flex items-center justify-center h-[60px] w-[60px] flex-shrink-0"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewRoom;
