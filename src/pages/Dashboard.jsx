import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LogOut, Clock, BookOpen, AlertCircle, FileText, X } from 'lucide-react';
import ExamSearchFilter from '../components/ExamSearchFilter';
import { apiFetch } from '../config/api';

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
  const [selectedTest, setSelectedTest] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJobRoleIndex, setSelectedJobRoleIndex] = useState(0);

  // Search, Filter, Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    published: 'all',
    attempted: 'all',
    dateRange: 'all'
  });
  const [sortBy, setSortBy] = useState('latest');

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
        const response = await apiFetch('api/student/tests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tests');
        }

        const data = await response.json();
        console.log('=== STUDENT TESTS API RESPONSE ===');
        console.log('Full response:', data);
        console.log('Tests count:', data.tests?.length);
        if (data.tests && data.tests.length > 0) {
          console.log('First test:', data.tests[0]);
          console.log('First test jobRoles:', data.tests[0].jobRoles);
        }
        
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
                const progressResponse = await apiFetch(`api/student/test/${test.id}`, {
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

  const handleViewJobDescription = (test) => {
    console.log('=== VIEW JOB DESCRIPTION ===');
    console.log('Test data:', test);
    console.log('Job Roles:', test.jobRoles);
    console.log('Job Roles length:', test.jobRoles?.length);
    console.log('Job Role (old):', test.jobRole);
    setSelectedTest(test);
    setSelectedJobRoleIndex(0); // Reset to first role
    setShowJobModal(true);
  };

  // Filter and Sort Tests
  const getFilteredAndSortedTests = () => {
    let filtered = [...availableTests];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Attempted filter
    if (filters.attempted === 'attempted') {
      filtered = filtered.filter(test => test.alreadyTaken);
    } else if (filters.attempted === 'not-attempted') {
      filtered = filtered.filter(test => !test.alreadyTaken && test.attemptsTaken === 0);
    } else if (filters.attempted === 'in-progress') {
      filtered = filtered.filter(test => testsWithProgress.has(test.id));
    }

    // Date range filter (based on availability)
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(test => {
        if (!test.startDateTime) return true;
        const testDate = new Date(test.startDateTime);
        switch (filters.dateRange) {
          case 'today':
            return testDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return testDate >= weekAgo;
          case 'month':
            return testDate.getMonth() === now.getMonth() && testDate.getFullYear() === now.getFullYear();
          case 'year':
            return testDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Sort
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => {
          const dateA = new Date(a.startDateTime || 0);
          const dateB = new Date(b.startDateTime || 0);
          return dateB - dateA;
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          const dateA = new Date(a.startDateTime || 0);
          const dateB = new Date(b.startDateTime || 0);
          return dateA - dateB;
        });
        break;
      case 'duration-asc':
        filtered.sort((a, b) => a.duration - b.duration);
        break;
      case 'duration-desc':
        filtered.sort((a, b) => b.duration - a.duration);
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredTests = getFilteredAndSortedTests();

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {showJobModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-[#3B82F6] to-blue-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedTest.title}</h3>
                <p className="text-blue-100 text-sm mt-1">Job Role & Description</p>
              </div>
              <button
                onClick={() => setShowJobModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {selectedTest.jobRoles && selectedTest.jobRoles.length > 0 ? (
                <>
                  {/* Always show dropdown if jobRoles exist */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-[#111827] mb-2">
                      Select Job Role {selectedTest.jobRoles.length > 1 && `(${selectedTest.jobRoles.length} available)`}
                    </label>
                    <select
                      value={selectedJobRoleIndex}
                      onChange={(e) => setSelectedJobRoleIndex(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] bg-white text-[#111827] font-medium"
                      disabled={selectedTest.jobRoles.length === 1}
                    >
                      {selectedTest.jobRoles.map((role, index) => (
                        <option key={index} value={index}>
                          {role.jobRole}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <FileText className="w-5 h-5 text-[#3B82F6]" />
                      </div>
                      <h4 className="text-lg font-bold text-[#111827]">Job Role</h4>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-[#3B82F6] p-5 rounded-r-lg">
                      <p className="text-[#111827] font-bold text-xl">
                        {selectedTest.jobRoles[selectedJobRoleIndex]?.jobRole || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {selectedTest.jobRoles[selectedJobRoleIndex]?.jobDescription && (
                    <div>
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <BookOpen className="w-5 h-5 text-green-600" />
                        </div>
                        <h4 className="text-lg font-bold text-[#111827]">Job Description</h4>
                      </div>
                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                        <p className="text-[#374151] whitespace-pre-wrap leading-relaxed text-base">
                          {selectedTest.jobRoles[selectedJobRoleIndex].jobDescription}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : selectedTest.jobRole ? (
                <>
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <FileText className="w-5 h-5 text-[#3B82F6]" />
                      </div>
                      <h4 className="text-lg font-bold text-[#111827]">Job Role</h4>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-[#3B82F6] p-5 rounded-r-lg">
                      <p className="text-[#111827] font-bold text-xl">{selectedTest.jobRole}</p>
                    </div>
                  </div>

                  {selectedTest.description && (
                    <div>
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <BookOpen className="w-5 h-5 text-green-600" />
                        </div>
                        <h4 className="text-lg font-bold text-[#111827]">Job Description</h4>
                      </div>
                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                        <p className="text-[#374151] whitespace-pre-wrap leading-relaxed text-base">{selectedTest.description}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>No job description available for this test</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setShowJobModal(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
            <span className="ml-3 text-[#374151]">Loading...</span>
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
          <>
            <ExamSearchFilter
              onSearchChange={setSearchTerm}
              onFilterChange={setFilters}
              onSortChange={setSortBy}
              showPublishedFilter={false}
              showAttemptedFilter={true}
              resultCount={filteredTests.length}
              sortOptions={[
                { value: 'latest', label: 'Latest Available' },
                { value: 'oldest', label: 'Oldest Available' },
                { value: 'duration-asc', label: 'Shortest Duration' },
                { value: 'duration-desc', label: 'Longest Duration' }
              ]}
            />

            {filteredTests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-[#E5E7EB] shadow-sm">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-[#111827]">No Tests Match Your Filters</h3>
                <p className="text-[#374151] mt-2">Try adjusting your search or filters to see more tests.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {filteredTests.map((test) => {
              // Determine card styling based on test status
              let cardBgColor = 'bg-white'; // Default: white (available)
              let cardBorderColor = 'border-[#3B82F6]';
              let cardOpacity = 'opacity-100';
              
              if (test.isMockTest) {
                cardBgColor = 'bg-green-50';
                cardBorderColor = 'border-green-400';
              } else if (test.testStatus === 'expired' || test.alreadyTaken) {
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
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block px-3 py-1 ${
                        test.isMockTest
                          ? 'bg-green-100 text-green-700'
                          : test.testStatus === 'expired' || test.alreadyTaken
                          ? 'bg-gray-300 text-gray-700'
                          : test.testStatus === 'upcoming'
                          ? 'bg-orange-200 text-orange-800'
                          : 'bg-blue-100 text-[#3B82F6]'
                      } rounded-full text-xs font-semibold`}>
                        {test.subject}
                      </span>
                      {test.isMockTest && (
                        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-300">
                          🎯 Mock Test
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[#111827]">{test.title}</h3>
                    {test.isMockTest && (
                      <p className="text-xs text-green-600 mt-1">Practice test to get familiar with the platform</p>
                    )}
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

                <div className="space-y-3">
                  <button
                    onClick={() => handleViewJobDescription(test)}
                    className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 border border-gray-300"
                  >
                    <FileText size={18} />
                    <span>View Job Description</span>
                  </button>

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
                        ? `🕐 Available from ${new Date(test.startDateTime).toLocaleString()}`
                        : test.testStatus === 'expired'
                          ? `⏰ Expired on ${new Date(test.endDateTime).toLocaleString()}`
                          : testsWithProgress.has(test.id)
                            ? '▶ Resume Test'
                              : `Take Test (${test.attemptsRemaining} attempts left)`}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
            )}
          </>
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