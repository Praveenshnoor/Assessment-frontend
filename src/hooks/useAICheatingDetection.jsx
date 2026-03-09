import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceDetector, FilesetResolver, ObjectDetector } from '@mediapipe/tasks-vision';

export const useAICheatingDetection = (onViolation) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [violations, setViolations] = useState({
    multipleFaces: 0,
    noFace: 0,
    phoneDetected: 0,
    lookingAway: 0
  });

  const faceDetectorRef = useRef(null);
  const objectDetectorRef = useRef(null);
  const videoRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const noFaceTimerRef = useRef(null);
  const noFaceDurationRef = useRef(0);
  const lastViolationTimeRef = useRef({});
  const lastFrameTimeRef = useRef(0);
  const detectionActiveRef = useRef(false);

  // Configuration
  const DETECTION_INTERVAL = 2000;
  const NO_FACE_THRESHOLD = 3000;
  const VIOLATION_COOLDOWN = 5000; // 5 seconds between same violation type (reduced from 10s)

  // Load MediaPipe models with retry logic
  const loadModels = useCallback(async () => {
    console.log('[AI Detection] 🚀 loadModels() called');
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`[AI Detection] Loading models... (Attempt ${retryCount + 1}/${maxRetries})`);
        
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        // Load face detector with retry
        console.log('[AI Detection] Loading face detector...');
        const faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'CPU' // Changed from GPU to CPU for better compatibility
          },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.4 // Lowered from 0.5 for better multi-face detection
        });
        faceDetectorRef.current = faceDetector;
        console.log('[AI Detection] ✅ Face detector loaded');

        // Load object detector with retry
        console.log('[AI Detection] Loading object detector...');
        const objectDetector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
            delegate: 'CPU' // Changed from GPU to CPU for better compatibility
          },
          runningMode: 'VIDEO',
          scoreThreshold: 0.3, // Increased from 0.2 for fewer false positives
          maxResults: 5
        });
        objectDetectorRef.current = objectDetector;
        console.log('[AI Detection] ✅ Object detector loaded');

        console.log('[AI Detection] ✅✅ All models loaded successfully');
        setIsModelLoaded(true);
        return true; // Success - exit retry loop
        
      } catch (error) {
        retryCount++;
        console.error(`[AI Detection] ❌ Failed to load models (Attempt ${retryCount}/${maxRetries}):`, error);
        console.error('[AI Detection] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        if (retryCount < maxRetries) {
          // Wait before retrying (exponential backoff)
          const waitTime = Math.min(1000 * Math.pow(2, retryCount), 5000);
          console.log(`[AI Detection] Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          console.error('[AI Detection] ❌❌ Failed to load models after all retries. AI detection disabled.');
          console.error('[AI Detection] Final error:', error);
          setIsModelLoaded(false);
          return false;
        }
      }
    }
  }, []);

  const canReportViolation = (violationType) => {
    const now = Date.now();
    const lastTime = lastViolationTimeRef.current[violationType] || 0;
    return (now - lastTime) >= VIOLATION_COOLDOWN;
  };

  const updateViolationTime = (violationType) => {
    lastViolationTimeRef.current[violationType] = Date.now();
  };

  const detectMultipleFaces = useCallback((detections) => {
    const faceCount = detections.detections.length;
    
    // Always log face count for debugging
    if (faceCount !== 1) {
      console.log(`[AI] 👥 Face count: ${faceCount}`);
    }
    
    if (faceCount > 1) {
      const now = Date.now();
      const lastTime = lastViolationTimeRef.current['multiple_faces'] || 0;
      
      if ((now - lastTime) >= VIOLATION_COOLDOWN) {
        lastViolationTimeRef.current['multiple_faces'] = now;
        console.log(`[AI] ⚠️⚠️ MULTIPLE FACES VIOLATION: ${faceCount} faces detected!`);
        return {
          type: 'multiple_faces',
          count: faceCount,
          severity: 'high',
          message: `${faceCount} faces detected - Only one person allowed during exam`
        };
      } else {
        const timeLeft = Math.ceil((VIOLATION_COOLDOWN - (now - lastTime)) / 1000);
        console.log(`[AI] Multiple faces detected but cooldown active (${timeLeft}s remaining)`);
      }
    }

    return null;
  }, []);

  const detectNoFace = useCallback((detections) => {
    const faceCount = detections.detections.length;
    
    if (faceCount === 0) {
      if (!noFaceTimerRef.current) {
        noFaceTimerRef.current = Date.now();
        console.log('[AI] ⚠️ No face detected - timer started');
      }
      
      noFaceDurationRef.current = Date.now() - noFaceTimerRef.current;
      const durationSeconds = Math.floor(noFaceDurationRef.current / 1000);
      
      if (noFaceDurationRef.current >= NO_FACE_THRESHOLD) {
        const now = Date.now();
        const lastTime = lastViolationTimeRef.current['no_face'] || 0;
        
        // Check if enough time has passed since last violation
        if ((now - lastTime) >= VIOLATION_COOLDOWN) {
          lastViolationTimeRef.current['no_face'] = now;
          console.log('[AI] ⚠️⚠️ NO FACE VIOLATION TRIGGERED');
          
          // Reset timer after reporting so it can trigger again if face still missing
          noFaceTimerRef.current = now;
          
          return {
            type: 'no_face',
            duration: noFaceDurationRef.current,
            severity: 'high',
            message: `No face detected for ${durationSeconds} seconds - Student must be visible`
          };
        } else {
          // Still in cooldown, log but don't report
          const timeLeft = Math.ceil((VIOLATION_COOLDOWN - (now - lastTime)) / 1000);
          console.log(`[AI] No face still detected but cooldown active (${timeLeft}s remaining)`);
        }
      }
    } else {
      // Face detected - reset timer
      if (noFaceTimerRef.current) {
        console.log('[AI] ✅ Face detected again - timer reset');
        noFaceTimerRef.current = null;
        noFaceDurationRef.current = 0;
      }
    }

    return null;
  }, []);

  const detectPhone = useCallback((objectDetections) => {
    if (!objectDetections || !objectDetections.detections) return null;

    const phoneDetections = objectDetections.detections.filter(det => {
      const categoryName = det.categories[0]?.categoryName?.toLowerCase() || '';
      const score = det.categories[0]?.score || 0;
      return (categoryName.includes('phone') || categoryName.includes('cell') || categoryName.includes('mobile')) && score > 0.2;
    });

    if (phoneDetections.length > 0) {
      const now = Date.now();
      const lastTime = lastViolationTimeRef.current['phone_detected'] || 0;
      
      if ((now - lastTime) >= VIOLATION_COOLDOWN) {
        const detection = phoneDetections[0];
        const confidence = Math.round(detection.categories[0].score * 100);
        lastViolationTimeRef.current['phone_detected'] = now;
        console.log(`[AI] ⚠️ PHONE DETECTED: ${confidence}%`);
        return {
          type: 'phone_detected',
          confidence: detection.categories[0].score,
          severity: 'high',
          message: `Mobile device detected (${confidence}% confidence) - Not allowed during exam`
        };
      }
    }

    return null;
  }, []);

  const detectLookingDown = useCallback((faceDetections) => {
    if (faceDetections.detections.length !== 1) return null;

    const detection = faceDetections.detections[0];
    const keypoints = detection.keypoints;

    if (keypoints && keypoints.length >= 6) {
      const leftEye = keypoints.find(kp => kp.category === 'leftEye');
      const rightEye = keypoints.find(kp => kp.category === 'rightEye');
      const noseTip = keypoints.find(kp => kp.category === 'noseTip');

      if (leftEye && rightEye && noseTip) {
        const eyeY = (leftEye.y + rightEye.y) / 2;
        const noseY = noseTip.y;
        const lookingDownThreshold = 0.05;

        if (noseY - eyeY > lookingDownThreshold) {
          const now = Date.now();
          const lastTime = lastViolationTimeRef.current['looking_down'] || 0;
          
          if ((now - lastTime) >= VIOLATION_COOLDOWN) {
            lastViolationTimeRef.current['looking_down'] = now;
            console.log('[AI] ⚠️ LOOKING DOWN');
            return {
              type: 'looking_down',
              severity: 'medium',
              message: 'Student looking down - Possible phone usage or notes'
            };
          }
        }
      }
    }

    return null;
  }, []);

  const runDetection = useCallback(async () => {
    if (!videoRef.current || !detectionActiveRef.current) {
      return;
    }
    if (!faceDetectorRef.current || !objectDetectorRef.current) {
      return;
    }

    const video = videoRef.current;
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    try {
      const now = performance.now();
      
      const faceDetections = faceDetectorRef.current.detectForVideo(video, now);
      const objectDetections = objectDetectorRef.current.detectForVideo(video, now);
      
      const faceCount = faceDetections.detections.length;
      
      // Only log when face count is abnormal (not 1)
      if (faceCount !== 1) {
        console.log(`[AI] 👥 Face count: ${faceCount}`);
        if (faceDetections.detections.length > 0) {
          faceDetections.detections.forEach((face, idx) => {
            const confidence = face.categories?.[0]?.score || 0;
            console.log(`[AI]   Face ${idx + 1}: confidence ${(confidence * 100).toFixed(1)}%`);
          });
        }
      }
      
      // Silent mode - no logging for normal single-face detection
      
      lastFrameTimeRef.current = now;

      const violations = [
        detectMultipleFaces(faceDetections),
        detectNoFace(faceDetections),
        detectPhone(objectDetections),
        detectLookingDown(faceDetections)
      ].filter(v => v !== null);

      if (violations.length > 0) {
        console.log(`[AI] ⚠️⚠️ ${violations.length} violation(s):`, violations.map(v => v.type));
        violations.forEach(violation => {
          setViolations(prev => {
            const newViolations = { ...prev };
            
            if (violation.type === 'multiple_faces') {
              newViolations.multipleFaces += 1;
            } else if (violation.type === 'no_face') {
              newViolations.noFace += 1;
            } else if (violation.type === 'phone_detected' || violation.type === 'looking_down') {
              newViolations.phoneDetected += 1;
            }
            
            return newViolations;
          });

          if (onViolation) {
            onViolation(violation);
          }
        });
      }
    } catch (error) {
      console.error('[AI Detection] ❌ Error during detection:', error);
    }
  }, [detectMultipleFaces, detectNoFace, detectPhone, detectLookingDown, onViolation]);

  const startDetection = useCallback(async (videoElement) => {
    console.log('[AI] startDetection called');
    console.log('[AI] isModelLoaded:', isModelLoaded);
    console.log('[AI] faceDetectorRef:', !!faceDetectorRef.current);
    console.log('[AI] objectDetectorRef:', !!objectDetectorRef.current);
    
    // Wait for models to load
    if (!faceDetectorRef.current || !objectDetectorRef.current) {
      console.log('[AI] Waiting for models to load...');
      let waitCount = 0;
      const maxWait = 30; // Increased from 20 to 30
      
      while (!faceDetectorRef.current || !objectDetectorRef.current) {
        if (waitCount >= maxWait) {
          console.error('[AI] ❌ Models not loaded after waiting');
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        waitCount++;
        console.log(`[AI] Waiting for models... ${waitCount}/${maxWait}`);
      }
    }

    try {
      videoRef.current = videoElement;
      console.log('[AI] Video element assigned, readyState:', videoElement.readyState);
      
      // Wait for video to be ready
      if (videoElement.readyState < videoElement.HAVE_ENOUGH_DATA) {
        console.log('[AI] Waiting for video to be ready...');
        await new Promise((resolve) => {
          const checkReady = () => {
            if (videoElement.readyState >= videoElement.HAVE_ENOUGH_DATA) {
              console.log('[AI] Video ready!');
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        });
      }
      
      detectionActiveRef.current = true;
      detectionIntervalRef.current = setInterval(runDetection, DETECTION_INTERVAL);
      
      console.log('[AI] ✅✅ Detection started successfully - checking every 2s');
      return true;
    } catch (error) {
      console.error('[AI Detection] ❌ Error starting detection:', error);
      return false;
    }
  }, [runDetection, isModelLoaded]);

  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    noFaceTimerRef.current = null;
    noFaceDurationRef.current = 0;
    lastViolationTimeRef.current = {};
    detectionActiveRef.current = false;
  }, []);

  // Manual test function - can be called from console
  const testViolation = useCallback((type = 'multiple_faces') => {
    console.log(`[AI] 🧪 Testing violation: ${type}`);
    const testViolations = {
      multiple_faces: {
        type: 'multiple_faces',
        count: 2,
        severity: 'high',
        message: '2 faces detected - Only one person allowed during exam'
      },
      no_face: {
        type: 'no_face',
        duration: 3000,
        severity: 'high',
        message: 'No face detected for 3 seconds - Student must be visible'
      },
      phone_detected: {
        type: 'phone_detected',
        confidence: 0.85,
        severity: 'high',
        message: 'Mobile device detected (85% confidence) - Not allowed during exam'
      }
    };

    const violation = testViolations[type];
    if (violation && onViolation) {
      onViolation(violation);
    }
  }, [onViolation]);

  // Expose test function to window for console testing (only log once)
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.testAIViolation) {
      window.testAIViolation = testViolation;
      console.log('[AI] 🧪 Test function available: window.testAIViolation("multiple_faces")');
    }
  }, [testViolation]);

  useEffect(() => {
    loadModels();
    
    return () => {
      stopDetection();
    };
  }, [loadModels, stopDetection]);

  return {
    isModelLoaded,
    detectionActive: detectionActiveRef.current,
    violations,
    startDetection,
    stopDetection,
    loadModels,
    testViolation // Export test function
  };
};
