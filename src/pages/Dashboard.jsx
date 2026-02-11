import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LogOut, Clock, BookOpen, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [institute, setInstitute] = useState('');

  // Helper to capitalize institute name for display
  const capitalizeInstitute = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testsWithProgress, setTestsWithProgress] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('studentAuthToken');
      if (!token) {
        navigate('/login');
        return;
      }

      setStudentName(localStorage.getItem('studentName') || 'Student');
      setStudentId(localStorage.getItem('studentId') || '');
      setInstitute(localStorage.getItem('institute') || '');

      try {
        const response = await fetch('/api/student/tests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tests');
        }

        const data = await response.json();
        if (data.success) {
          setAvailableTests(data.tests);
          
          // Check for saved progress for each test
          const progressChecks = await Promise.all(
            data.tests.map(async (test) => {
              // Skip progress check if test is not available, already taken, or no attempts left
              if (!test.isAvailable || test.alreadyTaken || !test.hasAttemptsLeft) {
                return { testId: test.id, hasProgress: false };
              }
              
              try {
                const progressResponse = await fetch(`/api/student/test/${test.id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (progressResponse.ok) {
                  const progressData = await progressResponse.json();
                  return { 
                    testId: test.id, 
                    hasProgress: progressData.savedProgress !== null 
                  };
                }
              } catch (err) {
                console.error(`Error checking progress for test ${test.id}:`, err);
              }
              return { testId: test.id, hasProgress: false };
            })
          );
          
          const testsWithProgressSet = new Set(
            progressChecks
              .filter(p => p.hasProgress)
              .map(p => p.testId)
          );
          setTestsWithProgress(testsWithProgressSet);
        } else {
          setError('Failed to load tests');
        }
      } catch (err) {
        console.error('Error loading tests:', err);
        setError('Connection error. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleTakeTest = (testId) => {
    localStorage.setItem('selectedTestId', testId);
    navigate('/instructions');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-[#111827] shadow-sm border-b-4 border-[#3B82F6] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">EX</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Assessment Portal</h1>
                <p className="text-sm text-gray-300">Student Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">Welcome, {studentName}</p>
                <p className="text-xs text-gray-300">{capitalizeInstitute(institute)} • ID: {studentId}</p>              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg"
              >
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">Available Examinations</h2>
          <p className="text-[#374151]">Select a test to begin your assessment</p>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!loading && !error && availableTests.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-[#E5E7EB] shadow-sm">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-[#111827]">No Tests Available</h3>
            <p className="text-[#374151] mt-2">You have completed all available tests or there are no new assessments at this time.</p>
          </div>
        )}

        {!loading && !error && availableTests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {availableTests.map((test) => {
              // Determine card styling based on test status
              let cardBgColor = 'bg-white'; // Default: white (available)
              let cardBorderColor = 'border-[#3B82F6]';
              let cardOpacity = 'opacity-100';
              
              if (test.testStatus === 'expired' || test.alreadyTaken) {
                cardBgColor = 'bg-gray-100';
                cardBorderColor = 'border-gray-300';
                cardOpacity = 'opacity-75';
              } else if (test.testStatus === 'upcoming') {
                cardBgColor = 'bg-orange-50';
                cardBorderColor = 'border-orange-300';
              }
              
              return (
              <div
                key={test.id}
                className={`${cardBgColor} border-2 ${cardBorderColor} rounded-xl p-6 ${cardOpacity} ${test.isAvailable && !test.alreadyTaken ? 'hover:shadow-lg hover:border-[#3B82F6]' : ''} transition-all duration-200`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`inline-block px-3 py-1 ${
                      test.testStatus === 'expired' || test.alreadyTaken 
                        ? 'bg-gray-300 text-gray-700' 
                        : test.testStatus === 'upcoming'
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-blue-100 text-[#3B82F6]'
                    } rounded-full text-xs font-semibold mb-2`}>
                      {test.subject}
                    </span>
                    <h3 className="text-lg font-bold text-[#111827]">{test.title}</h3>
                    {test.alreadyTaken && (
                      <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        All Attempts Used ({test.attemptsTaken}/{test.maxAttempts})
                      </span>
                    )}
                    {test.testStatus === 'upcoming' && !test.alreadyTaken && (
                      <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                        🕐 Upcoming
                      </span>
                    )}
                    {test.testStatus === 'expired' && !test.alreadyTaken && (
                      <span className="inline-block mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                        ⏰ Deadline Passed
                      </span>
                    )}
                    {test.isAvailable && !test.alreadyTaken && testsWithProgress.has(test.id) && (
                      <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        ⏸ In Progress
                      </span>
                    )}
                  </div>
                  <BookOpen className={test.alreadyTaken || !test.isAvailable ? 'text-gray-400' : test.testStatus === 'upcoming' ? 'text-orange-400' : 'text-[#3B82F6]'} size={24} />
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-[#374151]">
                    <Clock size={16} className="mr-2" />
                    <span>Duration: {test.duration} minutes</span>
                  </div>
                  <div className="flex items-center text-sm text-[#374151]">
                    <AlertCircle size={16} className="mr-2" />
                    <span>{test.questions} Questions • {test.difficulty} Level</span>
                  </div>
                  <div className="flex items-center text-sm text-[#374151]">
                    <BookOpen size={16} className="mr-2" />
                    <span>Attempts: {test.attemptsTaken}/{test.maxAttempts} ({test.attemptsRemaining} remaining)</span>
                  </div>
                  {test.startDateTime && (
                    <div className="flex items-center text-sm text-[#374151]">
                      <Clock size={16} className="mr-2" />
                      <span>Available from: {new Date(test.startDateTime).toLocaleString()}</span>
                    </div>
                  )}
                  {test.endDateTime && (
                    <div className="flex items-center text-sm text-[#374151]">
                      <Clock size={16} className="mr-2" />
                      <span>Available until: {new Date(test.endDateTime).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => test.isAvailable && !test.alreadyTaken && handleTakeTest(test.id)}
                  disabled={!test.isAvailable || test.alreadyTaken}
                  className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors shadow-sm ${
                    test.alreadyTaken
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : test.testStatus === 'upcoming'
                      ? 'bg-orange-400 text-white cursor-not-allowed'
                      : test.testStatus === 'expired'
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : testsWithProgress.has(test.id)
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-[#3B82F6] hover:bg-blue-600 text-white'
                  }`}
                >
                  {test.alreadyTaken 
                    ? `Completed (${test.attemptsTaken}/${test.maxAttempts} attempts used)` 
                    : test.testStatus === 'upcoming'
                    ? `🕐 ${test.availabilityMessage}`
                    : test.testStatus === 'expired'
                    ? `⏰ ${test.availabilityMessage}`
                    : testsWithProgress.has(test.id)
                    ? '▶ Resume Test'
                    : `Take Test (${test.attemptsRemaining} attempts left)`}
                </button>
              </div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#111827] mb-2">Important Instructions</h3>
          <ul className="space-y-2 text-sm text-[#374151]">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Ensure you have a stable internet connection before starting
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              All tests require fullscreen mode and prohibit tab switching
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Three warnings for tab switching will result in automatic submission
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Your progress is automatically saved - you can resume tests if interrupted
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;