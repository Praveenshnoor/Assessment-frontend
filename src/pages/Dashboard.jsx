import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LogOut, Clock, BookOpen, AlertCircle, FileText, X, Video, Briefcase } from 'lucide-react';
import ExamSearchFilter from '../components/ExamSearchFilter';
import StudentInterviews from '../components/StudentInterviews';
import JobBoard from './JobBoard';
import MyApplications from './MyApplications';
import { apiFetch } from '../config/api';
import shnoorLogo from '../assets/shnoor-logo1.png';

const STUDENT_DASHBOARD_TABS = ['tests', 'interviews', 'job-board', 'my-applications'];

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
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('studentDashboardTab');
    return STUDENT_DASHBOARD_TABS.includes(savedTab) ? savedTab : 'tests';
  });

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
      // Validate token type - force re-login if old Firebase token
      const { validateAndCleanupToken } = await import('../utils/tokenValidator');
      if (!validateAndCleanupToken()) {
        navigate('/login');
        return;
      }

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

        // Handle 401 - Token expired or invalid
        if (response.status === 401) {
          console.log('Authentication token expired or invalid');
          localStorage.clear();
          navigate('/login');
          return;
        }

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

  useEffect(() => {
    localStorage.setItem('studentDashboardTab', activeTab);
  }, [activeTab]);

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
          case 'week': {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return testDate >= weekAgo;
          }
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
    <div className="min-h-screen bg-[#F8F8FB]">
      {showJobModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-mist max-w-3xl w-full max-h-[90vh] overflow-y-auto my-4">
            <div className="bg-shnoor-indigo px-4 sm:px-6 py-4 flex justify-between items-start sm:items-center gap-4 sticky top-0 z-10">
              <div className="flex-1 pr-4">
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">{selectedTest.title}</h3>
                <p className="text-white/80 text-xs sm:text-sm mt-1">Job Role & Description</p>
              </div>
              <button
                onClick={() => setShowJobModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors flex-shrink-0"
              >
                <X size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {selectedTest.jobRoles && selectedTest.jobRoles.length > 0 ? (
                <>
                  {/* Always show dropdown if jobRoles exist */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-shnoor-navy mb-2">
                      Select Job Role {selectedTest.jobRoles.length > 1 && `(${selectedTest.jobRoles.length} available)`}
                    </label>
                    <select
                      value={selectedJobRoleIndex}
                      onChange={(e) => setSelectedJobRoleIndex(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo bg-white text-shnoor-navy font-medium"
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
                      <div className="w-10 h-10 bg-shnoor-lavender rounded-lg flex items-center justify-center mr-3">
                        <FileText className="w-5 h-5 text-shnoor-indigo" />
                      </div>
                      <h4 className="text-lg font-bold text-shnoor-navy">Job Role</h4>
                    </div>
                    <div className="bg-shnoor-lavender/50 border-l-4 border-shnoor-indigo p-5 rounded-r-lg">
                      <p className="text-shnoor-navy font-bold text-xl">
                        {selectedTest.jobRoles[selectedJobRoleIndex]?.jobRole || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {selectedTest.jobRoles[selectedJobRoleIndex]?.jobDescription && (
                    <div>
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-shnoor-successLight rounded-lg flex items-center justify-center mr-3">
                          <BookOpen className="w-5 h-5 text-shnoor-success" />
                        </div>
                        <h4 className="text-lg font-bold text-shnoor-navy">Job Description</h4>
                      </div>
                      <div className="bg-white p-5 rounded-lg border border-shnoor-mist shadow-sm">
                        <p className="text-shnoor-indigoMedium whitespace-pre-wrap leading-relaxed text-base">
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
                      <div className="w-10 h-10 bg-shnoor-lavender rounded-lg flex items-center justify-center mr-3">
                        <FileText className="w-5 h-5 text-shnoor-indigo" />
                      </div>
                      <h4 className="text-lg font-bold text-shnoor-navy">Job Role</h4>
                    </div>
                    <div className="bg-shnoor-lavender/50 border-l-4 border-shnoor-indigo p-5 rounded-r-lg">
                      <p className="text-shnoor-navy font-bold text-xl">{selectedTest.jobRole}</p>
                    </div>
                  </div>

                  {selectedTest.description && (
                    <div>
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-shnoor-successLight rounded-lg flex items-center justify-center mr-3">
                          <BookOpen className="w-5 h-5 text-shnoor-success" />
                        </div>
                        <h4 className="text-lg font-bold text-shnoor-navy">Job Description</h4>
                      </div>
                      <div className="bg-white p-5 rounded-lg border border-shnoor-mist shadow-sm">
                        <p className="text-shnoor-indigoMedium whitespace-pre-wrap leading-relaxed text-base">{selectedTest.description}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-shnoor-navy">
                  <FileText className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>No job description available for this test</p>
                </div>
              )}
            </div>

            <div className="bg-shnoor-lavender px-6 py-4 flex justify-end border-t border-shnoor-mist">
              <button
                onClick={() => setShowJobModal(false)}
                className="px-6 py-2 bg-white border border-shnoor-mist hover:bg-shnoor-mist/30 text-shnoor-navy font-semibold rounded-lg transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-shnoor-navy shadow-sm h-auto sm:h-[72px] flex items-center sticky top-0 z-10 w-full py-3 sm:py-0">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center border-white/10 sm:border-transparent sm:h-16">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-white">
                <img
                  src={shnoorLogo}
                  alt="Shnoor Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-white font-bold text-base sm:text-lg leading-tight">Assessment Portal</h1>
                <p className="text-shnoor-light opacity-80 text-[10px] sm:text-xs">Student Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">Welcome, {studentName}</p>
                <p className="text-xs text-shnoor-soft">{capitalizeInstitute(institute)} • ID: {studentId}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center space-x-2 px-3 sm:px-5 py-2 !h-9 sm:!h-10 text-white bg-transparent border border-white/20 hover:bg-white/10 rounded-lg transition-colors text-xs sm:text-sm font-medium"
              >
                <LogOut size={16} className="hidden sm:block" />
                <LogOut size={14} className="sm:hidden" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation - COMMENTED OUT */}

        <div className="mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 scrollbar-hide">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-mist p-2 inline-flex min-w-max space-x-2">
            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${activeTab === 'tests'
                ? 'bg-shnoor-indigo text-white'
                : 'bg-white text-shnoor-indigoMedium hover:text-shnoor-navy hover:bg-shnoor-lavender'
                }`}
            >
              <BookOpen size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
              <span>My Tests</span>
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${activeTab === 'interviews'
                ? 'bg-shnoor-indigo text-white'
                : 'bg-white text-shnoor-indigoMedium hover:text-shnoor-navy hover:bg-shnoor-lavender'
                }`}
            >
              <Video size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Interviews</span>
            </button>
            <button
              onClick={() => setActiveTab('job-board')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${activeTab === 'job-board'
                ? 'bg-shnoor-indigo text-white'
                : 'bg-white text-shnoor-indigoMedium hover:text-shnoor-navy hover:bg-shnoor-lavender'
                }`}
            >
              <Briefcase size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Job Board</span>
            </button>
            <button
              onClick={() => setActiveTab('my-applications')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${activeTab === 'my-applications'
                ? 'bg-shnoor-indigo text-white'
                : 'bg-white text-shnoor-indigoMedium hover:text-shnoor-navy hover:bg-shnoor-lavender'
                }`}
            >
              <FileText size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
              <span>My Applications</span>
            </button>
          </div>
        </div>

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <>
            {/* <div className="mb-8">
              <h2 className="text-2xl font-bold text-shnoor-navy mb-2">Available Examinations</h2>
              <p className="text-shnoor-indigoMedium">Select a test to begin your assessment</p>
            </div> */}

            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shnoor-indigo"></div>
                <span className="ml-3 text-shnoor-indigoMedium">Loading...</span>
              </div>
            )}

            {error && (
              <div className="bg-shnoor-dangerLight border border-shnoor-dangerLight text-shnoor-danger px-4 py-3 rounded-lg mb-6 shadow-sm">
                {error}
              </div>
            )}

            {!loading && !error && availableTests.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-shnoor-mist shadow-[0_8px_30px_rgba(14,14,39,0.06)]">
                <BookOpen className="mx-auto h-12 w-12 text-shnoor-mist mb-4" />
                <h3 className="text-lg font-bold text-shnoor-navy">No Tests Available</h3>
                <p className="text-shnoor-indigoMedium mt-2">You have completed all available tests or there are no new assessments at this time.</p>
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
                  <div className="text-center py-8 sm:py-12 bg-white rounded-xl border border-shnoor-mist shadow-[0_8px_30px_rgba(14,14,39,0.06)] px-4">
                    <BookOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-shnoor-mist mb-4" />
                    <h3 className="text-base sm:text-lg font-bold text-shnoor-navy">No Tests Match Your Filters</h3>
                    <p className="text-sm sm:text-base text-shnoor-indigoMedium mt-2">Try adjusting your search or filters to see more tests.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {filteredTests.map((test) => {
                      // Determine card styling based on test status
                      let cardBgColor = 'bg-white';
                      let cardBorderColor = 'border-shnoor-indigo';
                      let cardOpacity = 'opacity-100';

                      if (test.isMockTest) {
                        cardBgColor = 'bg-shnoor-successLight';
                        cardBorderColor = 'border-shnoor-success';
                      } else if (test.testStatus === 'expired' || test.alreadyTaken) {
                        cardBgColor = 'bg-shnoor-lavender';
                        cardBorderColor = 'border-shnoor-mist';
                        cardOpacity = 'opacity-75';
                      } else if (test.testStatus === 'upcoming') {
                        cardBgColor = 'bg-shnoor-warningLight';
                        cardBorderColor = 'border-shnoor-warningLight';
                      }

                      return (
                        <div
                          key={test.id}
                          className={`${cardBgColor} border-2 ${cardBorderColor} rounded-xl p-6 ${cardOpacity} ${test.isAvailable && !test.alreadyTaken ? 'hover:shadow-[0_8px_30px_rgba(14,14,39,0.08)] hover:border-shnoor-indigo' : ''} transition-all duration-200`}
                        >
                          <div className="flex justify-between items-start mb-4 gap-3">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`inline-block px-3 py-1 ${test.isMockTest
                                  ? 'bg-shnoor-successLight text-shnoor-success'
                                  : test.testStatus === 'expired' || test.alreadyTaken
                                    ? 'bg-shnoor-mist text-shnoor-navy'
                                    : test.testStatus === 'upcoming'
                                      ? 'bg-shnoor-warningLight text-shnoor-warning'
                                      : 'bg-shnoor-lavender text-shnoor-indigo'
                                  } rounded-full text-xs font-semibold`}>
                                  {test.subject}
                                </span>
                                {test.isMockTest && (
                                  <span className="inline-block px-3 py-1 bg-shnoor-successLight text-shnoor-success rounded-full text-xs font-bold border border-shnoor-successLight">
                                    🎯 Mock Test
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-bold text-shnoor-navy break-words">{test.title}</h3>
                              {test.isMockTest && (
                                <p className="text-xs text-shnoor-success mt-1">Practice test to get familiar with the platform</p>
                              )}
                              {test.alreadyTaken && (
                                <span className="inline-block mt-2 px-3 py-1 bg-shnoor-dangerLight text-shnoor-danger rounded-full text-xs font-semibold">
                                  All Attempts Used ({test.attemptsTaken}/{test.maxAttempts})
                                </span>
                              )}
                              {test.testStatus === 'upcoming' && !test.alreadyTaken && (
                                <span className="inline-block mt-2 px-3 py-1 bg-shnoor-warningLight text-shnoor-warning rounded-full text-xs font-semibold">
                                  🕐 Upcoming
                                </span>
                              )}
                              {test.testStatus === 'expired' && !test.alreadyTaken && (
                                <span className="inline-block mt-2 px-3 py-1 bg-shnoor-lavender text-shnoor-navy rounded-full text-xs font-semibold">
                                  ⏰ Deadline Passed
                                </span>
                              )}
                              {test.isAvailable && !test.alreadyTaken && testsWithProgress.has(test.id) && (
                                <span className="inline-block mt-2 px-3 py-1 bg-shnoor-successLight text-shnoor-success rounded-full text-xs font-semibold">
                                  ⏸ In Progress
                                </span>
                              )}
                            </div>
                            <BookOpen className={`flex-shrink-0 mt-1 ${test.alreadyTaken || !test.isAvailable ? 'text-shnoor-mist' : test.testStatus === 'upcoming' ? 'text-shnoor-warning' : 'text-shnoor-indigo'}`} size={24} />
                          </div>

                          <div className="space-y-2 mb-6">
                            <div className="flex items-center text-sm text-shnoor-indigoMedium">
                              <Clock size={16} className="mr-2" />
                              <span>Duration: {test.duration} minutes</span>
                            </div>
                            <div className="flex items-center text-sm text-shnoor-indigoMedium">
                              <AlertCircle size={16} className="mr-2" />
                              <span>{test.questions} Questions • {test.difficulty} Level</span>
                            </div>
                            <div className="flex items-center text-sm text-shnoor-indigoMedium">
                              <BookOpen size={16} className="mr-2" />
                              <span>Attempts: {test.attemptsTaken}/{test.maxAttempts} ({test.attemptsRemaining} remaining)</span>
                            </div>
                            {test.startDateTime && (
                              <div className="flex items-center text-sm text-shnoor-indigoMedium">
                                <Clock size={16} className="mr-2" />
                                <span>Available from: {new Date(test.startDateTime).toLocaleString()}</span>
                              </div>
                            )}
                            {test.endDateTime && (
                              <div className="flex items-center text-sm text-shnoor-indigoMedium">
                                <Clock size={16} className="mr-2" />
                                <span>Available until: {new Date(test.endDateTime).toLocaleString()}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <button
                              onClick={() => handleViewJobDescription(test)}
                              className="w-full py-2.5 px-4 bg-shnoor-mist/20 hover:bg-shnoor-mist/40 text-shnoor-navy font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 border border-shnoor-mist"
                            >
                              <FileText size={18} />
                              <span>View Job Description</span>
                            </button>

                            <button
                              onClick={() => test.isAvailable && !test.alreadyTaken && handleTakeTest(test.id)}
                              disabled={!test.isAvailable || test.alreadyTaken}
                              className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors shadow-sm min-h-[44px] touch-manipulation ${test.alreadyTaken
                                ? 'bg-shnoor-mist/50 text-shnoor-navy cursor-not-allowed border border-shnoor-mist'
                                : test.testStatus === 'upcoming'
                                  ? 'bg-shnoor-warning text-white cursor-not-allowed'
                                  : test.testStatus === 'expired'
                                    ? 'bg-shnoor-mist/50 text-shnoor-navy cursor-not-allowed border border-shnoor-mist'
                                    : testsWithProgress.has(test.id)
                                      ? 'bg-shnoor-success hover:bg-shnoor-success text-white'
                                      : 'bg-shnoor-indigo hover:bg-[#4d4d9c] text-white'
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
          </>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <StudentInterviews />
        )}

        {/* Job Board Tab */}
        {activeTab === 'job-board' && (
          <JobBoard isEmbedded />
        )}

        {/* My Applications Tab */}
        {activeTab === 'my-applications' && (
          <MyApplications isEmbedded />
        )}

        {/* Info Section */}
        {(activeTab === 'tests' || activeTab === 'interviews') && (
          <div className="mt-12 bg-shnoor-lavender border-2 border-shnoor-mist rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-shnoor-navy mb-3">Important Instructions</h3>
            <ul className="space-y-2 text-sm text-shnoor-indigoMedium">
              <li className="flex items-start">
                <span className="mr-2 text-shnoor-indigo font-bold">•</span>
                Ensure you have a stable internet connection before starting
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-shnoor-indigo font-bold">•</span>
                All tests require fullscreen mode and prohibit tab switching
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-shnoor-indigo font-bold">•</span>
                Three warnings for tab switching will result in automatic submission
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-shnoor-indigo font-bold">•</span>
                Your progress is automatically saved - you can resume tests if interrupted
              </li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;