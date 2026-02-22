import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../hooks/useTimer';
import { useFullscreen } from '../hooks/useFullscreen';
import { useTabSwitch } from '../hooks/useTabSwitch';
import { useProctoringWithAI } from '../hooks/useProctoringWithAI';
import FullscreenWarning from '../components/FullscreenWarning';
import AIViolationAlert from '../components/AIViolationAlert';
import Editor from '@monaco-editor/react';
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  Monitor,
  Shield
} from 'lucide-react';
import { apiFetch } from '../config/api';
import codeExecutionAPI from '../services/codeExecutionAPI';

// Questions will be fetched from API

const TestScreen = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [codingConsoleOutput, setCodingConsoleOutput] = useState({}); // Store console output per question
  const [markedForReview, setMarkedForReview] = useState(new Set());
  
  // Resizable panel states
  const [leftPanelWidth, setLeftPanelWidth] = useState(33); // percentage
  const [consolePanelHeight, setConsolePanelHeight] = useState(256); // pixels
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const [isResizingVertical, setIsResizingVertical] = useState(false);

  // Starter code templates for each language
  const getStarterCode = (language) => {
    const templates = {
      java: `public class Solution {
    public static void main(String[] args) {
        // Write your code here
        System.out.println("Hello World");
    }
}`,
      python: `def solution():
    # Write your code here
    print("Hello World")

if __name__ == "__main__":
    solution()`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    cout << "Hello World" << endl;
    return 0;
}`
    };
    return templates[language] || templates.java;
  };
  const [visited, setVisited] = useState(new Set([0]));
  const [warningCount, setWarningCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [initialTimeRemaining, setInitialTimeRemaining] = useState(3600); // Default 60 minutes in seconds
  const [hasStarted, setHasStarted] = useState(false);
  const [testDetails, setTestDetails] = useState(null);
  const [currentAIViolation, setCurrentAIViolation] = useState(null);
  const [aiViolationCount, setAiViolationCount] = useState(0);

  // Calculate total questions (MCQ + Coding)
  const totalQuestions = questions.length + codingQuestions.length;

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

  // Handle AI violations
  const handleAIViolation = useCallback((violation) => {
    console.log('[AI Violation Detected]', violation);
    
    // Show alert to student
    setCurrentAIViolation(violation);
    setAiViolationCount(prev => prev + 1);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setCurrentAIViolation(null);
    }, 5000);
    
    // If too many high-severity violations, terminate exam
    if (violation.severity === 'high') {
      const highSeverityCount = aiViolationCount + 1;
      
      if (highSeverityCount >= 5) {
        alert('⚠️ EXAM TERMINATED\n\nMultiple cheating attempts detected by AI monitoring system.\n\nYour exam has been flagged and submitted automatically.');
        submitTest('ai_violation_limit');
      }
    }
  }, [aiViolationCount]);

  // Proctoring hook with AI - pass camera loss and AI violation handlers
  const {
    startProctoring,
    stopProctoring,
    isModelLoaded,
    detectionActive,
    violations,
    microphonePermissionGranted
  } = useProctoringWithAI(handleCameraLost, handleAIViolation);

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
      const response = await apiFetch('api/student/submit-exam', {
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
        // Store testId for feedback submission
        localStorage.setItem('lastTestId', testId);
        
        // Get studentId for feedback
        const studentId = localStorage.getItem('studentId');
        
        // Clear test-specific data
        localStorage.removeItem('selectedTestId');

        // Navigate to results with backend response, testId, and studentId
        navigate('/result', {
          state: {
            result: { 
              ...data.result, 
              testId: parseInt(testId), 
              studentId: studentId 
            },
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
    if (timeLeft === 0 && hasStarted) {
      submitTest('time_up');
    }
  }, [timeLeft, submitTest, hasStarted]);

  // Handle tab switch
  const handleTabSwitch = useCallback((count, max) => {
    // Don't count tab switches before exam starts
    if (!hasStarted) {
      console.log('[Tab Switch] Ignored - exam not started yet');
      return;
    }

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
  }, [submitTest, hasStarted]);

  useTabSwitch(handleTabSwitch, 3);

  // Handle start exam - triggers fullscreen and proctoring
  const handleStartExam = async () => {
    console.log('[Start Exam] User clicked start button');
    
    // Initialize proctoring with proper error handling
    const studentId = localStorage.getItem('studentId') || 'unknown';
    const studentName = localStorage.getItem('studentName') || 'Student';
    const testId = localStorage.getItem('selectedTestId');

    console.log('[Proctoring] Student ID:', studentId);
    console.log('[Proctoring] Student Name:', studentName);
    console.log('[Proctoring] Starting proctoring for:', studentName);

    try {
      const proctoringResult = await startProctoring({
        studentId: studentId,
        studentName: studentName,
        testId: testId,
        testTitle: testDetails?.title || 'Test',
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

    // Enter fullscreen mode
    console.log('[Fullscreen] Requesting fullscreen mode...');
    try {
      await enterFullscreen();
      console.log('[Fullscreen] Fullscreen mode activated');
    } catch (fullscreenErr) {
      console.error('[Fullscreen] Failed to enter fullscreen:', fullscreenErr);
      // Don't block test if fullscreen fails - the warning modal will show
    }

    // Mark exam as started
    setHasStarted(true);
  };



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
      
      const response = await apiFetch('api/student/save-progress', {
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
        const response = await apiFetch(`api/student/test/${testId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load test');
        }

        const data = await response.json();
        if (data.success && data.test && data.test.questions) {
          console.log('Test data received:', data.test);
          console.log('MCQ Questions:', data.test.questions.length);
          console.log('Coding Questions:', data.test.codingQuestions);
          
          setQuestions(data.test.questions);
          setCodingQuestions(data.test.codingQuestions || []);
          
          // Store test details for instruction screen
          setTestDetails({
            title: data.test.title || 'Assessment',
            duration: data.test.duration || 60,
            totalQuestions: data.test.questions.length + (data.test.codingQuestions?.length || 0)
          });

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
            
            // If there's saved progress, user has already started
            setHasStarted(true);
            
            // Resume proctoring and fullscreen for resumed exams
            const studentId = localStorage.getItem('studentId') || 'unknown';
            const studentName = localStorage.getItem('studentName') || 'Student';

            try {
              const proctoringResult = await startProctoring({
                studentId: studentId,
                studentName: studentName,
                testId: testId,
                testTitle: data.test.title,
              });

              if (proctoringResult.success) {
                console.log('[Proctoring] Successfully resumed');
              }
            } catch (proctoringErr) {
              console.error('[Proctoring] Error resuming proctoring:', proctoringErr);
            }

            try {
              // Enter fullscreen on resume
              await enterFullscreen();
              console.log('[Fullscreen] Fullscreen mode activated on resume');
            } catch (fullscreenErr) {
              console.error('[Fullscreen] Failed to resume fullscreen:', fullscreenErr);
              // Don't block - the warning modal will show
            }
          } else {
            // No saved progress, use full duration
            setInitialTimeRemaining(duration * 60);
            // Redirect to instructions page for first-time users
            console.log('[TestScreen] No saved progress found - redirecting to instructions');
            navigate('/instructions', { replace: true });
            return;
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
    // Note: We don't restart proctoring on visibility change to avoid request loops
    // The proctoring hook handles camera state internally
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[Proctoring] Page hidden');
      } else {
        console.log('[Proctoring] Page visible again');
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
    if (currentQuestion < totalQuestions - 1) {
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

  // Horizontal resize handler (left panel width)
  const handleHorizontalMouseDown = (e) => {
    e.preventDefault();
    setIsResizingHorizontal(true);
  };

  useEffect(() => {
    const handleHorizontalMouseMove = (e) => {
      if (!isResizingHorizontal) return;
      
      const container = document.querySelector('.coding-container');
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Limit between 20% and 50%
      if (newWidth >= 20 && newWidth <= 50) {
        setLeftPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingHorizontal(false);
    };

    if (isResizingHorizontal) {
      document.addEventListener('mousemove', handleHorizontalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleHorizontalMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingHorizontal]);

  // Vertical resize handler (console height)
  const handleVerticalMouseDown = (e) => {
    e.preventDefault();
    setIsResizingVertical(true);
  };

  useEffect(() => {
    const handleVerticalMouseMove = (e) => {
      if (!isResizingVertical) return;
      
      const container = document.querySelector('.code-editor-container');
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      
      // Limit between 100px and 500px
      if (newHeight >= 100 && newHeight <= 500) {
        setConsolePanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingVertical(false);
    };

    if (isResizingVertical) {
      document.addEventListener('mousemove', handleVerticalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleVerticalMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingVertical]);

  const getQuestionStatus = (index) => {
    const isAnswered = answers[index] !== undefined;
    const isMarked = markedForReview.has(index);
    
    // If marked for review, always show yellow regardless of answer status
    if (isMarked) return 'review';
    // Only show green if answered AND not marked
    if (isAnswered) return 'answered';
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

  if (error || totalQuestions === 0) {
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

  // Determine if current question is MCQ or Coding
  const isCodingQuestion = currentQuestion >= questions.length;
  const currentQ = isCodingQuestion 
    ? codingQuestions[currentQuestion - questions.length]
    : questions[currentQuestion];

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

      {/* AI Violation Alert */}
      {currentAIViolation && (
        <AIViolationAlert 
          violation={currentAIViolation}
          onDismiss={() => setCurrentAIViolation(null)}
        />
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
                <p className="text-xs text-gray-500">Question {currentQuestion + 1} of {totalQuestions}</p>
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

              {/* AI Detection Status */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                detectionActive 
                  ? 'bg-blue-100 text-blue-700' 
                  : isModelLoaded 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'bg-gray-100 text-gray-500'
              }`}>
                <Shield size={18} />
                <span className="text-sm font-medium hidden sm:inline">
                  {detectionActive 
                    ? 'AI Active' 
                    : isModelLoaded 
                      ? 'AI Ready' 
                      : 'Loading AI...'}
                </span>
                {!isModelLoaded && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                )}
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
            
            {/* MCQ Questions */}
            {questions.length > 0 && (
              <>
                <p className="text-xs text-gray-500 mb-2">MCQ Questions</p>
                <div className="grid grid-cols-5 gap-2 mb-4">
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
              </>
            )}

            {/* Coding Questions */}
            {codingQuestions.length > 0 && (
              <>
                <p className="text-xs text-gray-500 mb-2">Coding Questions</p>
                <div className="grid grid-cols-5 gap-2">
                  {codingQuestions.map((_, index) => {
                    const actualIndex = questions.length + index;
                    const status = getQuestionStatus(actualIndex);
                    let bgClass = 'bg-gray-100 text-gray-600'; // not-visited
                    if (status === 'answered') bgClass = 'bg-purple-500 text-white';
                    else if (status === 'review') bgClass = 'bg-yellow-500 text-white';
                    else if (status === 'visited') bgClass = 'bg-gray-300 text-gray-700';

                    return (
                      <button
                        key={actualIndex}
                        onClick={() => handleNavigate(actualIndex)}
                        className={`
                          w-10 h-10 rounded-lg font-semibold text-sm transition-all
                          ${bgClass}
                          ${currentQuestion === actualIndex ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
                          hover:opacity-80
                        `}
                      >
                        C{index + 1}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Summary</div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600">Answered ({Object.keys(answers).filter(key => !markedForReview.has(parseInt(key))).length})</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-gray-600">Marked for Review ({markedForReview.size})</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span className="text-gray-600">Not Answered ({totalQuestions - Object.keys(answers).length})</span>
            </div>
          </div>

          <div className="mt-auto p-4 bg-blue-50 border-t border-blue-100">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  Tab switches: <span className="font-bold">{warningCount}/3</span>
                  <br />
                  {warningCount > 0 && "Avoid switching tabs!"}
                </p>
              </div>
              
              {/* AI Violation Summary */}
              {(violations.multipleFaces > 0 || violations.noFace > 0 || violations.phoneDetected > 0) && (
                <div className="pt-2 border-t border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-1">AI Detections:</p>
                  {violations.multipleFaces > 0 && (
                    <p className="text-xs text-red-700">• Multiple faces: {violations.multipleFaces}</p>
                  )}
                  {violations.noFace > 0 && (
                    <p className="text-xs text-orange-700">• Face absent: {violations.noFace}</p>
                  )}
                  {violations.phoneDetected > 0 && (
                    <p className="text-xs text-red-700">• Phone detected: {violations.phoneDetected}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Question Area - MCQ */}
        {!isCodingQuestion && (
          <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
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

              {/* Question Content - MCQ or Coding */}
              {!isCodingQuestion ? (
                <>
                  {/* MCQ Question Text */}
                  <div className="mb-8">
                    <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
                      {currentQ.question}
                    </p>
                  </div>

                  {/* MCQ Options */}
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
                </>
              ) : null}
            </div>

            {/* Navigation Buttons - Only for MCQ */}
            {!isCodingQuestion && (
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
            )}
          </div>
        </main>
        )}

        {/* Coding Question - Split Screen Layout */}
        {isCodingQuestion && (
          <main className="flex-1 flex bg-gray-100 overflow-hidden coding-container">
            {/* Left Panel - Problem Description */}
            <div 
              className="bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0"
              style={{ width: `${leftPanelWidth}%`, minWidth: '20%', maxWidth: '50%' }}
            >
              <div className="p-6">
                {/* Title */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{currentQ.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                      MEDIUM
                    </span>
                  </div>
                </div>

                    {/* Description */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h4>
                      <div className="text-gray-700 text-sm leading-relaxed">
                        <pre className="whitespace-pre-wrap font-sans">{currentQ.description}</pre>
                      </div>
                    </div>

                    {/* Examples */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Examples</h4>
                      <div className="space-y-4">
                        {currentQ.testCases && currentQ.testCases.map((testCase, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Input</p>
                              <div className="bg-gray-800 text-gray-100 p-3 rounded font-mono text-sm">
                                {testCase.input}
                              </div>
                            </div>
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Output</p>
                              <div className="bg-gray-800 text-gray-100 p-3 rounded font-mono text-sm">
                                {testCase.output}
                              </div>
                            </div>
                            {testCase.explanation && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Explanation</p>
                                <p className="text-sm text-gray-600">{testCase.explanation}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horizontal Resize Handle */}
                <div
                  className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
                  onMouseDown={handleHorizontalMouseDown}
                  style={{ cursor: 'col-resize' }}
                />

                {/* Right Panel - Code Editor */}
                <div className="flex-1 flex flex-col bg-gray-900 code-editor-container min-w-0">
                  {/* Editor Header */}
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                    <select
                      value={answers[currentQuestion]?.language || 'java'}
                      onChange={(e) => {
                        const newLanguage = e.target.value;
                        setAnswers(prev => {
                          const currentAnswer = prev[currentQuestion] || {};
                          const currentLang = currentAnswer.language || 'java';
                          
                          const updatedCodes = {
                            ...currentAnswer.codes,
                            [currentLang]: currentAnswer.code || currentAnswer.codes?.[currentLang] || getStarterCode(currentLang)
                          };
                          
                          const newCode = updatedCodes[newLanguage] || getStarterCode(newLanguage);
                          
                          return {
                            ...prev,
                            [currentQuestion]: {
                              language: newLanguage,
                              code: newCode,
                              codes: updatedCodes
                            }
                          };
                        });
                      }}
                      className="px-3 py-1.5 bg-gray-700 text-gray-200 text-sm rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="java">Java</option>
                      <option value="python">Python</option>
                      <option value="cpp">C++</option>
                    </select>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={async () => {
                          const currentAnswer = answers[currentQuestion];
                          const currentLang = currentAnswer?.language || 'java';
                          const currentCode = currentAnswer?.code || currentAnswer?.codes?.[currentLang] || getStarterCode(currentLang);
                          
                          if (!currentCode.trim()) {
                            alert('Please write some code first!');
                            return;
                          }

                          setCodingConsoleOutput(prev => ({
                            ...prev,
                            [currentQuestion]: {
                              running: true,
                              results: []
                            }
                          }));
                          
                          try {
                            // Get test cases for this question
                            const testCases = currentQ.testCases || currentQ.publicTestCases || [];
                            
                            if (testCases.length === 0) {
                              // No test cases, just run the code
                              const result = await codeExecutionAPI.executeCode(currentCode, currentLang);
                              
                              setCodingConsoleOutput(prev => ({
                                ...prev,
                                [currentQuestion]: {
                                  running: false,
                                  results: [{
                                    testCase: 1,
                                    input: 'No input',
                                    expectedOutput: 'N/A',
                                    actualOutput: result.output || result.error,
                                    passed: result.success,
                                    executionTime: result.executionTime + 'ms',
                                    error: result.error
                                  }],
                                  timestamp: new Date().toLocaleTimeString()
                                }
                              }));
                            } else {
                              // Run against test cases
                              const evaluation = await codeExecutionAPI.evaluateWithTestCases(
                                currentCode, 
                                currentLang, 
                                testCases.map(tc => ({
                                  input: tc.input,
                                  expected_output: tc.output || tc.expectedOutput,
                                  is_hidden: tc.isHidden || false
                                }))
                              );
                              
                              const results = evaluation.testResults.map((result, idx) => ({
                                testCase: idx + 1,
                                input: result.input,
                                expectedOutput: result.expectedOutput,
                                actualOutput: result.actualOutput,
                                passed: result.passed,
                                executionTime: result.executionTime + 'ms',
                                error: result.error
                              }));
                              
                              setCodingConsoleOutput(prev => ({
                                ...prev,
                                [currentQuestion]: {
                                  running: false,
                                  results: results,
                                  summary: evaluation.summary,
                                  timestamp: new Date().toLocaleTimeString()
                                }
                              }));
                            }
                          } catch (error) {
                            console.error('Code execution error:', error);
                            setCodingConsoleOutput(prev => ({
                              ...prev,
                              [currentQuestion]: {
                                running: false,
                                results: [{
                                  testCase: 1,
                                  input: 'Error',
                                  expectedOutput: 'N/A',
                                  actualOutput: error.message,
                                  passed: false,
                                  executionTime: '0ms',
                                  error: error.message
                                }],
                                timestamp: new Date().toLocaleTimeString()
                              }
                            }));
                          }
                        }}
                        disabled={codingConsoleOutput[currentQuestion]?.running}
                        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <span>▶</span>
                        <span>{codingConsoleOutput[currentQuestion]?.running ? 'Running...' : 'Run'}</span>
                      </button>
                      <button 
                        onClick={async () => {
                          const currentAnswer = answers[currentQuestion];
                          const currentLang = currentAnswer?.language || 'java';
                          const currentCode = currentAnswer?.code || currentAnswer?.codes?.[currentLang] || getStarterCode(currentLang);
                          
                          if (!currentCode.trim()) {
                            alert('Please write some code first!');
                            return;
                          }

                          // Save the coding answer
                          setAnswers(prev => ({
                            ...prev,
                            [currentQuestion]: {
                              ...currentAnswer,
                              language: currentLang,
                              code: currentCode,
                              codes: {
                                ...currentAnswer?.codes,
                                [currentLang]: currentCode
                              },
                              submitted: true,
                              submittedAt: new Date().toISOString()
                            }
                          }));

                          // Save progress to backend
                          await saveProgressNow();
                          alert('Code submitted successfully!');
                        }}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium transition-colors"
                      >
                        Submit
                      </button>
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div className="flex-1 overflow-hidden">
                    <Editor
                      height="100%"
                      language={(() => {
                        const currentAnswer = answers[currentQuestion];
                        const lang = currentAnswer?.language || 'java';
                        // Map to Monaco language identifiers
                        return lang === 'cpp' ? 'cpp' : lang;
                      })()}
                      value={(() => {
                        const currentAnswer = answers[currentQuestion];
                        if (!currentAnswer) {
                          return getStarterCode('java');
                        }
                        const currentLang = currentAnswer.language || 'java';
                        return currentAnswer.code || currentAnswer.codes?.[currentLang] || getStarterCode(currentLang);
                      })()}
                      onChange={(value) => {
                        setAnswers(prev => {
                          const currentAnswer = prev[currentQuestion] || {};
                          const currentLang = currentAnswer.language || 'java';
                          
                          return {
                            ...prev,
                            [currentQuestion]: {
                              ...currentAnswer,
                              language: currentLang,
                              code: value,
                              codes: {
                                ...currentAnswer.codes,
                                [currentLang]: value
                              }
                            }
                          };
                        });
                      }}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap: 'off',
                        autoClosingBrackets: 'always',
                        autoClosingQuotes: 'always',
                        formatOnPaste: true,
                        formatOnType: true,
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: 'on',
                        quickSuggestions: true,
                        parameterHints: { enabled: true },
                        bracketPairColorization: { enabled: true },
                        guides: {
                          bracketPairs: true,
                          indentation: true
                        }
                      }}
                    />
                  </div>

                  {/* Vertical Resize Handle */}
                  <div
                    className="h-1 bg-gray-700 hover:bg-blue-500 cursor-row-resize flex-shrink-0 transition-colors"
                    onMouseDown={handleVerticalMouseDown}
                    style={{ cursor: 'row-resize' }}
                  />

                  {/* Test Cases / Console Tabs */}
                  <div 
                    className="border-t border-gray-700 flex flex-col"
                    style={{ height: `${consolePanelHeight}px` }}
                  >
                    <div className="flex items-center space-x-4 px-4 py-2 bg-gray-800 border-b border-gray-700">
                      <button className="text-sm font-medium text-blue-400 border-b-2 border-blue-400 pb-2">
                        Test Cases
                      </button>
                      <button className="text-sm font-medium text-gray-400 hover:text-gray-200 pb-2">
                        Console
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-800">
                      {codingConsoleOutput[currentQuestion]?.running ? (
                        <div className="flex items-center space-x-2 text-yellow-400">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                          <span className="text-sm">Running test cases...</span>
                        </div>
                      ) : codingConsoleOutput[currentQuestion]?.results ? (
                        <div className="space-y-3">
                          {/* Summary */}
                          {codingConsoleOutput[currentQuestion]?.summary && (
                            <div className="mb-4 p-3 bg-gray-700 rounded border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-200">Test Results Summary</span>
                                <span className="text-xs text-gray-400">
                                  {codingConsoleOutput[currentQuestion].timestamp}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-400">
                                    {codingConsoleOutput[currentQuestion].summary.passedTestCases}
                                  </div>
                                  <div className="text-gray-400">Passed</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-red-400">
                                    {codingConsoleOutput[currentQuestion].summary.failedTestCases}
                                  </div>
                                  <div className="text-gray-400">Failed</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-400">
                                    {codingConsoleOutput[currentQuestion].summary.percentage}%
                                  </div>
                                  <div className="text-gray-400">Score</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Individual Test Results */}
                          {codingConsoleOutput[currentQuestion].results.map((result, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded border ${
                                result.passed
                                  ? 'bg-green-900/20 border-green-500'
                                  : 'bg-red-900/20 border-red-500'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-semibold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                                  TEST CASE {result.testCase}: {result.passed ? '✓ PASSED' : '✗ FAILED'}
                                </span>
                                <span className="text-xs text-gray-400">{result.executionTime}</span>
                              </div>
                              <div className="text-xs font-mono space-y-1">
                                <div>
                                  <span className="text-gray-400">Input: </span>
                                  <span className="text-gray-300">{result.input}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Expected: </span>
                                  <span className="text-gray-300">{result.expectedOutput}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Got: </span>
                                  <span className={result.passed ? 'text-green-400' : 'text-red-400'}>
                                    {result.actualOutput}
                                  </span>
                                </div>
                                {result.error && (
                                  <div>
                                    <span className="text-gray-400">Error: </span>
                                    <span className="text-red-400">{result.error}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 text-sm py-8">
                          Click "Run" to test your code
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-t border-gray-700">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handlePrevious}
                        disabled={currentQuestion === 0}
                        className={`
                          flex items-center space-x-2 px-4 py-2 rounded font-medium transition-colors
                          ${currentQuestion === 0
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'}
                        `}
                      >
                        <ChevronLeft size={18} />
                        <span>Previous</span>
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={currentQuestion >= totalQuestions - 1}
                        className={`
                          flex items-center space-x-2 px-4 py-2 rounded font-medium transition-colors
                          ${currentQuestion >= totalQuestions - 1
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'}
                        `}
                      >
                        <span>Next</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </main>
            )}
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