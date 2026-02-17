import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAICheatingDetection } from './useAICheatingDetection';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const FRAME_RATE = 5; // 5 frames per second
const FRAME_INTERVAL = 1000 / FRAME_RATE; // 200ms

export const useProctoringWithAI = (onCameraLost, onAIViolation) => {
  const [stream, setStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [aiViolations, setAiViolations] = useState([]);
  
  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const studentDataRef = useRef(null);
  const cameraCheckIntervalRef = useRef(null);

  // AI Detection hook
  const {
    isModelLoaded,
    detectionActive,
    violations,
    startDetection,
    stopDetection
  } = useAICheatingDetection((violation) => {
    // Add to violations list
    setAiViolations(prev => [...prev, {
      ...violation,
      timestamp: Date.now()
    }]);

    // Notify parent component
    if (onAIViolation) {
      onAIViolation(violation);
    }

    // Send violation to backend
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('proctoring:ai-violation', {
        studentId: studentDataRef.current?.studentId,
        testId: studentDataRef.current?.testId,
        violation: violation,
        timestamp: Date.now()
      });
    }
  });

  // Request camera and microphone permissions
  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
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
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
      timeout: 20000,
      forceNew: true,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      socket.emit('student:join-proctoring', studentData);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        setError('Server disconnected you. Please refresh the page.');
      } else if (reason === 'transport close') {
        setError('Connection lost. Attempting to reconnect...');
      }
    });

    socket.on('connect_error', (err) => {
      console.error('[Proctoring] Connection error:', err);
      setError('Connection error. Retrying...');
    });

    socket.on('reconnect', (attemptNumber) => {
      setError(null);
      socket.emit('student:join-proctoring', studentData);
    });

    socketRef.current = socket;
    return socket;
  };

  // Capture and send video frames
  const startFrameCapture = (mediaStream, socket, studentData) => {
    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.autoplay = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
    }
    
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }

    videoRef.current.srcObject = mediaStream;
    const ctx = canvasRef.current.getContext('2d');

    videoRef.current.onloadedmetadata = () => {
      videoRef.current.play().then(async () => {
        // Wait a bit for video to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to start AI detection
        const started = await startDetection(videoRef.current);
        
        if (!started) {
          // Retry after 5 seconds
          setTimeout(async () => {
            await startDetection(videoRef.current);
          }, 5000);
        }
        
        // Capture and send frames
        frameIntervalRef.current = setInterval(() => {
          if (socket.connected && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              ctx.drawImage(videoRef.current, 0, 0, 640, 480);
              const frameData = canvasRef.current.toDataURL('image/jpeg', 0.6);
              
              socket.emit('proctoring:frame', {
                studentId: studentData.studentId,
                studentName: studentData.studentName,
                testId: studentData.testId,
                testTitle: studentData.testTitle,
                frame: frameData,
                timestamp: Date.now(),
                aiViolations: violations // Include AI violation counts
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

  // Start proctoring with AI
  const startProctoring = async (studentData) => {
    try {
      studentDataRef.current = studentData;
      
      const mediaStream = await requestPermissions();
      const socket = connectSocket(studentData);
      
      await new Promise((resolve) => {
        if (socket.connected) {
          resolve();
        } else {
          socket.once('connect', resolve);
        }
      });
      
      startFrameCapture(mediaStream, socket, studentData);
      
      // Monitor camera status
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
    // Stop AI detection
    stopDetection();
    
    if (cameraCheckIntervalRef.current) {
      clearInterval(cameraCheckIntervalRef.current);
      cameraCheckIntervalRef.current = null;
    }
    
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.emit('student:leave-proctoring', studentDataRef.current);
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setStream(null);
    setIsConnected(false);
    setPermissionGranted(false);
  }, [stopDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProctoring();
    };
  }, [stopProctoring]);

  return {
    stream,
    isConnected,
    error,
    permissionGranted,
    isModelLoaded,
    detectionActive,
    violations,
    aiViolations,
    startProctoring,
    stopProctoring,
  };
};
