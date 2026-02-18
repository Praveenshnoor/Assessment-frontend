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
  const VIOLATION_COOLDOWN = 10000; // 10 seconds between same violation type

  // Load MediaPipe models
  const loadModels = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.6
      });
      faceDetectorRef.current = faceDetector;

      const objectDetector = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        scoreThreshold: 0.2,
        maxResults: 5
      });
      objectDetectorRef.current = objectDetector;

      setIsModelLoaded(true);
    } catch (error) {
      console.error('[AI Detection] Error loading models:', error);
      setIsModelLoaded(false);
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
    
    if (faceCount > 1) {
      const now = Date.now();
      const lastTime = lastViolationTimeRef.current['multiple_faces'] || 0;
      
      if ((now - lastTime) >= VIOLATION_COOLDOWN) {
        lastViolationTimeRef.current['multiple_faces'] = now;
        console.log(`[AI] ⚠️ MULTIPLE FACES: ${faceCount}`);
        return {
          type: 'multiple_faces',
          count: faceCount,
          severity: 'high',
          message: `${faceCount} faces detected - Only one person allowed during exam`
        };
      }
    }

    return null;
  }, []);

  const detectNoFace = useCallback((detections) => {
    const faceCount = detections.detections.length;
    
    if (faceCount === 0) {
      if (!noFaceTimerRef.current) {
        noFaceTimerRef.current = Date.now();
        console.log('[AI] No face - timer started');
      }
      
      noFaceDurationRef.current = Date.now() - noFaceTimerRef.current;
      const durationSeconds = Math.floor(noFaceDurationRef.current / 1000);
      
      console.log(`[AI] No face duration: ${durationSeconds}s`);
      
      if (noFaceDurationRef.current >= NO_FACE_THRESHOLD) {
        const now = Date.now();
        const lastTime = lastViolationTimeRef.current['no_face'] || 0;
        
        if ((now - lastTime) >= VIOLATION_COOLDOWN) {
          lastViolationTimeRef.current['no_face'] = now;
          console.log('[AI] ⚠️ NO FACE VIOLATION TRIGGERED');
          return {
            type: 'no_face',
            duration: noFaceDurationRef.current,
            severity: 'high',
            message: `No face detected for ${durationSeconds} seconds - Student must be visible`
          };
        }
      }
    } else {
      if (noFaceTimerRef.current) {
        console.log('[AI] Face detected - timer reset');
      }
      noFaceTimerRef.current = null;
      noFaceDurationRef.current = 0;
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
      
      // Debug: Log face count
      console.log(`[AI] Faces: ${faceDetections.detections.length}`);
      
      lastFrameTimeRef.current = now;

      const violations = [
        detectMultipleFaces(faceDetections),
        detectNoFace(faceDetections),
        detectPhone(objectDetections),
        detectLookingDown(faceDetections)
      ].filter(v => v !== null);

      if (violations.length > 0) {
        console.log(`[AI] ⚠️ ${violations.length} violation(s):`, violations.map(v => v.type));
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
      console.error('[AI Detection] Error during detection:', error);
    }
  }, [detectMultipleFaces, detectNoFace, detectPhone, detectLookingDown, onViolation]);

  const startDetection = useCallback(async (videoElement) => {
    if (!isModelLoaded) {
      let waitCount = 0;
      const maxWait = 20;
      
      while (!faceDetectorRef.current || !objectDetectorRef.current) {
        if (waitCount >= maxWait) {
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        waitCount++;
      }
    }

    try {
      videoRef.current = videoElement;
      
      if (videoElement.readyState < videoElement.HAVE_ENOUGH_DATA) {
        await new Promise((resolve) => {
          const checkReady = () => {
            if (videoElement.readyState >= videoElement.HAVE_ENOUGH_DATA) {
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
      
      console.log('[AI] ✅ Detection started - checking every 2s');
      return true;
    } catch (error) {
      console.error('[AI Detection] Error starting detection:', error);
      return false;
    }
  }, [runDetection]);

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
    loadModels
  };
};
