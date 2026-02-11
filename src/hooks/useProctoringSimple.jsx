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

  // Initialize Socket.io connection
  const connectSocket = (studentData) => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[Proctoring] Connected to server');
      setIsConnected(true);
      
      // Join proctoring session
      socket.emit('student:join-proctoring', studentData);
    });

    socket.on('disconnect', () => {
      console.log('[Proctoring] Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Proctoring] Connection error:', err);
      setError('Connection error. Retrying...');
    });

    // Keepalive ping every 30 seconds
    const keepaliveInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000);

    socket.on('pong', () => {
      console.log('[Proctoring] Keepalive pong received');
    });

    socketRef.current = socket;
    
    // Cleanup interval on disconnect
    socket.on('disconnect', () => {
      clearInterval(keepaliveInterval);
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
