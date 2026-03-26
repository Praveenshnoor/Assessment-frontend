// src/pages/JobBoard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Briefcase, Building2, Clock, ArrowLeft, Loader2, RefreshCw, Search, CheckCircle2, CheckCircle, X } from 'lucide-react';
import { apiFetch } from '../config/api';

const fmtDeadline = (iso) =>
    iso
        ? new Date(iso).toLocaleString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'No deadline specified';

const isExpiringSoon = (iso) => {
    if (!iso) return false;
    const ms = new Date(iso) - new Date();
    return ms > 0 && ms < 3 * 24 * 60 * 60 * 1000; // within 3 days
};

const isRegistrationClosed = (iso) => {
    if (!iso) return false;
    return new Date(iso) < new Date();
};



export default function JobBoard({ isEmbedded = false }) {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [applications, setApplications] = useState(new Map());
    const [enrollingJobs, setEnrollingJobs] = useState(new Set());
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState(null);

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

    const fetchJobsAndEnrollments = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch all published jobs (active + closed/expired)
            // Fallback to /public/active if backend is on older build and returns 404
            let jobsRes = await apiFetch('/api/job-openings/public/all');

            if (jobsRes.status === 404) {
                jobsRes = await apiFetch('/api/job-openings/public/active');
            }

            const jobsData = await jobsRes.json();

            if (!jobsRes.ok || !jobsData.success) {
                setError('Could not load job openings. Please try again.');
                setLoading(false);
                return;
            }

            let allJobs = Array.isArray(jobsData.data) ? [...jobsData.data] : [];
            const allJobIds = new Set(allJobs.map(job => job.id));

            // Fetch enrolled jobs (if authenticated)
            const token = localStorage.getItem('studentAuthToken');
            if (token) {
                try {
                    const enrolledRes = await apiFetch('/api/job-applications/my-applications', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const enrolledData = await enrolledRes.json();

                    if (enrolledRes.status === 401) {
                        localStorage.clear();
                        navigate('/login');
                        return;
                    }

                    if (enrolledData.success) {
                        const applicationsMap = new Map();
                        enrolledData.data.forEach(app => {
                            applicationsMap.set(app.job_opening_id, app);

                            // If enrolled job is not in published list, add it
                            if (!allJobIds.has(app.job_opening_id)) {
                                allJobs.push({
                                    id: app.job_opening_id,
                                    company_name: app.company_name,
                                    job_role: app.job_role,
                                    job_description: app.job_description,
                                    registration_deadline: app.registration_deadline,
                                    eligibility_criteria: app.eligibility_criteria,
                                    application_link: null,
                                    published_at: null,
                                    is_enrolled: true // Flag to indicate this is an enrolled job
                                });
                            }
                        });
                        setApplications(applicationsMap);
                    }
                } catch (err) {
                    console.error('Failed to fetch enrolled jobs:', err);
                }
            }

            setJobs(allJobs);
            setFiltered(allJobs);
        } catch {
            setError('Network error — could not reach the server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setStudentName(localStorage.getItem('studentName') || 'Student');
        setStudentId(localStorage.getItem('studentId') || '');
        setInstitute(localStorage.getItem('institute') || '');
        fetchJobsAndEnrollments();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Search filter
    useEffect(() => {
        const term = search.toLowerCase();
        setFiltered(
            jobs.filter(j =>
                (j.company_name || '').toLowerCase().includes(term) ||
                (j.job_role || '').toLowerCase().includes(term) ||
                (j.eligibility_criteria || '').toLowerCase().includes(term)
            )
        );
    }, [search, jobs]);

    const handleEnrollClick = async (job) => {
        const token = localStorage.getItem('studentAuthToken');
        if (!token) {
            navigate('/login?redirect=/job-board&message=Please login to enroll in jobs');
            return;
        }

        if (applications.has(job.id)) {
            return;
        }

        setEnrollingJobs(prev => new Set([...prev, job.id]));

        try {
            const res = await apiFetch(`/api/job-applications/apply/${job.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    resume_url: null,
                    cover_letter: ''
                })
            });

            const data = await res.json();

            if (data.success) {
                setApplications(prev => {
                    const newMap = new Map(prev);
                    newMap.set(job.id, {
                        job_opening_id: job.id,
                        status: data.data.status || 'submitted',
                        application_id: data.data.applicationId,
                        total_tests: data.data.testsAssigned || 0,
                        completed_tests: 0
                    });
                    return newMap;
                });

                setSuccessData({
                    jobRole: job.job_role,
                    companyName: job.company_name,
                    testsAssigned: data.data.testsAssigned || 0
                });
                setShowSuccessModal(true);
            } else {
                alert(data.message || 'Failed to enroll. Please try again.');
            }
        } catch (err) {
            console.error('Enrollment error:', err);
            alert('Network error. Please check your connection and try again.');
        } finally {
            setEnrollingJobs(prev => {
                const newSet = new Set(prev);
                newSet.delete(job.id);
                return newSet;
            });
        }
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
                                    <p className="text-shnoor-light opacity-80 text-xs">Job Board</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 sm:space-x-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-white">Welcome, {studentName}</p>
                                    <p className="text-xs text-shnoor-soft">{capitalizeInstitute(institute)} &bull; ID: {studentId}</p>
                                </div>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="flex items-center justify-center space-x-2 px-3 sm:px-5 py-2 text-white bg-shnoor-indigo border border-shnoor-indigo hover:bg-[#4d4d9c] rounded-lg transition-colors text-sm font-semibold w-10 sm:w-auto"
                                    title="Back to Dashboard"
                                >
                                    <ArrowLeft size={16} />
                                    <span className="hidden sm:inline">Back to Dashboard</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center space-x-2 px-3 sm:px-5 py-2 text-white bg-transparent border border-white/20 hover:bg-white/10 rounded-lg transition-colors text-sm font-medium w-10 sm:w-auto"
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
                            🎯 Job Openings &amp; Off-Campus Hiring
                        </h1>
                        <p className="text-shnoor-indigoMedium">
                            Opportunities posted by your placement team — apply before the deadline!
                        </p>
                    </div>
                )}

                {/* Search */}
                <div className="relative mb-6">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-shnoor-soft" />
                    <input
                        type="text"
                        placeholder="Search by company, role or eligibility…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-shnoor-mist rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-shnoor-indigo"
                    />
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center justify-center py-20 text-shnoor-indigoMedium">
                        <Loader2 size={32} className="animate-spin mr-3" />
                        <span>Loading job openings…</span>
                    </div>
                )}

                {/* Error state */}
                {!loading && error && (
                    <div className="text-center py-16">
                        <p className="text-red-600 font-medium mb-4">{error}</p>
                        <button onClick={fetchJobsAndEnrollments} className="flex items-center space-x-2 mx-auto px-5 py-2.5 bg-shnoor-indigo text-white rounded-xl text-sm font-semibold">
                            <RefreshCw size={16} /><span>Retry</span>
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && filtered.length === 0 && (
                    <div className="text-center py-20 text-shnoor-indigoMedium">
                        <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-semibold text-lg">
                            {search ? 'No results match your search.' : 'No active job openings right now.'}
                        </p>
                        <p className="text-sm mt-1 opacity-70">Check back soon — new opportunities are posted regularly.</p>
                    </div>
                )}

                {/* Job cards */}
                {!loading && !error && filtered.length > 0 && (
                    <div className="space-y-6">
                        <p className="text-sm text-shnoor-indigoMedium font-medium">
                            {filtered.length} opening{filtered.length !== 1 ? 's' : ''}
                            {search ? ` matching "${search}"` : ''}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            {filtered.map(job => (
                                <div
                                    key={job.id}
                                    className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border-2 border-shnoor-indigo overflow-hidden transition-all duration-200 hover:shadow-[0_8px_30px_rgba(14,14,39,0.08)]"
                                >
                                    {/* Card header */}
                                    <div className="bg-shnoor-lavender/50 border-b border-shnoor-mist px-6 py-5">
                                        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                                            <div className="w-full sm:w-auto">
                                                <h2 className="text-xl font-bold text-shnoor-navy break-words">{job.job_role}</h2>
                                                <p className="flex items-center space-x-1.5 mt-1 text-shnoor-indigoMedium text-sm flex-wrap">
                                                    <Building2 size={14} className="shrink-0" />
                                                    <span className="break-words">{job.company_name}</span>
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto mt-1 sm:mt-0">
                                                {!applications.has(job.id) && isExpiringSoon(job.registration_deadline) && (
                                                    <span className="bg-shnoor-warningLight text-shnoor-warning text-xs font-bold px-3 py-1 rounded-full border border-shnoor-warning whitespace-nowrap">
                                                        ⚡ Closing Soon
                                                    </span>
                                                )}
                                                {!applications.has(job.id) && isRegistrationClosed(job.registration_deadline) && (
                                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full border border-gray-300 whitespace-nowrap">
                                                        Registration Closed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card body */}
                                    <div className="px-6 py-5 space-y-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-shnoor-indigoMedium mb-1">Job Description</p>
                                            <p className="text-sm text-shnoor-navy whitespace-pre-wrap leading-relaxed">{job.job_description}</p>
                                        </div>

                                        <div className="h-px bg-shnoor-mist" />

                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-shnoor-indigoMedium mb-1">Eligibility Criteria</p>
                                            <p className="text-sm text-shnoor-navy whitespace-pre-wrap leading-relaxed">{job.eligibility_criteria}</p>
                                        </div>

                                        {/* Deadline banner - only show if not enrolled */}
                                        {!applications.has(job.id) && (
                                            <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-semibold
                                            ${isRegistrationClosed(job.registration_deadline)
                                                    ? 'bg-gray-100 border border-gray-300 text-gray-600'
                                                    : isExpiringSoon(job.registration_deadline)
                                                        ? 'bg-shnoor-warningLight border border-shnoor-warningLight text-shnoor-warning'
                                                        : 'bg-shnoor-lavender border border-shnoor-mist text-shnoor-indigo'
                                                }`}>
                                                <Clock size={16} />
                                                <span>
                                                    {isRegistrationClosed(job.registration_deadline)
                                                        ? `Registration closed on ${fmtDeadline(job.registration_deadline)}`
                                                        : `Deadline: ${fmtDeadline(job.registration_deadline)}`
                                                    }
                                                </span>
                                            </div>
                                        )}

                                        {/* Enroll / Status buttons */}
                                        {applications.has(job.id) ? (
                                            <div className="space-y-3">
                                                <div className="w-full py-3 bg-shnoor-successLight border-2 border-shnoor-success text-shnoor-success rounded-lg font-bold text-center flex items-center justify-center space-x-2">
                                                    <CheckCircle size={20} />
                                                    <span>Enrolled</span>
                                                </div>

                                                {applications.get(job.id).total_tests > applications.get(job.id).completed_tests && (
                                                    <button
                                                        onClick={() => navigate('/student/my-applications')}
                                                        className="w-full py-3 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white rounded-lg font-bold transition-all shadow-sm"
                                                    >
                                                        Take Pending Tests ({applications.get(job.id).total_tests - applications.get(job.id).completed_tests} remaining)
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => navigate('/student/my-applications')}
                                                    className="w-full py-3 border-2 border-shnoor-indigo text-shnoor-indigo rounded-lg font-bold hover:bg-shnoor-lavender transition-all"
                                                >
                                                    View Application Details
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEnrollClick(job)}
                                                disabled={enrollingJobs.has(job.id)}
                                                className="flex items-center justify-center space-x-2 w-full py-3.5 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white rounded-lg font-bold text-base transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {enrollingJobs.has(job.id) ? (
                                                    <>
                                                        <Loader2 size={18} className="animate-spin" />
                                                        <span>Enrolling...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 size={18} />
                                                        <span>Enroll Now</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Success Modal */}
            {showSuccessModal && successData && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
                    onClick={() => setShowSuccessModal(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-mist max-w-md w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-shnoor-success px-6 py-5 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Successfully Enrolled!</h3>
                                    <p className="text-white/80 text-sm">You're all set</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="bg-shnoor-successLight border border-shnoor-success text-shnoor-success rounded-xl p-4">
                                <p className="text-sm font-medium">
                                    You have been enrolled in <span className="font-bold">{successData.jobRole}</span> at <span className="font-bold">{successData.companyName}</span>.
                                </p>
                            </div>

                            {successData.testsAssigned > 0 && (
                                <div className="bg-shnoor-lavender border border-shnoor-indigo text-shnoor-navy rounded-xl p-4">
                                    <p className="text-sm font-semibold">
                                        🎯 {successData.testsAssigned} assessment{successData.testsAssigned !== 1 ? 's have' : ' has'} been assigned to you!
                                    </p>
                                    <p className="text-xs mt-2 text-shnoor-indigoMedium">
                                        Complete {successData.testsAssigned === 1 ? 'it' : 'them'} from your dashboard to proceed with your application.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={() => navigate('/student/my-applications')}
                                    className="w-full py-3 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white rounded-lg font-bold transition-all shadow-sm"
                                >
                                    View My Applications
                                </button>
                                {successData.testsAssigned > 0 && (
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full py-3 border-2 border-shnoor-indigo text-shnoor-indigo rounded-lg font-bold hover:bg-shnoor-lavender transition-all shadow-sm"
                                    >
                                        Go to Dashboard
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}