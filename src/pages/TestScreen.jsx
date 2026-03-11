import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../hooks/useTimer';
import { useFullscreen } from '../hooks/useFullscreen';
import { useTabSwitch } from '../hooks/useTabSwitch';
import { useProctoringWithAI } from '../hooks/useProctoringWithAI';
import FullscreenWarning from '../components/FullscreenWarning';
import AIViolationAlert from '../components/AIViolationAlert';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import StudentMessageAlert from '../components/student/StudentMessageAlert';
import StudentWarningsSidebar from '../components/student/StudentWarningsSidebar';
import Editor from '@monaco-editor/react';
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  StopCircle,
  XCircle
} from 'lucide-react';
import { apiFetch } from '../config/api';
// import codeExecutionAPI from '../services/codeExecutionAPI';

const TestScreen = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  // DISABLED: Coding questions feature
  // const [codingQuestions, setCodingQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  // DISABLED: Coding console output
  const [codingConsoleOutput, setCodingConsoleOutput] = useState({}); // Store console output per question
  const [markedForReview, setMarkedForReview] = useState(new Set());

  // Termination modal state
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [terminationData, setTerminationData] = useState(null);

  // Warnings sidebar state
  const [warningsSidebarCollapsed, setWarningsSidebarCollapsed] = useState(true);


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

  // Calculate total questions (MCQ only)
  const totalQuestions = questions.length;
  // DISABLED: Coding questions
  // const totalQuestions = questions.length + codingQuestions.length;

  // Helper function to format errors for display
  const formatErrorForDisplay = (error) => {
    if (!error) return '';

    // Clean up Docker noise for display only
    return error
      .replace(/docker run --rm --memory=256m.*$/gm, '')
      .replace(/Command failed with exit code \d+:\s*/g, '')
      .replace(/Error: Command failed:\s*/g, '')
      .replace(/^.*alpine.*$/gm, '')
      .replace(/\/app\//g, '')
      .replace(/^\s*[\r\n]/gm, '')
      .trim() || error;
  };

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

  // Handle forced test stop from admin
  const handleForceStop = useCallback((data) => {
    console.log('[Force Stop] Admin stopped test:', data);
    // Show termination modal with reason
    // Note: stopProctoring() will be called by submitTest() when user clicks "Continue"
    setTerminationData(data);
    setShowTerminationModal(true);
  }, []);

  // Proctoring hook with AI - pass camera loss and AI violation handlers
  const {
    startProctoring,
    stopProctoring,
    isModelLoaded,
    detectionActive,
    violations,
    microphonePermissionGranted,
    // Messaging functionality
    messages: proctoringMessages,
    currentMessage,
    dismissCurrentMessage,
    markAllAsRead,
    unreadCount
  } = useProctoringWithAI(handleCameraLost, handleAIViolation, null, handleForceStop);

  // Helper function to get the stored JWT session token
  const getValidToken = useCallback(async () => {
    // Simply return the stored JWT session token
    // No need to refresh - JWT tokens are valid for 7 days
    const token = localStorage.getItem('studentAuthToken');

    if (!token) {
      console.warn('[Token] No token found in localStorage');
    }

    return token;
  }, []);

  // Submit test function - defined early so it can be used by other callbacks
  const submitTest = useCallback(async (reason = 'manual') => {
    stopTimer();

    // IMPORTANT: Stop proctoring immediately when test ends
    stopProctoring();

    const testId = localStorage.getItem('selectedTestId');
    const studentId = localStorage.getItem('studentId');
    const token = localStorage.getItem('studentAuthToken');

    console.log('=== SUBMITTING TEST ===');
    console.log('Test ID:', testId);
    console.log('Student ID:', studentId);
    console.log('Has Token:', !!token);
    console.log('Answers:', answers);
    console.log('Reason:', reason);
    console.log('Proctoring stopped');

    try {
      // Build headers
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Submit to backend - include studentId so backend can skip token validation
      const response = await apiFetch('api/student/submit-exam', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          testId: testId,
          studentId: studentId, // Send student ID for progress-based auth
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

    const testId = localStorage.getItem('selectedTestId');
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
    // Get JWT session token from localStorage
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
      return false;
    }
  }, [answers, currentQuestion, markedForReview, visited, timeLeft, warningCount, questions.length]);

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
          // DISABLED: Coding questions
          // console.log('Coding Questions:', data.test.codingQuestions);

          setQuestions(data.test.questions);
          // DISABLED: Coding questions
          // setCodingQuestions(data.test.codingQuestions || []);

          // Store test details for instruction screen
          setTestDetails({
            title: data.test.title || 'Assessment',
            duration: data.test.duration || 60,
            totalQuestions: data.test.questions.length
            // DISABLED: Coding questions
            // totalQuestions: data.test.questions.length + (data.test.codingQuestions?.length || 0)
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
      <div className="h-screen bg-shnoor-lavender flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shnoor-indigo"></div>
      </div>
    );
  }

  if (error || totalQuestions === 0) {
    return (
      <div className="h-screen bg-shnoor-lavender flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-shnoor-light">
          <AlertTriangle className="mx-auto h-12 w-12 text-shnoor-danger mb-4" />
          <h2 className="text-xl font-bold text-shnoor-navy mb-2">Error</h2>
          <p className="text-shnoor-indigoMedium">{error || 'No questions found for this test.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 px-6 py-2 bg-gradient-to-r from-shnoor-indigo to-shnoor-navy text-white rounded-xl hover:from-shnoor-navy hover:to-shnoor-indigo transition-all duration-200 shadow-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // DISABLED: Coding questions - all questions are MCQ now
  // Determine if current question is MCQ or Coding
  // const isCodingQuestion = currentQuestion >= questions.length;
  // const currentQ = isCodingQuestion 
  //   ? codingQuestions[currentQuestion - questions.length]
  //   : questions[currentQuestion];
  const isCodingQuestion = false;
  const currentQ = questions[currentQuestion];

  return (
    <div className="h-screen bg-shnoor-lavender flex flex-col overflow-hidden">
      {/* Fullscreen Warning Modal */}
      {showWarning && (
        <FullscreenWarning onEnterFullscreen={enterFullscreen} />
      )}

      {/* Tab Switch Warning */}
      {showTabWarning && (
        <div className="fixed top-4 right-4 z-50 bg-shnoor-danger text-white px-6 py-4 rounded-xl shadow-2xl animate-pulse border border-shnoor-danger">
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

      {/* Proctor Message Alert */}
      {currentMessage && (
        <StudentMessageAlert
          message={currentMessage}
          isVisible={!!currentMessage}
          onDismiss={dismissCurrentMessage}
          autoHideDelay={10000}
        />
      )}

      {/* Top Bar */}
      <header className="bg-white border-b border-shnoor-light shadow-lg flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap sm:flex-nowrap justify-between items-center h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
            {/* Left: Logo and Title */}
            <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-shnoor-navy to-shnoor-indigo rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-base">EX</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-shnoor-navy truncate max-w-full">{testDetails?.title || 'Assessment'}</h1>
                <p className="text-[10px] sm:text-xs text-shnoor-indigoMedium truncate">Question {currentQuestion + 1} of {totalQuestions}</p>
              </div>
            </div>

            {/* Center: Timer */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 bg-shnoor-lavender px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-inner border border-shnoor-light flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-shnoor-indigo" />
              <span className="text-sm sm:text-xl font-mono font-bold text-shnoor-navy">{formattedTime}</span>
            </div>

            {/* Right: Finish Test Button */}
            <div className="flex justify-end lg:flex-none">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to finish and submit the test? This action cannot be undone.')) {
                    submitTest('manual');
                  }
                }}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-shnoor-danger to-shnoor-danger hover:from-shnoor-danger hover:to-shnoor-danger text-white font-bold rounded-xl shadow-lg transition-all duration-200 hover:scale-105 border-2 border-shnoor-danger text-xs sm:text-base flex-shrink-0"
              >
                <CheckCircle size={16} className="sm:w-5 sm:h-5" />
                <span>Finish<span className="hidden sm:inline"> Test</span></span>
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - Question Palette */}
        <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-shnoor-mist flex flex-col flex-shrink-0 order-2 lg:order-1 h-40 sm:h-48 lg:h-auto overflow-y-auto">
          <div className="p-4 border-b border-shnoor-mist">
            <h3 className="font-bold text-shnoor-navy mb-3">Question Palette</h3>

            {/* MCQ Questions */}
            {questions.length > 0 && (
              <>
                <p className="text-xs text-shnoor-indigoMedium mb-2 font-medium">MCQ Questions</p>
                <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 mb-4">
                  {questions.map((_, index) => {
                    const status = getQuestionStatus(index);
                    let bgClass = 'bg-[#F8F8FB] text-shnoor-indigoMedium border border-shnoor-mist/50'; // not-visited
                    if (status === 'answered') bgClass = 'bg-shnoor-success text-white border border-shnoor-success';
                    else if (status === 'review') bgClass = 'bg-shnoor-warning text-white border border-shnoor-warning';
                    else if (status === 'visited') bgClass = 'bg-shnoor-mist text-shnoor-navy border border-shnoor-mist shadow-inner';

                    return (
                      <button
                        key={index}
                        onClick={() => handleNavigate(index)}
                        className={`
                          w-10 h-10 rounded-lg font-bold text-sm transition-all shadow-sm
                          ${bgClass}
                          ${currentQuestion === index ? 'ring-2 ring-shnoor-indigo ring-offset-2' : ''}
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

            {/* DISABLED: Coding Questions */}
            {/* {codingQuestions.length > 0 && (
              <>
                <p className="text-xs text-shnoor-indigoMedium mb-2 font-medium">Coding Questions</p>
                <div className="grid grid-cols-5 gap-2">
                  {codingQuestions.map((_, index) => {
                    const actualIndex = questions.length + index;
                    const status = getQuestionStatus(actualIndex);
                    let bgClass = 'bg-[#F8F8FB] text-shnoor-indigoMedium border border-shnoor-mist/50'; // not-visited
                    if (status === 'answered') bgClass = 'bg-shnoor-indigo text-white border border-shnoor-indigo';
                    else if (status === 'review') bgClass = 'bg-shnoor-warning text-white border border-shnoor-warning';
                    else if (status === 'visited') bgClass = 'bg-shnoor-mist text-shnoor-navy border border-shnoor-mist shadow-inner';

                    return (
                      <button
                        key={actualIndex}
                        onClick={() => handleNavigate(actualIndex)}
                        className={`
                          w-10 h-10 rounded-lg font-semibold text-sm transition-all
                          ${bgClass}
                          ${currentQuestion === actualIndex ? 'ring-2 ring-shnoor-indigo ring-offset-2' : ''}
                          hover:opacity-80
                        `}
                      >
                        C{index + 1}
                      </button>
                    );
                  })}
                </div>
              </>
            )} */}
          </div>

          <div className="p-4 space-y-3">
            <div className="text-xs font-bold text-shnoor-indigoMedium uppercase mb-2">Summary</div>
            <div className="flex items-center space-x-2 text-sm font-medium">
              <div className="w-4 h-4 bg-shnoor-success rounded border border-shnoor-success"></div>
              <span className="text-shnoor-navy">Answered ({Object.keys(answers).filter(key => !markedForReview.has(parseInt(key))).length})</span>
            </div>
            <div className="flex items-center space-x-2 text-sm font-medium">
              <div className="w-4 h-4 bg-shnoor-warning rounded border border-shnoor-warning"></div>
              <span className="text-shnoor-navy">Marked for Review ({markedForReview.size})</span>
            </div>
            <div className="flex items-center space-x-2 text-sm font-medium">
              <div className="w-4 h-4 bg-shnoor-mist rounded border border-shnoor-mist shadow-inner"></div>
              <span className="text-shnoor-navy">Not Answered ({totalQuestions - Object.keys(answers).length})</span>
            </div>
          </div>

          <div className="mt-auto p-4 bg-shnoor-lavender border-t border-shnoor-mist">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-shnoor-indigo flex-shrink-0 mt-0.5" />
                <p className="text-xs text-shnoor-navy font-medium">
                  Tab switches: <span className="font-bold">{warningCount}/3</span>
                  <br />
                  {warningCount > 0 && "Avoid switching tabs!"}
                </p>
              </div>

              {/* AI Violation Summary */}
              {(violations.multipleFaces > 0 || violations.noFace > 0 || violations.phoneDetected > 0) && (
                <div className="pt-2 border-t border-shnoor-mist/50">
                  <p className="text-xs font-bold text-shnoor-navy mb-1">AI Detections:</p>
                  {violations.multipleFaces > 0 && (
                    <p className="text-xs text-shnoor-danger font-medium">• Multiple faces: {violations.multipleFaces}</p>
                  )}
                  {violations.noFace > 0 && (
                    <p className="text-xs text-shnoor-warning font-medium">• Face absent: {violations.noFace}</p>
                  )}
                  {violations.phoneDetected > 0 && (
                    <p className="text-xs text-shnoor-danger font-medium">• Phone detected: {violations.phoneDetected}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Question Area - MCQ */}
        {!isCodingQuestion && (
          <main className="flex-1 flex flex-col bg-shnoor-lavender p-3 sm:p-6 overflow-hidden order-1 lg:order-2">
            {/* Question Card - Fixed Height with Internal Scrolling */}
            <div className="flex-1 bg-white rounded-xl sm:rounded-2xl shadow-xl border border-shnoor-light p-4 sm:p-8 flex flex-col overflow-hidden min-h-0">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0 gap-2">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-shnoor-indigo to-shnoor-navy text-white rounded-lg sm:rounded-xl flex items-center justify-center font-bold shadow-lg text-sm sm:text-base flex-shrink-0">
                    Q{currentQuestion + 1}
                  </span>
                  {markedForReview.has(currentQuestion) && (
                    <span className="flex items-center space-x-1 text-shnoor-warning bg-shnoor-warningLight px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium border border-shnoor-warningLight shadow-sm">
                      <Flag size={12} className="sm:w-[14px] sm:h-[14px]" />
                      <span className="hidden sm:inline">Marked for Review</span>
                      <span className="sm:hidden">Marked</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleMarkForReview}
                  className={`
                    flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm flex-shrink-0
                    ${markedForReview.has(currentQuestion)
                      ? 'bg-shnoor-warningLight text-shnoor-warning hover:bg-shnoor-warningLight border border-shnoor-warningLight'
                      : 'bg-shnoor-lavender text-shnoor-indigo hover:bg-shnoor-mist border border-shnoor-light'}
                  `}
                >
                  <Flag size={14} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">{markedForReview.has(currentQuestion) ? 'Unmark' : 'Mark for Review'}</span>
                  <span className="sm:hidden">{markedForReview.has(currentQuestion) ? 'Unmark' : 'Review'}</span>
                </button>
              </div>

              {/* Layout: Question & Options */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 flex-1 overflow-y-auto lg:overflow-hidden min-h-0">
                {/* Left Side: Question Text */}
                <div className="col-span-1 lg:col-span-3 bg-shnoor-lavender/30 rounded-xl p-4 sm:p-6 border-2 border-shnoor-mist overflow-y-visible lg:overflow-y-auto h-auto lg:h-full">
                  <h3 className="text-sm font-semibold text-shnoor-indigoMedium mb-4 uppercase tracking-wide">Question</h3>
                  {currentQ.format === 'paragraph' ? (
                    <div className="text-lg text-shnoor-navy leading-relaxed prose prose-lg max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {currentQ.question}
                      </ReactMarkdown>
                    </div>
                  ) : currentQ.format === 'code' ? (
                    <pre className="text-sm text-shnoor-navy leading-relaxed bg-gray-50 p-4 rounded-lg overflow-x-auto font-mono border border-shnoor-mist">
                      <code>{currentQ.question}</code>
                    </pre>
                  ) : (
                    <p className="text-lg text-shnoor-navy leading-relaxed whitespace-pre-wrap font-medium">
                      {currentQ.question}
                    </p>
                  )}
                </div>

                {/* Right Side: Options */}
                <div className="col-span-1 lg:col-span-2 bg-shnoor-lavender/30 rounded-xl p-4 sm:p-6 border-2 border-shnoor-mist overflow-y-visible lg:overflow-y-auto h-auto lg:h-full">
                  <h3 className="text-sm font-semibold text-shnoor-indigoMedium mb-4 uppercase tracking-wide">Choose Your Answer</h3>
                  <div className="space-y-3">
                    {currentQ.options.map((option, index) => (
                      <label
                        key={index}
                        className={`
                          flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 shadow-sm bg-white
                          ${answers[currentQuestion] === index
                            ? 'border-shnoor-indigo bg-shnoor-lavender shadow-lg'
                            : 'border-shnoor-light hover:border-shnoor-soft hover:bg-shnoor-mist/30'}
                        `}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion}`}
                          checked={answers[currentQuestion] === index}
                          onChange={() => handleAnswerSelect(index)}
                          className="w-5 h-5 text-shnoor-indigo border-shnoor-light focus:ring-shnoor-indigo"
                        />
                        <span className="ml-4 text-shnoor-navy font-medium">{option}</span>
                        {answers[currentQuestion] === index && (
                          <CheckCircle className="ml-auto w-5 h-5 text-shnoor-indigo" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Navigation Buttons - Fixed at Bottom */}
            <div className="flex justify-between items-center mt-4 sm:mt-6 flex-shrink-0 gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className={`
                  flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 shadow-lg text-sm sm:text-base flex-1 sm:flex-none
                  ${currentQuestion === 0
                    ? 'bg-shnoor-mist text-shnoor-soft cursor-not-allowed'
                    : 'bg-white border-2 border-shnoor-light text-shnoor-navy hover:border-shnoor-soft hover:bg-shnoor-mist/30 hover:shadow-xl'}
                `}
              >
                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>

              <div className="flex space-x-2 sm:space-x-3 flex-1 sm:flex-none justify-end">
                <button
                  onClick={() => {
                    saveProgressNow(); // Save in background without blocking
                    handleNext();
                  }}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-white border-2 border-shnoor-light text-shnoor-indigoMedium rounded-lg sm:rounded-xl font-semibold hover:border-shnoor-soft hover:bg-shnoor-mist/30 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  Skip
                </button>

                <button
                  onClick={() => {
                    if (answers[currentQuestion] !== undefined) {
                      saveProgressNow(); // Save in background without blocking
                      handleNext();
                    } else {
                      alert('Please select an answer or click Skip');
                    }
                  }}
                  className="flex items-center justify-center space-x-1 sm:space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-shnoor-indigo to-shnoor-navy hover:from-shnoor-navy hover:to-shnoor-indigo text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base flex-shrink-0"
                >
                  <span className="hidden sm:inline">Save & Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </main>
        )}
        {/* Coding Question - Split Screen Layout */}
        {/* Coding Question - Split Screen Layout */}
        {isCodingQuestion && (
          <main className="flex-1 flex flex-col lg:flex-row bg-shnoor-lavender overflow-hidden coding-container">
            {/* Left Panel - Problem Description */}
            <div
              className="bg-white lg:border-r border-shnoor-light overflow-y-auto flex-shrink-0 shadow-lg w-full lg:w-auto"
              style={{ width: window.innerWidth >= 1024 ? `${leftPanelWidth}%` : '100%', minWidth: window.innerWidth >= 1024 ? '20%' : 'auto', maxWidth: window.innerWidth >= 1024 ? '50%' : '100%' }}
            >
              <div className="p-6">
                {/* Title */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-shnoor-navy mb-2">{currentQ.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-gradient-to-r from-shnoor-warningLight to-shnoor-warningLight text-shnoor-warning text-xs font-semibold rounded-full border border-shnoor-warningLight shadow-sm">
                      MEDIUM
                    </span>
                    <span className="px-3 py-1 bg-gradient-to-r from-shnoor-indigo to-shnoor-navy text-white text-xs font-semibold rounded-full shadow-sm">
                      {currentQ.marks || 10} Marks
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-shnoor-indigoMedium uppercase mb-2">Description</h4>
                  <div className="text-shnoor-navy text-sm leading-relaxed">
                    <pre className="whitespace-pre-wrap font-sans">{currentQ.description}</pre>
                  </div>
                </div>

                {/* Examples */}
                <div>
                  <h4 className="text-sm font-semibold text-shnoor-indigoMedium uppercase mb-3">Examples</h4>
                  <div className="space-y-4">
                    {currentQ.testCases && currentQ.testCases.map((testCase, index) => (
                      <div key={index} className="bg-shnoor-mist rounded-xl p-4 border border-shnoor-light shadow-sm">
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-shnoor-indigoMedium uppercase mb-1">Input</p>
                          <div className="bg-shnoor-navy text-shnoor-lavender p-3 rounded-lg font-mono text-sm shadow-inner">
                            {testCase.input}
                          </div>
                        </div>
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-shnoor-indigoMedium uppercase mb-1">Output</p>
                          <div className="bg-shnoor-navy text-shnoor-lavender p-3 rounded-lg font-mono text-sm shadow-inner">
                            {testCase.output}
                          </div>
                        </div>
                        {testCase.explanation && (
                          <div>
                            <p className="text-xs font-semibold text-shnoor-indigoMedium uppercase mb-1">Explanation</p>
                            <p className="text-sm text-shnoor-navy">{testCase.explanation}</p>
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
              className="w-1 bg-shnoor-light hover:bg-shnoor-indigo cursor-col-resize flex-shrink-0 transition-colors duration-200"
              onMouseDown={handleHorizontalMouseDown}
              style={{ cursor: 'col-resize' }}
            />

            {/* Right Panel - Code Editor */}
            <div className="flex-1 flex flex-col bg-shnoor-navy code-editor-container min-w-0 shadow-xl">
              {/* Editor Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-shnoor-navy border-b border-shnoor-indigo/30">
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
                  className="px-3 py-1.5 bg-shnoor-indigo text-shnoor-lavender text-sm rounded-lg border border-shnoor-indigo/50 focus:ring-2 focus:ring-shnoor-lavender focus:border-transparent shadow-sm"
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
                    className="px-4 py-1.5 bg-shnoor-success hover:bg-shnoor-success text-white text-sm rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-sm"
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

                      // Get student and test IDs
                      const studentId = localStorage.getItem('studentId');
                      const testId = localStorage.getItem('selectedTestId');
                      const codingQuestionId = currentQ.id;

                      // Show loading state
                      setCodingConsoleOutput(prev => ({
                        ...prev,
                        [currentQuestion]: {
                          running: true
                        }
                      }));

                      try {
                        // Submit code - runs against all test cases and saves to DB
                        const result = await codeExecutionAPI.submitCodingSolution(
                          studentId,
                          codingQuestionId,
                          testId,
                          currentCode,
                          currentLang
                        );

                        if (result.success) {
                          const {
                            passed,
                            testCasesPassed,
                            totalTestCases,
                            percentage,
                            publicTestResults,
                            hiddenTestResults,
                            publicTestCasesPassed,
                            hiddenTestCasesPassed
                          } = result.result;

                          // Format results for console display
                          const formattedResults = [];

                          // Add public test cases with full details
                          if (publicTestResults && publicTestResults.length > 0) {
                            publicTestResults.forEach((tc, idx) => {
                              formattedResults.push({
                                testCase: idx + 1,
                                passed: tc.passed,
                                input: tc.input || '(no input)',
                                expectedOutput: tc.expectedOutput,
                                actualOutput: tc.actual || tc.output || '(no output)',
                                error: tc.error || null,
                                executionTime: tc.executionTime || 'N/A',
                                isHidden: false,
                                explanation: tc.explanation || null
                              });
                            });
                          }

                          // Add hidden test cases (only pass/fail)
                          if (hiddenTestResults && hiddenTestResults.length > 0) {
                            hiddenTestResults.forEach((tc) => {
                              formattedResults.push({
                                testCase: publicTestResults.length + tc.testNumber,
                                passed: tc.passed,
                                isHidden: true,
                                input: '🔒 Hidden',
                                expectedOutput: '🔒 Hidden',
                                actualOutput: '🔒 Hidden',
                                error: null,
                                executionTime: 'N/A'
                              });
                            });
                          }

                          setCodingConsoleOutput(prev => ({
                            ...prev,
                            [currentQuestion]: {
                              results: formattedResults,
                              summary: {
                                passedTestCases: testCasesPassed,
                                failedTestCases: totalTestCases - testCasesPassed,
                                totalTestCases: totalTestCases,
                                percentage: percentage.toFixed(1)
                              },
                              timestamp: new Date().toLocaleTimeString(),
                              isLoading: false
                            }
                          }));

                          // Save the coding answer with submission status
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
                              submittedAt: new Date().toISOString(),
                              testCasesPassed,
                              totalTestCases,
                              passed
                            }
                          }));

                          // Save progress to backend
                          await saveProgressNow();
                        } else {
                          setCodingConsoleOutput(prev => ({
                            ...prev,
                            [currentQuestion]: {
                              results: [{
                                testCase: 1,
                                passed: false,
                                input: 'N/A',
                                expectedOutput: 'N/A',
                                actualOutput: 'N/A',
                                error: `Submission failed: ${result.message}`,
                                executionTime: 'N/A',
                                isHidden: false
                              }],
                              summary: {
                                passedTestCases: 0,
                                failedTestCases: 1,
                                totalTestCases: 1,
                                percentage: '0.0'
                              },
                              timestamp: new Date().toLocaleTimeString(),
                              running: false
                            }
                          }));
                        }
                      } catch (error) {
                        console.error('Submit error:', error);
                        setCodingConsoleOutput(prev => ({
                          ...prev,
                          [currentQuestion]: {
                            results: [{
                              testCase: 1,
                              passed: false,
                              input: 'N/A',
                              expectedOutput: 'N/A',
                              actualOutput: 'N/A',
                              error: `Error: ${error.message}`,
                              executionTime: 'N/A',
                              isHidden: false
                            }],
                            summary: {
                              passedTestCases: 0,
                              failedTestCases: 1,
                              totalTestCases: 1,
                              percentage: '0.0'
                            },
                            timestamp: new Date().toLocaleTimeString(),
                            running: false
                          }
                        }));
                      }
                    }}
                    className="px-4 py-1.5 bg-gradient-to-r from-shnoor-indigo to-shnoor-navy hover:from-shnoor-navy hover:to-shnoor-indigo text-white text-sm rounded-lg font-medium transition-all duration-200 shadow-sm"
                  >
                    Submit
                  </button>
                </div>
              </div>
              {/* Code Editor */}
              <div className="flex-1 overflow-hidden">
                <LazyMonacoEditor
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
              {/* Vertical Resize Handle */}
              <div
                className="h-1 bg-shnoor-indigo/30 hover:bg-shnoor-indigo cursor-row-resize flex-shrink-0 transition-colors duration-200"
                onMouseDown={handleVerticalMouseDown}
                style={{ cursor: 'row-resize' }}
              />

              {/* Test Cases / Console Tabs */}
              <div
                className="border-t border-shnoor-indigo/30 flex flex-col"
                style={{ height: window.innerWidth >= 1024 ? `${consolePanelHeight}px` : 'auto', minHeight: window.innerWidth < 1024 ? '200px' : 'auto', maxHeight: window.innerWidth < 1024 ? '300px' : 'none' }}
              >
                <div className="flex items-center space-x-4 px-4 py-2 bg-shnoor-navy border-b border-shnoor-indigo/30">
                  <button className="text-sm font-medium text-shnoor-lavender border-b-2 border-shnoor-lavender pb-2">
                    Test Cases
                  </button>
                  <button className="text-sm font-medium text-shnoor-soft hover:text-shnoor-lavender pb-2 transition-colors">
                    Console
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-shnoor-navy">
                  {codingConsoleOutput[currentQuestion]?.running ? (
                    <div className="flex items-center space-x-2 text-shnoor-warning">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-shnoor-warning"></div>
                      <span className="text-sm">Running test cases...</span>
                    </div>
                  ) : codingConsoleOutput[currentQuestion]?.results ? (
                    <div className="space-y-3">
                      {/* Summary */}
                      {codingConsoleOutput[currentQuestion]?.summary && (
                        <div className="mb-4 p-3 bg-shnoor-indigo/20 rounded-lg border border-shnoor-indigo/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-shnoor-lavender">Test Results Summary</span>
                            <span className="text-xs text-shnoor-soft">
                              {codingConsoleOutput[currentQuestion].timestamp}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-lg font-bold text-shnoor-success">
                                {codingConsoleOutput[currentQuestion].summary.passedTestCases}
                              </div>
                              <div className="text-shnoor-soft">Passed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-shnoor-danger">
                                {codingConsoleOutput[currentQuestion].summary.failedTestCases}
                              </div>
                              <div className="text-shnoor-soft">Failed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-shnoor-lavender">
                                {codingConsoleOutput[currentQuestion].summary.percentage}%
                              </div>
                              <div className="text-shnoor-soft">Score</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Individual Test Results */}
                      {codingConsoleOutput[currentQuestion].results.map((result, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border shadow-sm ${result.passed
                            ? 'bg-shnoor-success/20 border-shnoor-success/50'
                            : 'bg-shnoor-danger/20 border-shnoor-danger/50'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-semibold ${result.passed ? 'text-shnoor-success' : 'text-shnoor-danger'}`}>
                              TEST CASE {result.testCase}: {result.passed ? '✓ PASSED' : '✗ FAILED'}
                            </span>
                            <span className="text-xs text-shnoor-soft">{result.executionTime}</span>
                          </div>
                          <div className="text-xs font-mono space-y-1">
                            <div>
                              <span className="text-shnoor-soft">Input: </span>
                              <span className="text-shnoor-lavender">{result.input}</span>
                            </div>
                            <div>
                              <span className="text-shnoor-soft">Expected: </span>
                              <span className="text-shnoor-lavender">{result.expectedOutput}</span>
                            </div>
                            <div>
                              <span className="text-shnoor-soft">Got: </span>
                              <div className={`mt-1 ${result.passed ? 'text-shnoor-success' : 'text-shnoor-danger'}`}>
                                {result.actualOutput && (result.actualOutput.includes('🐍') || result.actualOutput.includes('☕') || result.actualOutput.includes('🔧') || result.actualOutput.includes('🟨') || result.actualOutput.includes('Error:')) ? (
                                  <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed bg-gray-900/30 p-2 rounded border border-gray-600/30">
                                    {formatErrorForDisplay(result.actualOutput)}
                                  </pre>
                                ) : (
                                  <span className="font-mono text-sm">
                                    {result.actualOutput}
                                  </span>
                                )}
                              </div>
                            </div>
                            {result.error && (
                              <div className="mt-2">
                                <span className="text-shnoor-soft text-xs uppercase tracking-wide">Error Details:</span>
                                <div className="mt-1 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                                  <pre className="text-shnoor-danger text-sm font-mono whitespace-pre-wrap leading-relaxed">
                                    {formatErrorForDisplay(result.error)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-shnoor-soft text-sm py-8">
                      Click "Run" to test your code
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between px-4 py-3 bg-shnoor-navy border-t border-shnoor-indigo/30">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className={`
                          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                          ${currentQuestion === 0
                        ? 'bg-shnoor-indigo/20 text-shnoor-soft cursor-not-allowed'
                        : 'bg-shnoor-indigo/30 hover:bg-shnoor-indigo/50 text-shnoor-lavender'}
                        `}
                  >
                    <ChevronLeft size={18} />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentQuestion >= totalQuestions - 1}
                    className={`
                          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                          ${currentQuestion >= totalQuestions - 1
                        ? 'bg-shnoor-indigo/20 text-shnoor-soft cursor-not-allowed'
                        : 'bg-shnoor-indigo/30 hover:bg-shnoor-indigo/50 text-shnoor-lavender'}
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

        {/* Warnings Sidebar */}
        <StudentWarningsSidebar
          messages={proctoringMessages}
          isCollapsed={warningsSidebarCollapsed}
          onToggleCollapse={() => setWarningsSidebarCollapsed(prev => !prev)}
        />
      </div>

      {/* Force Termination Modal */}
      {showTerminationModal && terminationData && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-fadeIn">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-5 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <StopCircle size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Examination Terminated</h2>
                  <p className="text-red-100 text-sm mt-1">Your test has been stopped by the administrator</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Notice Box */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800 mb-1">Test Terminated</p>
                    <p className="text-sm text-red-700">The exam administrator has stopped your examination. Your current progress has been recorded and submitted.</p>
                  </div>
                </div>
              </div>

              {/* Reason Section */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-sm font-semibold text-gray-700">Reason for Termination:</span>
                </div>
                <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{terminationData.reason}</p>
                </div>
              </div>

              {/* Information Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Next Steps:</span> You will be redirected to provide feedback about your exam experience. If you believe this action was taken in error, please contact the examination office.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => {
                  setShowTerminationModal(false);
                  // Submit test with forced termination reason
                  submitTest('forced_termination');
                }}
                className="px-8 py-3 bg-gradient-to-r from-shnoor-indigo to-shnoor-navy hover:from-shnoor-navy hover:to-shnoor-indigo text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>Continue to Feedback</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default TestScreen;