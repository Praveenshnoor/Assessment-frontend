import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../hooks/useTimer';
import { useFullscreen } from '../hooks/useFullscreen';
import { useTabSwitch } from '../hooks/useTabSwitch';
import { useProctoringSimple } from '../hooks/useProctoringSimple';
import FullscreenWarning from '../components/FullscreenWarning';
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  Monitor
} from 'lucide-react';

// Questions will be fetched from API

const TestScreen = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [visited, setVisited] = useState(new Set([0]));
  const [warningCount, setWarningCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [initialTimeRemaining, setInitialTimeRemaining] = useState(3600); // Default 60 minutes in seconds

  const {
    isFullscreen,
    showWarning,
    enterFullscreen
  } = useFullscreen();

  // Handle auto-submit on time up
  const handleTimeUp = useCallback(() => {
    // Will be called by submitTest
  }, []);

  const { timeLeft, formattedTime, stopTimer } = useTimer(
    initialTimeRemaining, 
    handleTimeUp
  );

  // Handle camera loss - force exit exam
  const handleCameraLost = useCallback((reason) => {
    alert(`⚠️ ${reason}\n\nYour exam has been terminated.`);
    stopTimer();
    
    // Clear test data
    localStorage.removeItem('selectedTestId');
    
    // Navigate back to dashboard
    navigate('/dashboard', { 
      replace: true,
      state: { 
        message: 'Exam terminated due to camera issue',
        type: 'error'
      }
    });
  }, [navigate, stopTimer]);

  // Proctoring hook - pass camera loss handler
  const {
    startProctoring,
    stopProctoring,
  } = useProctoringSimple(handleCameraLost);

  // Submit test function - defined early so it can be used by other callbacks
  const submitTest = useCallback(async (reason = 'manual') => {
    stopTimer();
    
    // IMPORTANT: Stop proctoring immediately when test ends
    stopProctoring();

    const testId = localStorage.getItem('selectedTestId');
    const token = localStorage.getItem('studentAuthToken');

    console.log('=== SUBMITTING TEST ===');
    console.log('Test ID:', testId);
    console.log('Answers:', answers);
    console.log('Reason:', reason);
    console.log('Proctoring stopped');

    try {
      // Submit to backend
      const response = await fetch('/api/student/submit-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          testId: testId,
          answers: answers,
          submissionReason: reason,
          warningCount: warningCount,
          timeRemaining: timeLeft
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        // Clear test-specific data
        localStorage.removeItem('selectedTestId');

        // Navigate to results with backend response
        navigate('/result', {
          state: {
            result: data.result,
            submissionReason: reason
          }
        });
      } else {
        alert('Failed to submit exam: ' + data.message);
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Error submitting exam. Please try again.');
    }
  }, [answers, warningCount, timeLeft, stopTimer, navigate, stopProctoring]);

  // Update handleTimeUp to use submitTest
  useEffect(() => {
    if (timeLeft === 0) {
      submitTest('time_up');
    }
  }, [timeLeft, submitTest]);

  // Handle tab switch
  const handleTabSwitch = useCallback((count, max) => {
    setWarningCount(count);
    setShowTabWarning(true);

    if (count >= max) {
      // Final warning - auto submit
      alert(`[FINAL WARNING] ${count}/${max}\n\nYou have exceeded the maximum number of tab switches!\n\nYour test will be submitted automatically now.`);
      
      // Auto-submit the test immediately
      setTimeout(() => {
        submitTest('tab_switch_violation');
      }, 100);
    } else {
      // Regular warning
      alert(`[WARNING] ${count}/${max}\n\nDo not switch tabs during the examination!\n\nPlease return to the test immediately.`);
      
      // Hide warning modal after 3 seconds
      setTimeout(() => setShowTabWarning(false), 3000);
    }
  }, [submitTest]);

  useTabSwitch(handleTabSwitch, 3);

  // Manual save function - only called when user clicks Save & Next or Skip
  const saveProgressNow = useCallback(async () => {
    const token = localStorage.getItem('studentAuthToken');
    const testId = localStorage.getItem('selectedTestId');

    if (!token || !testId || questions.length === 0) return;

    try {
      const payload = {
        testId: parseInt(testId),
        answers: answers,
        currentQuestion: currentQuestion,
        markedForReview: Array.from(markedForReview),
        visitedQuestions: Array.from(visited),
        timeRemaining: timeLeft,
        warningCount: warningCount
      };
      
      console.log('💾 Saving progress manually');
      
      const response = await fetch('/api/student/save-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log('✅ Progress saved');
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to save progress:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  }, [answers, currentQuestion, markedForReview, visited, timeLeft, warningCount, questions.length]);

  // NO AUTO-SAVE - Removed debounced auto-save
  // Progress only saves when user clicks Save & Next or Skip buttons

  // Security: Prevent copy-paste and right click
  useEffect(() => {
    const preventAction = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', preventAction);
    document.addEventListener('copy', preventAction);
    document.addEventListener('cut', preventAction);
    document.addEventListener('paste', preventAction);

    // Prevent keyboard shortcuts
    const preventKeys = (e) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('keydown', preventKeys);

    // Check authentication and fetch questions
    const fetchData = async () => {
      const token = localStorage.getItem('studentAuthToken');
      const testId = localStorage.getItem('selectedTestId');

      if (!token || !testId) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`/api/student/test/${testId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load test');
        }

        const data = await response.json();
        if (data.success && data.test && data.test.questions) {
          setQuestions(data.test.questions);
          
          // Get test duration from backend
          const duration = data.test.duration || 60;
          
          // Load saved progress if available
          if (data.savedProgress) {
            console.log('Loading saved progress:', data.savedProgress);
            setAnswers(data.savedProgress.answers || {});
            setCurrentQuestion(data.savedProgress.currentQuestion || 0);
            setMarkedForReview(new Set(data.savedProgress.markedForReview || []));
            setVisited(new Set(data.savedProgress.visitedQuestions || [0]));
            setWarningCount(data.savedProgress.warningCount || 0);
            
            // Set time remaining from saved progress (in seconds)
            if (data.savedProgress.timeRemaining) {
              setInitialTimeRemaining(data.savedProgress.timeRemaining);
            } else {
              setInitialTimeRemaining(duration * 60); // Convert minutes to seconds
            }
          } else {
            // No saved progress, use full duration
            setInitialTimeRemaining(duration * 60);
          }

          // Initialize proctoring with proper error handling
          // Get student data from localStorage (stored as separate items)
          const studentId = localStorage.getItem('studentId') || 'unknown';
          const studentName = localStorage.getItem('studentName') || 'Student';
          
          console.log('[Proctoring] Student ID:', studentId);
          console.log('[Proctoring] Student Name:', studentName);
          console.log('[Proctoring] Starting proctoring for:', studentName);
          
          try {
            const proctoringResult = await startProctoring({
              studentId: studentId,
              studentName: studentName,
              testId: testId,
              testTitle: data.test.title,
            });
            
            if (proctoringResult.success) {
              console.log('[Proctoring] Successfully started');
            } else {
              console.error('[Proctoring] Failed to start:', proctoringResult.error);
              // Don't block test if proctoring fails, just log it
            }
          } catch (proctoringErr) {
            console.error('[Proctoring] Error starting proctoring:', proctoringErr);
            // Don't block test if proctoring fails
          }
        } else {
          throw new Error('Invalid test data');
        }
      } catch (err) {
        console.error('Error fetching test:', err);
        setError('Failed to load assessment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    // Warn before unload
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      // Stop proctoring when browser is closing
      stopProctoring();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Block browser back button during exam
    const blockBackButton = (e) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
      
      // Confirm if user really wants to exit
      const confirmExit = window.confirm(
        '⚠️ Warning: Going back will exit the exam!\n\n' +
        'Your progress will be saved, but you will need to resume the exam.\n\n' +
        'Are you sure you want to exit?'
      );
      
      if (confirmExit) {
        // Stop proctoring and save progress before exiting
        stopProctoring();
        navigate('/dashboard', { replace: true });
      }
    };
    
    // Push initial state and listen for popstate
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBackButton);

    // Handle visibility change (tab switch, minimize, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[Proctoring] Page hidden - stopping proctoring');
        stopProctoring();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    fetchData();

    return () => {
      document.removeEventListener('contextmenu', preventAction);
      document.removeEventListener('copy', preventAction);
      document.removeEventListener('cut', preventAction);
      document.removeEventListener('paste', preventAction);
      document.removeEventListener('keydown', preventKeys);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', blockBackButton);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Stop proctoring when leaving test
      stopProctoring();
    };
  }, [navigate, stopProctoring]);

  const handleAnswerSelect = (optionIndex) => {
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [currentQuestion]: optionIndex
      };
      return newAnswers;
    });
  };

  const handleNavigate = (index) => {
    setCurrentQuestion(index);
    setVisited(prev => new Set([...prev, index]));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      handleNavigate(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      handleNavigate(currentQuestion - 1);
    }
  };

  const toggleMarkForReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion);
      } else {
        newSet.add(currentQuestion);
      }
      return newSet;
    });
  };

  const getQuestionStatus = (index) => {
    if (answers[index] !== undefined) return 'answered';
    if (markedForReview.has(index)) return 'review';
    if (visited.has(index)) return 'visited';
    return 'not-visited';
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error || 'No questions found for this test.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Fullscreen Warning Modal */}
      {showWarning && (
        <FullscreenWarning onEnterFullscreen={enterFullscreen} />
      )}

      {/* Tab Switch Warning */}
      {showTabWarning && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl animate-pulse">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={20} />
            <span className="font-bold">Warning {warningCount}/3: Tab Switch Detected!</span>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">EX</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Java Programming Mock Test</h1>
                <p className="text-xs text-gray-500">Question {currentQuestion + 1} of {questions.length}</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Timer */}
              <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="text-xl font-mono font-bold text-gray-900">{formattedTime}</span>
              </div>

              {/* Fullscreen indicator */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isFullscreen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <Monitor size={18} />
                <span className="text-sm font-medium hidden sm:inline">
                  {isFullscreen ? 'Fullscreen' : 'Exit FS'}
                </span>
              </div>

              {/* Timer and Info - Submit button removed, now floating at bottom-right */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Question Palette */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, index) => {
                const status = getQuestionStatus(index);
                let bgClass = 'bg-gray-100 text-gray-600'; // not-visited
                if (status === 'answered') bgClass = 'bg-green-500 text-white';
                else if (status === 'review') bgClass = 'bg-yellow-500 text-white';
                else if (status === 'visited') bgClass = 'bg-gray-300 text-gray-700';

                return (
                  <button
                    key={index}
                    onClick={() => handleNavigate(index)}
                    className={`
                      w-10 h-10 rounded-lg font-semibold text-sm transition-all
                      ${bgClass}
                      ${currentQuestion === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                      hover:opacity-80
                    `}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600">Answered ({Object.keys(answers).length})</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-gray-600">Marked for Review ({markedForReview.size})</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span className="text-gray-600">Visited</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-gray-600">Not Visited</span>
            </div>
          </div>

          <div className="mt-auto p-4 bg-blue-50 border-t border-blue-100">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                Warning count: <span className="font-bold">{warningCount}/3</span>
                <br />
                {warningCount > 0 && "Avoid switching tabs!"}
              </p>
            </div>
          </div>
        </aside>

        {/* Main Question Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <span className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold">
                    Q{currentQuestion + 1}
                  </span>
                  {markedForReview.has(currentQuestion) && (
                    <span className="flex items-center space-x-1 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm font-medium">
                      <Flag size={14} />
                      <span>Marked for Review</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleMarkForReview}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
                    ${markedForReview.has(currentQuestion)
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  `}
                >
                  <Flag size={18} />
                  <span>{markedForReview.has(currentQuestion) ? 'Unmark' : 'Mark for Review'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <label
                    key={index}
                    className={`
                      flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${answers[currentQuestion] === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                    `}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      checked={answers[currentQuestion] === index}
                      onChange={() => handleAnswerSelect(index)}
                      className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-4 text-gray-700 font-medium">{option}</span>
                    {answers[currentQuestion] === index && (
                      <CheckCircle className="ml-auto w-5 h-5 text-blue-600" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors
                  ${currentQuestion === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'}
                `}
              >
                <ChevronLeft size={20} />
                <span>Previous</span>
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={async () => {
                    handleAnswerSelect(undefined);
                    await saveProgressNow(); // Save before skipping
                    handleNext();
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Skip
                </button>

                <button
                  onClick={async () => {
                    if (answers[currentQuestion] !== undefined) {
                      await saveProgressNow(); // Save before moving to next
                      handleNext();
                    } else {
                      alert('Please select an answer or click Skip');
                    }
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
                >
                  <span>Save & Next</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Finish Test Button - Bottom Right */}
      <button
        onClick={() => {
          if (window.confirm('Are you sure you want to finish and submit the test? This action cannot be undone.')) {
            submitTest('manual');
          }
        }}
        className="fixed bottom-4 right-4 z-40 flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-2xl transition-all hover:scale-105 border-2 border-red-700"
      >
        <CheckCircle size={20} />
        <span>Finish Test</span>
      </button>
    </div>
  );
};

export default TestScreen;