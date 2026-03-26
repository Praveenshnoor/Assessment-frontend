import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft, Briefcase, Loader2, RefreshCw, CheckCircle, Clock, FileText, AlertTriangle, XCircle, Trophy, PlayCircle, Award, ChevronDown } from 'lucide-react';
import { apiFetch } from '../config/api';

const STATUS_CONFIG = {
    submitted: { label: 'Submitted', color: 'blue', icon: FileText },
    screening: { label: 'Under Review', color: 'yellow', icon: Clock },
    assessment_assigned: { label: 'Assessment Assigned', color: 'purple', icon: AlertTriangle },
    assessment_completed: { label: 'Assessment Completed', color: 'indigo', icon: CheckCircle },
    shortlisted: { label: 'Shortlisted', color: 'green', icon: Trophy },
    rejected: { label: 'Not Selected', color: 'red', icon: XCircle }
};

const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
    const Icon = config.icon;

    const colorClasses = {
        blue: 'bg-shnoor-lavender text-shnoor-indigo border-shnoor-mist',
        yellow: 'bg-shnoor-warningLight text-shnoor-warning border-shnoor-warningLight',
        purple: 'bg-shnoor-lavender border-shnoor-indigo text-shnoor-navy',
        indigo: 'bg-shnoor-indigo text-white border-shnoor-indigo',
        green: 'bg-shnoor-successLight text-shnoor-success border-shnoor-successLight',
        red: 'bg-shnoor-dangerLight text-shnoor-danger border-shnoor-dangerLight'
    };

    return (
        <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${colorClasses[config.color]}`}>
            <Icon size={14} />
            <span>{config.label}</span>
        </span>
    );
};

const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export default function MyApplications({ isEmbedded = false }) {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedAppId, setExpandedAppId] = useState(null);
    const [appTests, setAppTests] = useState({}); // Map applicationId -> tests array
    const [loadingTests, setLoadingTests] = useState({});

    const [studentName, setStudentName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [institute, setInstitute] = useState('');

    const capitalizeInstitute = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const fetchApplications = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('studentAuthToken');
            const res = await apiFetch('/api/job-applications/my-applications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                setApplications(data.data);
            } else {
                setError(data.message || 'Failed to load applications');
            }
        } catch {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTestsForApplication = async (applicationId) => {
        if (appTests[applicationId]) return; // Already fetched

        setLoadingTests(prev => ({ ...prev, [applicationId]: true }));

        try {
            const token = localStorage.getItem('studentAuthToken');
            console.log('Fetching tests for application:', applicationId);

            const res = await apiFetch(`/api/job-applications/${applicationId}/tests`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 401) {
                localStorage.clear();
                navigate('/login');
                return;
            }

            const data = await res.json();
            console.log('Tests response:', data);

            if (data.success) {
                console.log('Setting tests:', data.tests);
                setAppTests(prev => ({ ...prev, [applicationId]: Array.isArray(data.tests) ? data.tests : [] }));
            } else {
                console.error('Failed to fetch tests:', data.message);
            }
        } catch (error) {
            console.error('Failed to fetch tests - error:', error);
        } finally {
            setLoadingTests(prev => ({ ...prev, [applicationId]: false }));
        }
    };

    const handleToggleExpand = (applicationId) => {
        const newExpandedId = expandedAppId === applicationId ? null : applicationId;
        setExpandedAppId(newExpandedId);

        if (newExpandedId) {
            fetchTestsForApplication(newExpandedId);
        }
    };

    const handleTakeTest = (testId, applicationId) => {
        localStorage.setItem('selectedTestId', testId);
        localStorage.setItem('currentApplicationId', applicationId);
        navigate('/instructions');
    };

    // Determine the display status based on test completion
    const getDisplayStatus = (app) => {
        // If status is assessment_assigned, check if all tests are completed
        if (app.status === 'assessment_assigned') {
            const totalTests = parseInt(app.total_tests) || 0;
            const completedTests = parseInt(app.completed_tests) || 0;

            if (totalTests > 0 && completedTests >= totalTests) {
                return 'assessment_completed';
            }
        }

        return app.status;
    };

    useEffect(() => {
        setStudentName(localStorage.getItem('studentName') || 'Student');
        setStudentId(localStorage.getItem('studentId') || '');
        setInstitute(localStorage.getItem('institute') || '');
        fetchApplications();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const getTestProgress = (app) => {
        const total = parseInt(app.total_tests) || 0;
        const completed = parseInt(app.completed_tests) || 0;

        if (total === 0) return { text: 'No tests assigned', percentage: 0 };

        const percentage = (completed / total) * 100;
        return {
            text: `${completed}/${total} tests completed`,
            percentage,
            isComplete: completed === total
        };
    };

    return (
        <div className={isEmbedded ? "w-full font-sans" : "min-h-screen bg-[#F8F8FB] font-sans"}>
            {!isEmbedded && (
                <header className="bg-shnoor-navy shadow-sm h-[72px] flex items-center sticky top-0 z-10 w-full">
                    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-shnoor-lavender rounded-xl flex items-center justify-center shadow-sm">
                                    <span className="text-shnoor-indigo font-bold text-xl">A</span>
                                </div>
                                <div>
                                    <h1 className="text-white font-bold text-lg leading-tight">Assessment Portal</h1>
                                    <p className="text-shnoor-light opacity-80 text-xs">My Applications</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 sm:space-x-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-white">Welcome, {studentName}</p>
                                    <p className="text-xs text-shnoor-soft">{capitalizeInstitute(institute)} • ID: {studentId}</p>
                                </div>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="flex items-center justify-center space-x-2 px-3 sm:px-5 py-2 !h-10 w-10 sm:w-auto text-white bg-shnoor-indigo border border-shnoor-indigo hover:bg-[#4d4d9c] rounded-lg transition-colors text-sm font-semibold"
                                    title="Back to Dashboard"
                                >
                                    <ArrowLeft size={16} />
                                    <span className="hidden sm:inline">Back to Dashboard</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center space-x-2 px-3 sm:px-5 py-2 !h-10 w-10 sm:w-auto text-white bg-transparent border border-white/20 hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
                                    title="Logout"
                                >
                                    <LogOut size={16} />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
            )}

            <main className={isEmbedded ? "" : "w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
                {/* Page heading */}
                {!isEmbedded && (
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-shnoor-navy mb-2">
                            📋 Application Tracker
                        </h1>
                        <p className="text-shnoor-indigoMedium">
                            Track your job applications, assessment progress, and status updates
                        </p>
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center justify-center py-20 text-shnoor-indigoMedium">
                        <Loader2 size={32} className="animate-spin mr-3" />
                        <span>Loading your applications...</span>
                    </div>
                )}

                {/* Error state */}
                {!loading && error && (
                    <div className="text-center py-16">
                        <p className="text-red-600 font-medium mb-4">{error}</p>
                        <button
                            onClick={fetchApplications}
                            className="flex items-center space-x-2 mx-auto px-5 py-2.5 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            <RefreshCw size={16} />
                            <span>Retry</span>
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && applications.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-shnoor-mist shadow-[0_8px_30px_rgba(14,14,39,0.06)]">
                        <Briefcase size={64} className="mx-auto mb-4 text-shnoor-mist" />
                        <p className="font-bold text-xl text-shnoor-navy mb-2">
                            No Applications Yet
                        </p>
                        <p className="text-sm text-shnoor-indigoMedium mb-6">
                            Start applying to job openings to see them tracked here
                        </p>
                        <button
                            onClick={() => navigate('/job-board')}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white rounded-lg font-bold transition-all shadow-sm"
                        >
                            <Briefcase size={18} />
                            <span>Browse Job Openings</span>
                        </button>
                    </div>
                )}

                {/* Applications list */}
                {!loading && !error && applications.length > 0 && (
                    <div className="space-y-6">
                        <p className="text-sm text-shnoor-indigoMedium font-medium">
                            {applications.length} application{applications.length !== 1 ? 's' : ''}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            {applications.map((app) => {
                                const testProgress = getTestProgress(app);

                                return (
                                    <div
                                        key={app.application_id}
                                        className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border-2 border-shnoor-indigo overflow-hidden transition-all duration-200 hover:shadow-[0_8px_30px_rgba(14,14,39,0.08)]"
                                    >
                                        {/* Card header */}
                                        <div className="bg-shnoor-lavender/50 border-b border-shnoor-mist px-6 py-5">
                                            <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                                                <div className="w-full sm:w-auto">
                                                    <h3 className="text-xl font-bold text-shnoor-navy break-words">
                                                        {app.job_role}
                                                    </h3>
                                                    <p className="text-shnoor-indigoMedium text-sm mt-1 break-words">
                                                        {app.company_name}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 mt-1 sm:mt-0">
                                                    <StatusBadge status={getDisplayStatus(app)} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card body */}
                                        <div className="p-6 space-y-4">
                                            {/* Application timeline */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-shnoor-indigoMedium mb-1">
                                                        Applied On
                                                    </p>
                                                    <p className="text-sm font-semibold text-shnoor-navy">
                                                        {fmtDate(app.applied_at)}
                                                    </p>
                                                </div>

                                                {app.test_assigned_at && (
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-shnoor-indigoMedium mb-1">
                                                            Tests Assigned
                                                        </p>
                                                        <p className="text-sm font-semibold text-shnoor-navy">
                                                            {fmtDate(app.test_assigned_at)}
                                                        </p>
                                                    </div>
                                                )}

                                                {app.assessment_score !== null && (
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-shnoor-indigoMedium mb-1">
                                                            Assessment Score
                                                        </p>
                                                        <p className="text-sm font-semibold text-shnoor-navy">
                                                            {parseFloat(app.assessment_score).toFixed(1)}%
                                                            {app.passed_assessment && (
                                                                <span className="ml-2 text-green-600">✓ Passed</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Test progress */}
                                            {app.total_tests > 0 && (
                                                <div className="bg-shnoor-lavender rounded-xl p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-semibold text-shnoor-navy">
                                                            Assessment Progress
                                                        </span>
                                                        <span className={`text-sm font-bold ${testProgress.isComplete ? 'text-green-600' : 'text-shnoor-indigo'}`}>
                                                            {testProgress.text}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-shnoor-mist rounded-full h-2.5">
                                                        <div
                                                            className="bg-shnoor-indigo h-2.5 rounded-full transition-all duration-500"
                                                            style={{ width: `${testProgress.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tests section - expandable */}
                                            {app.total_tests > 0 && (
                                                <div className="border border-shnoor-mist rounded-xl overflow-hidden mt-2">
                                                    <button
                                                        onClick={() => handleToggleExpand(app.application_id)}
                                                        className="w-full px-4 py-3 bg-white hover:bg-shnoor-lavender/50 transition-all flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <FileText size={18} className="text-shnoor-indigo" />
                                                            <span className="font-semibold text-shnoor-navy">
                                                                View Assessment Tests ({app.total_tests})
                                                            </span>
                                                        </div>
                                                        <ChevronDown
                                                            size={20}
                                                            className={`text-shnoor-indigoMedium transition-transform ${expandedAppId === app.application_id ? 'rotate-180' : ''
                                                                }`}
                                                        />
                                                    </button>

                                                    {expandedAppId === app.application_id && (
                                                        <div className="p-4 bg-white">
                                                            {loadingTests[app.application_id] ? (
                                                                <div className="flex items-center justify-center py-8 text-shnoor-indigoMedium">
                                                                    <Loader2 size={24} className="animate-spin mr-2" />
                                                                    <span>Loading tests...</span>
                                                                </div>
                                                            ) : appTests[app.application_id]?.length > 0 ? (
                                                                <div className="space-y-3">
                                                                    {appTests[app.application_id].map((test, idx) => (
                                                                        <div
                                                                            key={test.test_id}
                                                                            className={`border rounded-lg p-4 transition-all ${test.is_completed
                                                                                    ? 'border-shnoor-success bg-shnoor-successLight'
                                                                                    : 'border-shnoor-mist bg-white hover:shadow-md'
                                                                                }`}
                                                                        >
                                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                                                <div className="flex-1 w-full sm:w-auto">
                                                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                                        <span className="font-bold text-shnoor-navy break-words">
                                                                                            {idx + 1}. {test.test_name}
                                                                                        </span>
                                                                                        {test.is_completed && (
                                                                                            <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1 shrink-0">
                                                                                                <CheckCircle size={12} />
                                                                                                <span>Completed</span>
                                                                                            </span>
                                                                                        )}
                                                                                        {test.is_mandatory && (
                                                                                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold shrink-0">
                                                                                                Required
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-xs text-shnoor-indigoMedium space-y-1">
                                                                                        <p>⏱ {test.duration} min • {test.question_count} questions • {test.total_marks} marks</p>
                                                                                    </div>
                                                                                </div>
                                                                                {!test.is_completed && (
                                                                                    <button
                                                                                        onClick={() => handleTakeTest(test.test_id, app.application_id)}
                                                                                        className="w-full sm:w-auto flex justify-center items-center space-x-2 px-4 py-2 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white rounded-lg font-bold transition-all shadow-sm text-sm shrink-0 mt-2 sm:mt-0"
                                                                                    >
                                                                                        <PlayCircle size={16} />
                                                                                        <span>Take Test</span>
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-6 text-shnoor-indigoMedium">
                                                                    <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                                                                    <p className="text-sm">No tests found for this application</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {app.status === 'shortlisted' && (
                                                <div className="bg-shnoor-successLight border border-shnoor-success rounded-xl p-4 flex items-start space-x-3 mt-4">
                                                    <Trophy size={20} className="text-shnoor-success mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-bold text-shnoor-success mb-1">
                                                            🎉 Congratulations!
                                                        </p>
                                                        <p className="text-sm text-shnoor-success">
                                                            You've been shortlisted for this position. The recruitment team will contact you with next steps.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}