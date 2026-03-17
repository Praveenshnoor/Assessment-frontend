import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Monitor, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { apiFetch } from '../config/api';

const Instructions = () => {
  const navigate = useNavigate();
  const [hasRead, setHasRead] = useState(false);
  const [testDetails, setTestDetails] = useState(null);
  const [hasProgress, setHasProgress] = useState(false);

  useEffect(() => {
    const testId = localStorage.getItem('selectedTestId');
    const applicationId = localStorage.getItem('currentApplicationId');
    const token = localStorage.getItem('studentAuthToken');

    if (!token) {
      navigate('/login');
      return;
    }

    if (!testId) {
      navigate('/dashboard');
      return;
    }

    // Fetch test details and check for saved progress
    const fetchTestData = async () => {
      try {
        const endpoint = applicationId
          ? `api/student/test/${testId}?applicationId=${applicationId}`
          : `api/student/test/${testId}`;

        const response = await apiFetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Test data received:', data);
          if (data.success) {
            // Set test details from backend
            setTestDetails({
              title: data.test.title,
              duration: data.test.duration || 60,
              totalQuestions: data.test.questions.length
            });

            // Check if progress exists
            if (data.savedProgress) {
              setHasProgress(true);
              console.log('Saved progress found:', data.savedProgress);
            }
          }
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Failed to load test details');
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Error fetching test data:', err);
        alert('Failed to load test. Please try again.');
        navigate('/dashboard');
      }
    };

    fetchTestData();
  }, [navigate]);

  const handleStartExam = async () => {
    const testId = localStorage.getItem('selectedTestId');
    const token = localStorage.getItem('studentAuthToken');

    try {
      // CRITICAL: Request camera AND microphone permission BEFORE starting/resuming exam
      console.log('Requesting camera and microphone permissions...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false
          }
        });

        // Check if both camera and microphone are available
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();

        if (videoTracks.length === 0) {
          stream.getTracks().forEach(track => track.stop());
          alert('⚠️ Camera Access Required\n\nYou must allow camera access to take this exam.\n\nPlease:\n1. Click the camera icon in your browser address bar\n2. Allow camera access\n3. Refresh the page and try again');
          return;
        }

        if (audioTracks.length === 0) {
          stream.getTracks().forEach(track => track.stop());
          alert('⚠️ Microphone Access Required\n\nYou must allow microphone access to take this exam.\n\nPlease:\n1. Click the microphone icon in your browser address bar\n2. Allow microphone access\n3. Refresh the page and try again');
          return;
        }

        // Stop the stream immediately - we just needed to check permissions
        stream.getTracks().forEach(track => track.stop());
        console.log('Camera and microphone permissions granted');
      } catch (permissionError) {
        console.error('Camera/Microphone permission denied:', permissionError);
        alert('⚠️ Camera and Microphone Access Required\n\nYou must allow both camera and microphone access to take this exam.\n\nPlease:\n1. Click the camera/microphone icons in your browser address bar\n2. Allow both camera and microphone access\n3. Refresh the page and try again');
        return; // Block exam from starting
      }

      // Only create initial progress if no progress exists (first time starting)
      if (!hasProgress) {
        console.log('Creating initial progress...');
        const progressResponse = await apiFetch('api/student/save-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            testId: parseInt(testId),
            answers: {},
            currentQuestion: 0,
            markedForReview: [],
            visitedQuestions: [0],
            timeRemaining: (testDetails?.duration || 60) * 60, // Convert minutes to seconds
            warningCount: 0
          })
        });

        if (!progressResponse.ok) {
          const errorData = await progressResponse.json();
          console.error('Failed to save progress:', errorData);
          throw new Error('Failed to start exam');
        }

        const progressData = await progressResponse.json();
        console.log('Progress saved:', progressData);
      } else {
        console.log('Resuming existing progress with camera permission verified...');
      }


      navigate('/test');
    } catch (error) {
      console.error('Error starting exam:', error);
      alert('Failed to start exam. Please try again.');
    }
  };

  const rules = [
    {
      icon: <Clock className="w-6 h-6 text-shnoor-indigo" />,
      title: 'Duration',
      description: `You have ${testDetails?.duration || 60} minutes to complete the examination. The timer cannot be paused once started.`
    },
    {
      icon: <Monitor className="w-6 h-6 text-shnoor-success" />,
      title: 'Fullscreen Mode',
      description: 'Fullscreen mode is mandatory throughout the examination. Exiting fullscreen will trigger a warning.'
    },
    {
      icon: <Shield className="w-6 h-6 text-shnoor-danger" />,
      title: 'Camera & Microphone Required',
      description: 'Camera and microphone access are mandatory for proctoring. The exam will not start without both permissions.'
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-shnoor-warning" />,
      title: 'Tab Switching Policy',
      description: 'Switching tabs or applications is strictly prohibited. You will receive 3 warnings before automatic submission.'
    },
    {
      icon: <Shield className="w-6 h-6 text-shnoor-indigo" />,
      title: 'Prohibited Actions',
      description: 'Copy-paste, right-click, and keyboard shortcuts (Ctrl+C, Ctrl+V, etc.) are disabled during the test.'
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-shnoor-success" />,
      title: 'Navigation',
      description: 'You can navigate between questions using the sidebar palette. All answers are auto-saved.'
    }
  ];

  if (!testDetails) return null;

  return (
    <div className="min-h-screen bg-[#F8F8FB] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-mist p-4 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-shnoor-navy mb-2">Examination Instructions</h1>
              <p className="text-base sm:text-lg text-shnoor-indigoMedium">{testDetails.title}</p>
              {hasProgress && (
                <div className="mt-3 flex items-center space-x-2 text-shnoor-success bg-shnoor-successLight px-4 py-2 rounded-lg inline-flex">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-semibold text-sm sm:text-base">You have saved progress for this test</span>
                </div>
              )}
            </div>
            <div className="hidden sm:flex w-16 h-16 bg-shnoor-lavender rounded-full items-center justify-center flex-shrink-0">
              <Shield className="w-8 h-8 text-shnoor-indigo" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-0 sm:space-x-4 text-xs sm:text-sm text-shnoor-indigoMedium font-medium">
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
              Duration: {testDetails?.duration || 60} Minutes
            </span>
            <span className="hidden sm:inline">•</span>
            <span>Total Questions: {testDetails?.totalQuestions || 0}</span>
            <span className="hidden sm:inline">•</span>
            <span className="bg-shnoor-lavender px-2 py-0.5 rounded sm:bg-transparent sm:px-0 sm:py-0 font-bold sm:font-medium text-shnoor-navy sm:text-shnoor-indigoMedium">Full Screen Required</span>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {rules.map((rule, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-shnoor-mist p-4 sm:p-6 flex flex-col xl:flex-row items-start gap-4 hover:shadow-[0_8px_30px_rgba(14,14,39,0.08)] hover:border-shnoor-indigo transition-all duration-200"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-[#F8F8FB] rounded-lg flex items-center justify-center">
                {rule.icon}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-shnoor-navy mb-1">{rule.title}</h3>
                <p className="text-shnoor-indigoMedium leading-relaxed text-xs sm:text-sm">{rule.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Warning Box */}
        <div className="bg-shnoor-dangerLight border-l-4 border-shnoor-danger rounded-r-xl p-6 mb-8 border border-y-shnoor-dangerLight border-r-shnoor-dangerLight shadow-sm">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-shnoor-danger mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-lg font-bold text-shnoor-danger mb-2">Important Warning</h4>
              <p className="text-shnoor-danger text-sm leading-relaxed">
                Any attempt to cheat, switch tabs, or exit fullscreen mode will be recorded.
                After 3 warnings, your test will be automatically submitted with your current progress.
                Please ensure you are in a quiet environment with no distractions before starting.
              </p>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-mist p-4 sm:p-8">
          <label className="flex items-start space-x-3 cursor-pointer group">
            <div className="flex-shrink-0 mt-1">
              <input
                type="checkbox"
                checked={hasRead}
                onChange={(e) => setHasRead(e.target.checked)}
                className="w-5 h-5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-shnoor-indigo cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <span className="text-shnoor-navy font-bold group-hover:text-shnoor-indigo transition-colors flex items-center text-sm sm:text-base">
                I have read and understood all the instructions
              </span>
              <p className="text-xs sm:text-sm text-shnoor-indigoMedium mt-1">
                By checking this box, you agree to abide by the examination rules and regulations.
              </p>
            </div>
          </label>

          <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-between pt-6 border-t border-shnoor-mist gap-4 sm:gap-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-6 py-3 text-shnoor-indigoMedium hover:text-shnoor-navy font-bold transition-colors"
            >
              ← Back to Dashboard
            </button>

            <button
              onClick={handleStartExam}
              disabled={!hasRead}
              className={`
                w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-200
                ${hasRead
                  ? hasProgress
                    ? 'bg-shnoor-success hover:bg-shnoor-success text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    : 'bg-shnoor-indigo hover:bg-[#4d4d9c] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                  : 'bg-shnoor-mist/30 text-shnoor-indigoMedium cursor-not-allowed'}
              `}
            >
              {hasRead
                ? hasProgress
                  ? '▶ Resume Examination →'
                  : 'Start Examination →'
                : 'Please Read Instructions First'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructions;