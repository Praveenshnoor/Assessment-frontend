import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const FRAME_RATE = 5; // 5 frames per second
const FRAME_INTERVAL = 1000 / FRAME_RATE; // 200ms

export const useProctoringSimple = (onCameraLost) => {
  const [stream, setStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const studentDataRef = useRef(null);
  const cameraCheckIntervalRef = useRef(null);

  // Request camera and microphone permissions
  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false // We don't need audio for proctoring
      });
      
      setStream(mediaStream);
      setPermissionGranted(true);
      setError(null);
      return mediaStream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied. Please allow camera permissions to continue.');
      setPermissionGranted(false);
      throw err;
    }
  };

  // Initialize Socket.io connection with enhanced reliability
  const connectSocket = (studentData) => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000, // Start with 2 second delay
      reconnectionDelayMax: 10000, // Max 10 seconds between attempts
      reconnectionAttempts: 10, // Try 10 times before giving up
      timeout: 20000, // 20 second connection timeout
      forceNew: true, // Force new connection
    });

    // Connection success
    socket.on('connect', () => {
      console.log('[Proctoring] Connected to server');
      setIsConnected(true);
      setError(null);
      
      // Join proctoring session
      socket.emit('student:join-proctoring', studentData);
    });

    // Connection lost
    socket.on('disconnect', (reason) => {
      console.log('[Proctoring] Disconnected from server:', reason);
      setIsConnected(false);
      
      // Show user-friendly message based on reason
      if (reason === 'io server disconnect') {
        setError('Server disconnected you. Please refresh the page.');
      } else if (reason === 'transport close') {
        setError('Connection lost. Attempting to reconnect...');
      }
    });

    // Connection errors
    socket.on('connect_error', (err) => {
      console.error('[Proctoring] Connection error:', err);
      setError('Connection error. Retrying...');
    });

    // Reconnection attempts
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[Proctoring] Reconnection attempt ${attemptNumber}`);
      setError(`Reconnecting... (attempt ${attemptNumber})`);
    });

    // Successful reconnection
    socket.on('reconnect', (attemptNumber) => {
      console.log(`[Proctoring] Reconnected after ${attemptNumber} attempts`);
      setError(null);
      
      // Rejoin proctoring session after reconnection
      socket.emit('student:join-proctoring', studentData);
    });

    // Failed to reconnect
    socket.on('reconnect_failed', () => {
      console.error('[Proctoring] Failed to reconnect');
      setError('Failed to reconnect to server. Please refresh the page.');
    });

    // Server-side error messages
    socket.on('join-error', (data) => {
      console.error('[Proctoring] Join error:', data);
      setError(data.message || 'Failed to join proctoring session');
    });

    socket.on('socket-error', (data) => {
      console.error('[Proctoring] Socket error:', data);
      setError(data.message || 'Connection error occurred');
      
      if (data.shouldReconnect) {
        setTimeout(() => {
          socket.connect();
        }, 3000);
      }
    });

    // Handle duplicate connection
    socket.on('duplicate-connection', (data) => {
      console.warn('[Proctoring] Duplicate connection detected:', data);
      setError('Another exam session detected. This connection will close.');
    });

    // Handle connection timeout
    socket.on('connection-timeout', (data) => {
      console.warn('[Proctoring] Connection timeout:', data);
      setError(data.message || 'Connection timeout');
    });

    // Health check system
    socket.on('health-check', (data) => {
      // Respond to server health check
      socket.emit('health-check-response', {
        timestamp: data.timestamp,
        quality: navigator.onLine ? 'good' : 'poor',
        studentId: studentData.studentId
      });
    });

    // Enhanced keepalive with exponential backoff
    let keepaliveInterval;
    let keepaliveTimeout = 30000; // Start with 30 seconds
    
    const startKeepalive = () => {
      keepaliveInterval = setInterval(() => {
        if (socket.connected) {
          const pingStart = Date.now();
          
          socket.emit('ping', (response) => {
            const latency = Date.now() - pingStart;
            console.log(`[Proctoring] Ping response: ${latency}ms`);
            
            // Adjust keepalive frequency based on latency
            if (latency > 5000) { // High latency
              keepaliveTimeout = 60000; // Reduce frequency
            } else if (latency < 1000) { // Good latency
              keepaliveTimeout = 30000; // Normal frequency
            }
          });
          
          // If no pong received in 10 seconds, consider connection problematic
          setTimeout(() => {
            if (socket.connected) {
              console.warn('[Proctoring] No pong received, connection may be unstable');
            }
          }, 10000);
        }
      }, keepaliveTimeout);
    };

    socket.on('connect', startKeepalive);
    
    socket.on('disconnect', () => {
      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
      }
    });

    // Network status monitoring
    const handleOnline = () => {
      console.log('[Proctoring] Network back online');
      if (!socket.connected) {
        socket.connect();
      }
    };

    const handleOffline = () => {
      console.log('[Proctoring] Network went offline');
      setError('Network connection lost. Please check your internet connection.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    socketRef.current = socket;
    
    // Cleanup listeners on disconnect
    socket.on('disconnect', () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
      }
    });

    return socket;
  };

  // Capture and send video frames
  const startFrameCapture = (mediaStream, socket, studentData) => {
    // Create video element
    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.autoplay = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
    }
    
    // Create canvas for frame capture
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }

    videoRef.current.srcObject = mediaStream;
    const ctx = canvasRef.current.getContext('2d');

    // Wait for video to be ready
    videoRef.current.onloadedmetadata = () => {
      console.log('[Proctoring] Video ready, starting frame capture');
      
      // Play the video
      videoRef.current.play().then(() => {
        console.log('[Proctoring] Video playing');
        
        // Capture and send frames
        frameIntervalRef.current = setInterval(() => {
          if (socket.connected && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              // Draw current video frame to canvas
              ctx.drawImage(videoRef.current, 0, 0, 640, 480);
              
              // Convert canvas to base64 image
              const frameData = canvasRef.current.toDataURL('image/jpeg', 0.6); // 60% quality
              
              // Send frame to server with student info
              socket.emit('proctoring:frame', {
                studentId: studentData.studentId,
                studentName: studentData.studentName,
                testId: studentData.testId,
                testTitle: studentData.testTitle,
                frame: frameData,
                timestamp: Date.now(),
              });
            } catch (err) {
              console.error('[Proctoring] Error capturing frame:', err);
            }
          }
        }, FRAME_INTERVAL);
      }).catch(err => {
        console.error('[Proctoring] Error playing video:', err);
      });
    };
  };

  // Start proctoring
  const startProctoring = async (studentData) => {
    try {
      console.log('[Proctoring] Step 1: Requesting camera permissions...');
      studentDataRef.current = studentData;
      
      // Request permissions first
      const mediaStream = await requestPermissions();
      console.log('[Proctoring] Step 2: Permissions granted, stream ready');
      
      console.log('[Proctoring] Step 3: Connecting to server...');
      // Connect socket
      const socket = connectSocket(studentData);
      
      // Wait for socket to connect
      await new Promise((resolve) => {
        if (socket.connected) {
          resolve();
        } else {
          socket.once('connect', resolve);
        }
      });
      console.log('[Proctoring] Step 4: Connected to server');
      
      console.log('[Proctoring] Step 5: Starting frame capture...');
      // Start capturing and sending frames
      startFrameCapture(mediaStream, socket, studentData);
      console.log('[Proctoring] Step 6: Proctoring active');
      
      // Monitor camera status - check every 2 seconds
      cameraCheckIntervalRef.current = setInterval(() => {
        const tracks = mediaStream.getVideoTracks();
        if (tracks.length === 0 || !tracks[0].enabled || tracks[0].readyState === 'ended') {
          console.error('[Proctoring] Camera lost or disabled!');
          if (onCameraLost) {
            onCameraLost('Camera was disabled or disconnected. Exam terminated.');
          }
          stopProctoring();
        }
      }, 2000);
      
      return { success: true };
    } catch (err) {
      console.error('[Proctoring] Start error:', err);
      setError(err.message || 'Failed to start proctoring');
      return { success: false, error: err.message };
    }
  };

  // Stop proctoring
  const stopProctoring = useCallback(() => {
    console.log('[Proctoring] Stopping proctoring...');
    
    // Stop camera check interval
    if (cameraCheckIntervalRef.current) {
      clearInterval(cameraCheckIntervalRef.current);
      cameraCheckIntervalRef.current = null;
    }
    
    // Stop frame capture
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    // Stop media stream - use ref to avoid stale closure
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    // Clean up video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.emit('student:leave-proctoring', studentDataRef.current);
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setStream(null);
    setIsConnected(false);
    setPermissionGranted(false);
    console.log('[Proctoring] Stopped');
  }, []); // Empty deps - uses only refs

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProctoring();
    };
  }, []);

  return {
    stream,
    isConnected,
    error,
    permissionGranted,
    startProctoring,
    stopProctoring,
  };
};
