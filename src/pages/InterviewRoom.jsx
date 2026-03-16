import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, PhoneOff, MessageSquare, Send, Phone } from 'lucide-react';
import Peer from 'peerjs';
import { io } from 'socket.io-client';
import { apiFetch } from '../config/api';

const SOCKET_ENABLED = true;

const InterviewRoom = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [interview, setInterview] = useState(null);
  const [peer, setPeer] = useState(null);
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [call, setCall] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [incomingCall, setIncomingCall] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [callState, setCallState] = useState('idle');
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [studentInRoom, setStudentInRoom] = useState(false);
  const [adminInRoom, setAdminInRoom] = useState(false);
  const [isInterviewTimeValid, setIsInterviewTimeValid] = useState(false);
  const [timeUntilInterview, setTimeUntilInterview] = useState('');

  // Refs
  const chatEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const localVideoPipRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const socketRef = useRef(null);

  const isAdmin = !!localStorage.getItem('adminToken');
  const isStudent = !!localStorage.getItem('studentAuthToken') && !isAdmin;
  const role = isAdmin ? 'admin' : 'student';

  // Enhanced helper function to ensure video plays
  const ensureVideoPlays = async (videoElement, streamType) => {
    if (!videoElement || !videoElement.srcObject) {
      console.log(`${streamType} video: No element or stream`);
      return false;
    }

    try {
      if (!videoElement.paused) {
        videoElement.pause();
      }

      // Mobile-specific video properties
      videoElement.muted = streamType === 'Local' || streamType === 'Local-PIP';
      videoElement.playsInline = true;
      videoElement.autoplay = true;
      videoElement.controls = false;
      
      // Additional properties for remote video
      if (streamType === 'Remote') {
        videoElement.style.objectFit = 'cover';
        // For mobile browsers, ensure video is not muted for remote streams
        videoElement.muted = false;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (videoElement.srcObject) {
        await videoElement.play();
        console.log(`${streamType} video playing successfully`);
        console.log(`${streamType} video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
        return true;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`${streamType} video play aborted (stream changed)`);
        return false;
      }
      console.error(`${streamType} video play error:`, error);
      
      // Mobile fallback - try to play without waiting
      if (streamType === 'Remote' && videoElement.srcObject) {
        try {
          videoElement.play();
        } catch (e) {
          console.error('Mobile fallback play failed:', e);
        }
      }
      return false;
    }
  };
  useEffect(() => {
    let isMounted = true;
    
    const initializeInterview = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        await fetchInterviewDetails();
        await initializeSocketAndPeer();
        
        if (isAdmin && isMounted) {
          const fallbackTimer = setTimeout(() => {
            if (isMounted) {
              console.log('Fallback: Enabling admin call button');
              setAdminInRoom(true);
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

  // Ensure videos play when streams are available
  useEffect(() => {
    if (localStreamRef.current) {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        const timeoutId = setTimeout(() => {
          ensureVideoPlays(localVideoRef.current, 'Local');
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [localStreamRef.current]);

  // Separate effect for PIP video during calls
  useEffect(() => {
    if (call && localStreamRef.current && localVideoPipRef.current) {
      localVideoPipRef.current.srcObject = localStreamRef.current;
      setTimeout(() => {
        ensureVideoPlays(localVideoPipRef.current, 'Local-PIP');
      }, 150);
    }
  }, [call, localStreamRef.current]);

  // Monitor interview time validity for students
  useEffect(() => {
    if (isStudent && interview?.scheduled_time) {
      const interval = setInterval(() => {
        checkInterviewTimeValidity(interview.scheduled_time);
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [interview?.scheduled_time, isStudent]);

  // Update student room status when time becomes valid
  useEffect(() => {
    if (isStudent && isInterviewTimeValid && socketRef.current?.connected && !studentInRoom) {
      // Automatically join the student to the room when time is valid
      joinInterviewRoom();
      console.log('Student automatically joined room - interview time is valid');
    }
  }, [isInterviewTimeValid, isStudent, studentInRoom]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const timeoutId = setTimeout(() => {
        ensureVideoPlays(remoteVideoRef.current, 'Remote');
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    // Apply any stream that arrived before the video element was mounted
    if (remoteVideoRef.current && pendingRemoteStreamRef.current) {
      const el = remoteVideoRef.current;
      const stream = pendingRemoteStreamRef.current;
      el.srcObject = stream;
      el.muted = false;
      el.playsInline = true;
      el.autoplay = true;
      el.play().catch(e => {
        console.error('Pending stream play failed:', e);
        setTimeout(() => el.play().catch(console.error), 500);
      });
      pendingRemoteStreamRef.current = null;
    }
  }, [call, remoteVideoRef.current?.srcObject]);

  // Additional effect to monitor remote video stream
  useEffect(() => {
    if (call && remoteVideoRef.current) {
      const video = remoteVideoRef.current;
      
      // Check if video has a stream but isn't playing
      const checkVideoState = () => {
        if (video.srcObject && video.paused) {
          console.log('Remote video has stream but is paused, attempting to play');
          video.play().catch(e => console.error('Failed to play remote video:', e));
        }
      };
      
      // Check every 2 seconds
      const interval = setInterval(checkVideoState, 2000);
      
      return () => clearInterval(interval);
    }
  }, [call]);

  const fetchInterviewDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentAuthToken');
      const response = await apiFetch(`api/interviews/${interviewId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setInterview(data.interview);
        
        // Check interview time validity for students
        if (isStudent && data.interview?.scheduled_time) {
          checkInterviewTimeValidity(data.interview.scheduled_time);
        } else if (isStudent) {
          // If no scheduled time, allow interview
          setIsInterviewTimeValid(true);
        } else {
          // Admin can always join
          setIsInterviewTimeValid(true);
        }
      }
    } catch (error) {
      console.error('Fetch interview error:', error);
    }
  };

  const checkInterviewTimeValidity = (scheduledTime) => {
    const now = new Date();
    const interviewStart = new Date(scheduledTime);
    
    const isValid = now >= interviewStart;
    setIsInterviewTimeValid(isValid);
    
    if (!isValid) {
      const timeUntilValid = interviewStart.getTime() - now.getTime();
      const minutesUntil = Math.ceil(timeUntilValid / (1000 * 60));
      const hoursUntil = Math.floor(minutesUntil / 60);
      const remainingMinutes = minutesUntil % 60;
      
      let timeString = '';
      if (hoursUntil > 0) {
        timeString = `${hoursUntil}h ${remainingMinutes}m`;
      } else {
        timeString = `${minutesUntil}m`;
      }
      
      setTimeUntilInterview(timeString);
      setConnectionStatus(`Interview starts in ${timeString}`);
      
      // Set up a timer to check again when it becomes valid
      const timeout = setTimeout(() => {
        checkInterviewTimeValidity(scheduledTime);
      }, Math.min(timeUntilValid, 60000)); // Check every minute or when valid
      
      return () => clearTimeout(timeout);
    } else {
      setTimeUntilInterview('');
      setConnectionStatus('You can now join the interview room');
    }
  };
  const initializeSocketAndPeer = async () => {
    try {
      setLoading(true);
      
      if (socketRef.current && socketRef.current.connected) {
        console.log('Socket already connected, skipping initialization');
        setLoading(false);
        return;
      }
      
      // Initialize Socket.IO
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
        console.log('User role:', role, 'Interview ID:', interviewId);
        setConnectionStatus('Connected to server');
        
        if (isAdmin) {
          setAdminInRoom(true);
          setConnectionStatus('Ready to call student');
          console.log('Admin connected - enabling call button');
        } else if (isStudent) {
          // Student will auto-join when time is valid
          if (isInterviewTimeValid) {
            setConnectionStatus('Joining interview room...');
          } else {
            setConnectionStatus(`Interview starts in ${timeUntilInterview}`);
          }
          console.log('Student connected - will auto-join when time is valid');
        }
        
        // Request room status after connecting
        setTimeout(() => {
          socket.emit('interview:get-room-status', { interviewId });
        }, 1000);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionStatus('Connection error');
        setError('Failed to connect to interview server. Please check your internet connection.');
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setConnectionStatus('Disconnected');
        
        if (reason === 'io server disconnect') {
          console.log('Server disconnected, attempting to reconnect...');
          socket.connect();
        }
      });

      // Initialize PeerJS
      const newPeer = new Peer();
      
      newPeer.on('open', (id) => {
        console.log('My peer ID:', id);
        setPeerId(id);
        setConnectionStatus(isAdmin ? 'Ready to call' : 'Ready');
        
        let retryCount = 0;
        const maxRetries = 10;
        
        const emitPeerInfo = () => {
          if (socket.connected) {
            console.log('Emitting interview:join with peer ID:', id, 'Role:', role, 'Interview ID:', interviewId);
            socket.emit('interview:join', {
              interviewId,
              peerId: id,
              role
            });
            
            socket.emit('interview:signal-peer', {
              interviewId,
              peerId: id
            });
          } else if (retryCount < maxRetries) {
            retryCount++;
            console.warn(`Socket not connected, retry ${retryCount}/${maxRetries} in 1000ms...`);
            setTimeout(emitPeerInfo, 1000);
          } else {
            console.error('Socket connection failed after max retries');
            setConnectionStatus('Connection failed - please refresh');
            setError('Failed to join interview room. Please refresh and try again.');
          }
        };
        
        emitPeerInfo();
      });

      setupSocketEventHandlers(socket, newPeer);

      newPeer.on('error', (err) => {
        console.error('Peer error:', err);
        setConnectionStatus('Connection error - ' + err.type);
        setError('WebRTC connection failed: ' + err.message);
      });

      setPeer(newPeer);
      setLoading(false);
    } catch (error) {
      console.error('Initialize error:', error);
      setError('Failed to initialize interview room: ' + error.message);
      setLoading(false);
    }
  };
  const setupSocketEventHandlers = (socket, peer) => {
    // Handle incoming PeerJS calls - set this up early and don't override
    peer.on('call', (incoming) => {
      console.log('Receiving PeerJS call...');
      setConnectionStatus('Incoming call...');
      setCallState('ringing');
      answerCall(incoming);
    });

    // Listen for peer joining
    socket.on('interview:peer-joined', (data) => {
      console.log('Peer joined:', data);
      const peerIdString = typeof data.peerId === 'string' ? data.peerId : String(data.peerId);
      
      if (remotePeerId !== peerIdString) {
        console.log('Setting remotePeerId to:', peerIdString);
        setRemotePeerId(peerIdString);
        
        if (data.role === 'admin') {
          setAdminInRoom(true);
          setConnectionStatus('Interviewer joined');
        } else {
          setStudentInRoom(true);
          setConnectionStatus('Student joined');
        }
      }
    });

    // Listen for existing participants when joining
    socket.on('interview:existing-participants', (data) => {
      console.log('Existing participants:', data);
      if (data.participants && data.participants.length > 0) {
        data.participants.forEach(participant => {
          if (participant.role === 'admin' && isStudent) {
            setAdminInRoom(true);
            setRemotePeerId(participant.peerId);
            console.log('Found existing admin in room');
          } else if (participant.role === 'student' && isAdmin) {
            setStudentInRoom(true);
            setRemotePeerId(participant.peerId);
            console.log('Found existing student in room');
          }
        });
      }
    });

    // Listen for peer leaving
    socket.on('interview:peer-left', (data) => {
      console.log('Peer left:', data);
      setRemotePeerId('');
      
      if (data.role === 'admin') {
        setAdminInRoom(false);
        setConnectionStatus('Interviewer left');
      } else {
        setStudentInRoom(false);
        setConnectionStatus('Student left');
      }
      
      if (call) {
        call.close();
        setCall(null);
        setCallState('ended');
      }
    });

    // Listen for room status response
    socket.on('interview:room-status', (data) => {
      console.log('Room status received:', data);
      if (data.participants && data.participants.length > 0) {
        data.participants.forEach(participant => {
          if (participant.role === 'admin' && isStudent) {
            setAdminInRoom(true);
            setRemotePeerId(participant.peerId);
            console.log('Room status: Admin is in room');
          } else if (participant.role === 'student' && isAdmin) {
            setStudentInRoom(true);
            setRemotePeerId(participant.peerId);
            console.log('Room status: Student is in room');
          }
        });
      }
    });
    
    // Listen for admin starting call
    socket.on('interview:call-started', (data) => {
      console.log('Interview call started event received:', data);
      console.log('Student state:', { isStudent, isInterviewTimeValid, studentInRoom });
      
      if (isStudent && isInterviewTimeValid) {
        console.log('Setting incoming call to true');
        setIncomingCall(true);
        setCallState('ringing');
        setConnectionStatus('Incoming call from interviewer...');
        
        // Play call sound
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 1000;
            gain.gain.value = 0.1;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            setTimeout(() => {
              osc.stop();
              ctx.close();
            }, 2000);
          }
        } catch (e) {
          console.error('Audio error:', e);
        }
      } else if (isStudent && !isInterviewTimeValid) {
        console.log('Student received call but interview time not valid yet');
        // Optionally notify admin that student can't join yet
        socket.emit('interview:student-not-ready', {
          interviewId,
          reason: 'Interview time not yet valid'
        });
      } else {
        console.log('Call started event ignored - not student or time not valid');
      }
    });

    // Listen for student ready to receive call (admin side)
    socket.on('interview:student-ready', async (data) => {
      console.log('Student ready to receive call:', data);
      if (isAdmin && data.peerId && peer && !call) {
        if (isCallInProgress) {
          console.log('Call already in progress, ignoring student ready event');
          return;
        }
        
        try {
          // Ensure admin has media stream
          if (!localStreamRef.current) {
            console.log('Admin getting media stream for call');
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              ensureVideoPlays(localVideoRef.current, 'Local');
            }
          }
          
          setCallState('connecting');
          setIsCallInProgress(true);
          console.log('Admin calling student with peer ID:', data.peerId);
          
          const outgoingCall = peer.call(data.peerId, localStreamRef.current);
          setCall(outgoingCall);
          setConnectionStatus('Connecting...');

          outgoingCall.on('stream', (remoteStream) => {
            console.log('Admin received student stream');
            console.log('Student stream details:', {
              id: remoteStream.id,
              active: remoteStream.active,
              videoTracks: remoteStream.getVideoTracks().length,
              audioTracks: remoteStream.getAudioTracks().length
            });
            
            // Store as pending — remoteVideoRef may not be mounted yet
            pendingRemoteStreamRef.current = remoteStream;

            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.muted = false;
              remoteVideoRef.current.playsInline = true;
              remoteVideoRef.current.autoplay = true;
              ensureVideoPlays(remoteVideoRef.current, 'Remote');
              pendingRemoteStreamRef.current = null;
            }
            setConnectionStatus('Connected');
            setCallState('connected');
            setIsCallInProgress(false);
          });

          outgoingCall.on('close', () => {
            console.log('Student ended the call');
            setConnectionStatus('Call ended');
            setCall(null);
            setCallState('ended');
            setIsCallInProgress(false);
          });

          outgoingCall.on('error', (error) => {
            console.error('Admin call error:', error);
            setConnectionStatus('Call failed');
            setCallState('idle');
            setIsCallInProgress(false);
            setError('Call connection failed: ' + error.message);
          });
        } catch (error) {
          console.error('Error calling student:', error);
          setConnectionStatus('Failed to connect');
          setCallState('idle');
          setIsCallInProgress(false);
          setError('Failed to establish call: ' + error.message);
        }
      }
    });

    // Listen for student joining room (admin side)
    socket.on('interview:student-joined-room', (data) => {
      console.log('Student joined room:', data);
      if (isAdmin) {
        setStudentInRoom(true);
        setConnectionStatus('Student joined - ready to call');
      }
    });

    // Listen for chat messages
    socket.on('interview:chat-message', (data) => {
      console.log('Received chat message from server:', data);
      setChatMessages(prev => {
        const messageExists = prev.some(msg => 
          msg.text === data.text && 
          msg.timestamp === data.timestamp && 
          msg.sender === data.sender
        );
        
        if (messageExists) {
          console.log('Duplicate message detected, skipping');
          return prev;
        }
        
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

    // Request chat history when joining
    socket.emit('interview:get-chat-history', { interviewId });
  };
  // Ref to hold pending remote stream until remoteVideoRef is mounted
  const pendingRemoteStreamRef = useRef(null);

  const answerCall = async (incoming) => {
    try {
      console.log('Student answering PeerJS call from admin');
      
      // Reuse existing stream if already acquired (e.g. from joinInterviewRoom)
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          ensureVideoPlays(localVideoRef.current, 'Local');
        }
      }

      // Register stream handler BEFORE answering so we never miss the event
      incoming.on('stream', (remoteStream) => {
        console.log('Student received admin stream', {
          id: remoteStream.id,
          active: remoteStream.active,
          videoTracks: remoteStream.getVideoTracks().length,
          audioTracks: remoteStream.getAudioTracks().length,
        });

        // remoteVideoRef is only in the DOM after setCall(incoming) triggers a re-render.
        // Store the stream and apply it once the element is available.
        pendingRemoteStreamRef.current = remoteStream;

        const applyStream = (el) => {
          el.srcObject = remoteStream;
          el.muted = false;
          el.playsInline = true;
          el.autoplay = true;
          el.play().catch(e => {
            console.error('Failed to play admin video:', e);
            setTimeout(() => el.play().catch(console.error), 1000);
          });
        };

        if (remoteVideoRef.current) {
          applyStream(remoteVideoRef.current);
        }
        // The useEffect below will also fire once remoteVideoRef mounts
      });

      incoming.on('close', () => {
        console.log('Admin ended the call');
        setConnectionStatus('Call ended');
        setCall(null);
        setIncomingCall(false);
        setCallState('ended');
        pendingRemoteStreamRef.current = null;
      });

      incoming.on('error', (error) => {
        console.error('Call error:', error);
        setConnectionStatus('Call failed');
        setCallState('idle');
      });

      // Answer AFTER registering handlers
      incoming.answer(localStreamRef.current);
      setCall(incoming);
      setIncomingCall(false);
      setCallState('connected');
      setConnectionStatus('Connected');

    } catch (error) {
      console.error('Failed to answer call:', error);
      setConnectionStatus('Failed to access camera/microphone');
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Please allow camera and microphone access to join the call');
      }
    }
  };
  
  const answerIncomingCall = async () => {
    try {
      setIncomingCall(false);
      setConnectionStatus('Answering call...');
      
      // Student should already have media access from joinInterviewRoom
      // Just confirm they're ready to receive the PeerJS call
      if (socketRef.current && peerId && localStreamRef.current) {
        socketRef.current.emit('interview:student-ready', {
          interviewId,
          peerId
        });
        setConnectionStatus('Ready - waiting for connection...');
      } else {
        // Fallback: get media access if not already available
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          ensureVideoPlays(localVideoRef.current, 'Local');
        }
        
        if (socketRef.current && peerId) {
          socketRef.current.emit('interview:student-ready', {
            interviewId,
            peerId
          });
        }
        setConnectionStatus('Ready - waiting for connection...');
      }
    } catch (error) {
      console.error('Answer call error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Please allow camera and microphone access to answer the call');
      } else {
        alert('Failed to access camera/microphone');
      }
      setIncomingCall(true);
      setConnectionStatus('Incoming call from interviewer...');
    }
  };

  const joinInterviewRoom = async () => {
    try {
      if (!isInterviewTimeValid) {
        alert('Interview time has not started yet. Please wait.');
        return;
      }

      setConnectionStatus('Joining interview room...');
      
      // Get media access to prepare for call
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        ensureVideoPlays(localVideoRef.current, 'Local');
      }
      
      // Mark student as in room
      setStudentInRoom(true);
      setConnectionStatus('Waiting for interviewer to start the call');
      
      // Notify admin that student has joined the room and is ready for calls
      if (socketRef.current && peerId) {
        socketRef.current.emit('interview:student-joined-room', {
          interviewId,
          peerId,
          studentId: interview?.student_id
        });
        
        // Also emit student-ready so admin knows student can receive calls
        socketRef.current.emit('interview:student-ready', {
          interviewId,
          peerId
        });
      }
      
      console.log('Student joined interview room successfully and ready for calls');
    } catch (error) {
      console.error('Join room error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Please allow camera and microphone access to join the interview room');
      } else {
        alert('Failed to access camera/microphone');
      }
      setConnectionStatus('Failed to join - please try again');
    }
  };

  const startCall = async () => {
    try {
      if (isCallInProgress || callState !== 'idle') {
        console.log('Call already in progress, ignoring duplicate request');
        return;
      }
      
      if (!studentInRoom) {
        alert('Please wait for student to join the interview room first');
        return;
      }
      
      setIsCallInProgress(true);
      setCallState('calling');
      setConnectionStatus('Starting call...');
      
      // Get media access first
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        ensureVideoPlays(localVideoRef.current, 'Local');
      }
      
      if (socketRef.current && SOCKET_ENABLED) {
        console.log('Emitting interview:start-call event...');
        
        socketRef.current.emit('interview:start-call', {
          interviewId,
          studentId: interview?.student_id
        });
        setConnectionStatus('Calling student...');
        
        // Direct PeerJS call is handled via interview:student-ready socket event.
        // Do NOT make a duplicate call here to avoid double-call race conditions.
      }
    } catch (error) {
      console.error('Start call error:', error);
      setCallState('idle');
      setIsCallInProgress(false);
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

    socketRef.current.emit('interview:send-chat', message);
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
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      if (localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      
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
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        if (call && call.peerConnection) {
          const sender = call.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            await sender.replaceTrack(screenStream.getVideoTracks()[0]);
            console.log('Started screen sharing');
          }
        }

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

  const endCall = () => {
    if (call) {
      call.close();
      setCall(null);
      setCallState('ended');
      setConnectionStatus('Call ended');
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    setIsScreenSharing(false);
  };

  const endInterview = async () => {
    if (isAdmin) {
      const feedback = {
        admin_notes: '',
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
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    setCall(null);
    setCallState('idle');
    setIsCallInProgress(false);
    
    if (isStudent) {
      const token = localStorage.getItem('studentAuthToken');
      apiFetch(`api/interviews/${interviewId}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {});
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white">Interview not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div>
          <h1 className="text-white text-lg font-semibold">
            {interview.test_title || 'Interview'} • {interview.student_name}
          </h1>
          <p className="text-sm text-gray-400">{connectionStatus}</p>
        </div>
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button
              onClick={endInterview}
              className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              End Interview
            </button>
          )}
          <button
            onClick={leaveRoom}
            className="px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col p-6 space-y-4">
          {/* Main Video Area */}
          <div className="flex-1 rounded-xl bg-gray-800 overflow-hidden relative">
            {/* Remote Video (when in call) */}
            {call && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={false}
                controls={false}
                webkit-playsinline="true"
                className="w-full h-full object-cover"
                style={{ objectFit: 'cover' }}
                onLoadedMetadata={() => {
                  console.log('Remote video metadata loaded');
                  if (remoteVideoRef.current) {
                    console.log('Remote video dimensions:', {
                      videoWidth: remoteVideoRef.current.videoWidth,
                      videoHeight: remoteVideoRef.current.videoHeight,
                      readyState: remoteVideoRef.current.readyState
                    });
                  }
                }}
                onCanPlay={() => {
                  console.log('Remote video can play');
                }}
                onPlay={() => {
                  console.log('Remote video started playing');
                }}
                onError={(e) => {
                  console.error('Remote video error:', e);
                }}
              />
            )}
            
            {/* Local Video Preview (when not in call) */}
            {!call && (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted={true}
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Video Label */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 text-white text-sm">
              {call ? (isAdmin ? interview.student_name : 'Interviewer') : 'You (Preview)'}
            </div>

            {/* No Call State */}
            {!call && callState === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="bg-black/60 rounded-xl p-8 max-w-md">
                  {isStudent && !isInterviewTimeValid ? (
                    <>
                      <h3 className="text-white text-xl font-semibold mb-4">
                        Interview Not Yet Started
                      </h3>
                      <p className="text-gray-300 text-sm mb-2">
                        Interview starts in {timeUntilInterview}
                      </p>
                      <p className="text-gray-400 text-xs">
                        Please wait until the scheduled time to join
                      </p>
                    </>
                  ) : isStudent && isInterviewTimeValid && !studentInRoom ? (
                    <>
                      <h3 className="text-white text-xl font-semibold mb-4">
                        Ready to Join Interview
                      </h3>
                      <p className="text-gray-300 text-sm mb-6">
                        The interview time has arrived. Click below to join the interview room.
                      </p>
                      <button
                        onClick={joinInterviewRoom}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center space-x-2 mx-auto"
                      >
                        <Video size={20} />
                        <span>Join Interview Room</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-white text-xl font-semibold mb-4">
                        {isStudent 
                          ? 'Waiting for interviewer to start the call' 
                          : 'Ready to start the interview'}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {isAdmin 
                          ? (studentInRoom ? 'Student is in the room' : 'Waiting for student to join...') 
                          : (adminInRoom ? 'Interviewer is in the room' : 'Waiting for interviewer...')}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Incoming Video Call Overlay (Student) */}
            {incomingCall && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="bg-gray-800 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Phone className="text-white" size={24} />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">Incoming Video Call</h3>
                  <p className="text-gray-300 mb-6">Interviewer is calling you</p>
                  <div className="flex space-x-4">
                    <button
                      onClick={answerIncomingCall}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center space-x-2"
                    >
                      <Phone size={20} />
                      <span>Answer</span>
                    </button>
                    <button
                      onClick={() => setIncomingCall(false)}
                      className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Bottom Controls and Local Video */}
          <div className="flex items-end space-x-4">
            {/* Local Video (Picture-in-Picture when in call) */}
            {call && localStreamRef.current && (
              <div className="w-64 h-36 rounded-lg bg-gray-800 overflow-hidden relative flex-shrink-0">
                <video
                  ref={localVideoPipRef}
                  autoPlay
                  playsInline
                  muted={true}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-xs">
                  You {isScreenSharing && '(Screen)'}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex-1 flex justify-center">
              <div className="flex items-center space-x-4">
                {/* Call Button (Admin only) */}
                {!call && isAdmin && (
                  <button
                    onClick={startCall}
                    disabled={!adminInRoom || !studentInRoom || isCallInProgress}
                    className="px-6 py-3 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold flex items-center space-x-2 shadow-lg"
                  >
                    <Phone size={20} />
                    <span>
                      {isCallInProgress 
                        ? 'Calling...'
                        : !studentInRoom 
                          ? 'Waiting for student...' 
                          : 'Call Student'}
                    </span>
                  </button>
                )}

                {/* Join Room Button (Student only, when time is valid but not joined) */}
                {!call && isStudent && isInterviewTimeValid && !studentInRoom && (
                  <button
                    onClick={joinInterviewRoom}
                    className="px-6 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold flex items-center space-x-2 shadow-lg"
                  >
                    <Video size={20} />
                    <span>Join Interview Room</span>
                  </button>
                )}

                {/* Student waiting message when time not valid */}
                {!call && isStudent && !isInterviewTimeValid && (
                  <div className="px-6 py-3 rounded-full bg-gray-600 text-white font-semibold flex items-center space-x-2">
                    <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span>Interview starts in {timeUntilInterview}</span>
                  </div>
                )}

                {/* Student in room waiting for call */}
                {!call && isStudent && studentInRoom && (
                  <div className="px-6 py-3 rounded-full bg-green-600 text-white font-semibold flex items-center space-x-2">
                    <div className="animate-pulse w-2 h-2 bg-green-300 rounded-full"></div>
                    <span>Waiting for interviewer to call</span>
                  </div>
                )}

                {/* Video Controls (only show when in call) */}
                {call && (
                  <>
                    <button
                      onClick={toggleVideo}
                      className={`p-3 rounded-full ${
                        isVideoOn
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-red-600 hover:bg-red-700'
                      } text-white`}
                    >
                      {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
                    </button>

                    <button
                      onClick={toggleAudio}
                      className={`p-3 rounded-full ${
                        isAudioOn
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-red-600 hover:bg-red-700'
                      } text-white`}
                    >
                      {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
                    </button>

                    <button
                      onClick={toggleScreenShare}
                      className={`p-3 rounded-full ${
                        isScreenSharing
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-gray-700 hover:bg-gray-600'
                      } text-white`}
                    >
                      {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                    </button>

                    <button
                      onClick={endCall}
                      className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <PhoneOff size={20} />
                    </button>
                  </>
                )}

                {/* Chat Toggle */}
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
                >
                  <MessageSquare size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 border-l border-gray-700 bg-gray-800 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700 flex items-center space-x-2">
              <MessageSquare className="text-gray-400" size={18} />
              <span className="text-sm font-semibold text-white">Chat</span>
              <button
                onClick={() => setShowChat(false)}
                className="ml-auto text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-8">
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
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-white'
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

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-end space-x-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border-0 text-sm max-h-24"
                  rows="2"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim()}
                  className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white flex items-center justify-center"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;