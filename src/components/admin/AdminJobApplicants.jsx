// src/components/admin/AdminJobApplicants.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import {
    ArrowLeft, Users, Loader2, RefreshCw,
    CheckCircle, XCircle, AlertCircle, Trophy,
    UserCheck, ClipboardList, Download
} from 'lucide-react';
import { apiFetch } from '../../config/api';
import * as XLSX from 'xlsx';
import InterviewSchedule from '../../pages/admin/InterviewSchedule';

const STATUS_CONFIG = {
    submitted: { label: 'Submitted' },
    screening: { label: 'Screening' },
    assessment_assigned: { label: 'Assessment Assigned' },
    assessment_completed: { label: 'Assessment Done' },
    shortlisted: { label: 'Shortlisted' },
    rejected: { label: 'Rejected' }
};

const adminHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json'
});

export default function AdminJobApplicants() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [testResults, setTestResults] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('enrolled'); // 'enrolled' | 'results'
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [selectedInterviewCandidate, setSelectedInterviewCandidate] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiFetch(`/api/job-applications/admin/job/${jobId}/test-results`, {
                headers: adminHeaders()
            });
            const data = await res.json();
            if (data.success) {
                let filtered = data.data;
                if (statusFilter === 'passed') {
                    filtered = data.data.filter(i => i.passed === true);
                } else if (statusFilter === 'failed') {
                    filtered = data.data.filter(i => i.passed === false);
                } else if (statusFilter) {
                    filtered = data.data.filter(i => i.status === statusFilter);
                }
                setTestResults(filtered);
            } else {
                setError(data.message || 'Failed to load data');
            }

            const statsRes = await apiFetch(`/api/job-applications/admin/stats/${jobId}`, {
                headers: adminHeaders()
            });
            const statsData = await statsRes.json();
            if (statsData.success) setStats(statsData.data);
        } catch {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId, statusFilter]);

    const getAppStatusBadge = (status) => {
        const colorMap = {
            submitted: 'bg-shnoor-lavender text-shnoor-indigo border-shnoor-indigo',
            screening: 'bg-shnoor-warningLight text-shnoor-warning border-shnoor-warning',
            assessment_assigned: 'bg-shnoor-lavender text-shnoor-indigo border-shnoor-indigo',
            assessment_completed: 'bg-shnoor-navy text-white border-shnoor-navy',
            shortlisted: 'bg-shnoor-successLight text-shnoor-success border-shnoor-success',
            rejected: 'bg-shnoor-dangerLight text-shnoor-danger border-shnoor-danger',
        };
        const label = STATUS_CONFIG[status]?.label || status;
        return (
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${colorMap[status] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                {label}
            </span>
        );
    };

    const formatDate = (d) => {
        if (!d) return 'N/A';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getResultBadge = (passed, percentage) => {
        if (percentage === null || percentage === undefined)
            return <span className="text-shnoor-soft text-sm font-semibold">Not Attempted</span>;
        return passed
            ? <span className="inline-block px-3 py-1 rounded-lg text-sm font-bold bg-shnoor-successLight text-shnoor-success border border-shnoor-success">Pass</span>
            : <span className="inline-block px-3 py-1 rounded-lg text-sm font-bold bg-shnoor-dangerLight text-shnoor-danger border border-shnoor-danger">Fail</span>;
    };

    const getShortlistBadge = (status) => {
        if (status === 'shortlisted') {
            return <span className="inline-block px-3 py-1 rounded-lg text-sm font-bold bg-shnoor-successLight text-shnoor-success border border-shnoor-success">Shortlisted</span>;
        } else if (status === 'rejected') {
            return <span className="inline-block px-3 py-1 rounded-lg text-sm font-bold bg-shnoor-dangerLight text-shnoor-danger border border-shnoor-danger">Not Shortlisted</span>;
        }
        return <span className="text-xs text-gray-400 italic">Pending</span>;
    };

    const handleOpenInterviewSchedule = (row) => {
        if (row.status !== 'shortlisted') {
            alert('Only shortlisted candidates can be scheduled for interview.');
            return;
        }

        if (!row.test_id) {
            alert('Cannot schedule interview: no linked assessment test found for this row.');
            return;
        }

        setSelectedInterviewCandidate({
            student: {
                id: row.student_id,
                name: row.full_name,
                email: row.email
            },
            testId: row.test_id,
            applicationId: row.application_id
        });
        setShowInterviewModal(true);
    };

    const exportEnrolledStudents = () => {
        // Prepare enrolled students data for export
        const exportData = enrolledStudents.map(r => ({
            'Student ID': r.student_id,
            'Name': r.full_name,
            'Email': r.email,
            'Status': STATUS_CONFIG[r.status]?.label || r.status
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Set column widths
        ws['!cols'] = [
            { wch: 15 }, // Student ID
            { wch: 25 }, // Name
            { wch: 35 }, // Email
            { wch: 20 }  // Status
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Enrolled Students');

        // Generate file name with current date
        const fileName = `Enrolled_Students_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Save file
        XLSX.writeFile(wb, fileName);
    };

    const exportAssessmentResults = () => {
        // Prepare assessment results data for export
        const exportData = testResultRows.map(r => {
            const totalViolations = Number(r.no_face_count || 0) + Number(r.multi_face_count || 0) + 
                                   Number(r.phone_count || 0) + Number(r.noise_count || 0) + Number(r.voice_count || 0);
            const isFlagged = totalViolations > 5;

            return {
                'Student ID': r.student_id,
                'Student Name': r.full_name,
                'Email': r.email,
                'Test Name': r.test_name || 'N/A',
                'Date Attempted': formatDate(r.submitted_at),
                'Score': r.obtained_marks !== null ? `${parseFloat(r.obtained_marks).toFixed(2)}/${parseFloat(r.total_marks).toFixed(2)} (${parseFloat(r.percentage).toFixed(1)}%)` : 'Not attempted',
                'Test Status': r.passed ? 'Pass' : 'Fail',
                'Application Status': r.status === 'shortlisted' ? 'Shortlisted' : r.status === 'rejected' ? 'Not Shortlisted' : 'Pending',
                'No Face': r.no_face_count || 0,
                'Multi Faces': r.multi_face_count || 0,
                'Phone': r.phone_count || 0,
                'Noise': r.noise_count || 0,
                'Voice': r.voice_count || 0,
                'Total Violations': totalViolations,
                'Flagged': isFlagged ? 'Yes' : 'No'
            };
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Set column widths
        ws['!cols'] = [
            { wch: 15 }, // Student ID
            { wch: 25 }, // Student Name
            { wch: 30 }, // Email
            { wch: 30 }, // Test Name
            { wch: 15 }, // Date Attempted
            { wch: 25 }, // Score
            { wch: 15 }, // Test Status
            { wch: 20 }, // Application Status
            { wch: 10 }, // No Face
            { wch: 12 }, // Multi Faces
            { wch: 10 }, // Phone
            { wch: 10 }, // Noise
            { wch: 10 }, // Voice
            { wch: 15 }, // Total Violations
            { wch: 10 }  // Flagged
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Assessment Results');

        // Generate file name with current date
        const fileName = `Assessment_Results_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Save file
        XLSX.writeFile(wb, fileName);
    };

    // ── Derive the two data groups ──────────────────────────────────────────────
    const enrolledStudents = (() => {
        const seen = new Set();
        return testResults.filter(r => {
            const key = `${r.student_id}-${r.application_id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    })();

    const testResultRows = testResults.filter(r => r.test_id !== null && r.submitted_at !== null);

    // ── Tab config ──────────────────────────────────────────────────────────────
    const tabs = [
        {
            id: 'enrolled',
            label: 'Enrolled Students',
            icon: UserCheck,
            count: enrolledStudents.length,
        },
        {
            id: 'results',
            label: 'Assessment Results',
            icon: ClipboardList,
            count: testResultRows.length,
        },
    ];

    return (
        <AdminLayout title="Job Applicants">
            <div className="space-y-6">

                {/* ── Page Header ── */}
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-mist p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/admin/dashboard')}
                                className="p-2 hover:bg-shnoor-lavender rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold text-shnoor-navy flex items-center space-x-2">
                                    <Users size={24} />
                                    <span>Job Applicants</span>
                                </h2>
                                <p className="text-sm text-shnoor-indigoMedium mt-1">
                                    Review applications and manage candidates
                                </p>
                            </div>
                        </div>
                        <button onClick={fetchData} className="p-2 hover:bg-shnoor-lavender rounded-lg transition-colors" title="Refresh">
                            <RefreshCw size={20} />
                        </button>
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-shnoor-lavender border border-shnoor-mist rounded-xl p-4">
                                <p className="text-xs font-bold uppercase text-shnoor-indigo mb-1">Total</p>
                                <p className="text-2xl font-bold text-shnoor-navy">{stats.total_applications}</p>
                            </div>
                            <div className="bg-[#F8F8FB] border border-shnoor-indigo rounded-xl p-4">
                                <p className="text-xs font-bold uppercase text-shnoor-indigo mb-1">In Progress</p>
                                <p className="text-2xl font-bold text-shnoor-navy">{stats.assessment_assigned}</p>
                            </div>
                            <div className="bg-shnoor-successLight border border-shnoor-success rounded-xl p-4">
                                <p className="text-xs font-bold uppercase text-shnoor-success mb-1">Shortlisted</p>
                                <p className="text-2xl font-bold text-shnoor-success">{stats.shortlisted}</p>
                            </div>
                            <div className="bg-shnoor-dangerLight border border-shnoor-danger rounded-xl p-4">
                                <p className="text-xs font-bold uppercase text-shnoor-danger mb-1">Rejected</p>
                                <p className="text-2xl font-bold text-shnoor-danger">{stats.rejected || 0}</p>
                            </div>
                        </div>
                    )}

                    {/* Status Filter */}
                    <div className="mt-6">
                        <label className="block text-sm font-semibold text-shnoor-navy mb-2">Filter by Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-shnoor-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-shnoor-indigo text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="passed">Passed</option>
                            <option value="failed">Failed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20 text-shnoor-indigoMedium">
                        <Loader2 size={32} className="animate-spin mr-3" />
                        <span>Loading applicants...</span>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="text-center py-16">
                        <p className="text-red-600 font-medium mb-4">{error}</p>
                        <button onClick={fetchData} className="px-5 py-2.5 bg-shnoor-indigo text-white rounded-xl font-semibold">Retry</button>
                    </div>
                )}

                {/* Tab + Content */}
                {!loading && !error && (
                    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-mist overflow-hidden">

                        {/* ── Tab Bar ── */}
                        <div className="flex items-center justify-between border-b-2 border-shnoor-mist bg-white">
                            <div className="flex">
                                {tabs.map(tab => {
                                    const Icon = tab.icon;
                                    const active = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`relative flex items-center space-x-2.5 px-6 py-4 text-sm font-semibold transition-colors focus:outline-none
                                                ${active
                                                    ? 'text-shnoor-indigo border-b-2 border-shnoor-indigo bg-white -mb-px'
                                                    : 'text-shnoor-indigoMedium hover:text-shnoor-navy hover:bg-shnoor-lavender/40'
                                                }`}
                                        >
                                            <Icon size={16} />
                                            <span>{tab.label}</span>
                                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                                                ${active
                                                    ? 'bg-shnoor-indigo text-white'
                                                    : 'bg-shnoor-lavender text-shnoor-indigo'
                                                }`}>
                                                {tab.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Export Button */}
                            <div className="px-4">
                                {activeTab === 'enrolled' && enrolledStudents.length > 0 && (
                                    <button
                                        onClick={exportEnrolledStudents}
                                        className="px-4 py-2 bg-shnoor-indigo text-white font-semibold rounded-lg hover:bg-shnoor-indigoDark transition-colors flex items-center space-x-2"
                                    >
                                        <Download size={16} />
                                        <span className="text-sm">Export to Excel</span>
                                    </button>
                                )}
                                {activeTab === 'results' && testResultRows.length > 0 && (
                                    <button
                                        onClick={exportAssessmentResults}
                                        className="px-4 py-2 bg-shnoor-indigo text-white font-semibold rounded-lg hover:bg-shnoor-indigoDark transition-colors flex items-center space-x-2"
                                    >
                                        <Download size={16} />
                                        <span className="text-sm">Export to Excel</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ══════════════════════════════════════
                            TAB 1 — ENROLLED STUDENTS
                        ════════════════════════════════════════ */}
                        {activeTab === 'enrolled' && (
                            enrolledStudents.length === 0 ? (
                                <div className="text-center py-20">
                                    <UserCheck size={52} className="mx-auto mb-4 text-shnoor-indigoMedium opacity-25" />
                                    <p className="font-semibold text-xl text-shnoor-navy mb-2">No Enrolled Students</p>
                                    <p className="text-sm text-shnoor-indigoMedium">Applications will appear here once students apply</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-shnoor-indigo border-b border-shnoor-mist">
                                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">Student ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-shnoor-mist">
                                            {enrolledStudents.map((r, idx) => (
                                                <tr key={idx} className="hover:bg-shnoor-lavender/20 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-semibold text-shnoor-navy">{r.student_id}</td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-shnoor-navy">{r.full_name}</td>
                                                    <td className="px-6 py-4 text-sm text-shnoor-indigoMedium">{r.email}</td>
                                                    <td className="px-6 py-4">{getAppStatusBadge(r.status)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}

                        {/* ══════════════════════════════════════
                            TAB 2 — ASSESSMENT RESULTS
                        ════════════════════════════════════════ */}
                        {activeTab === 'results' && (
                            testResultRows.length === 0 ? (
                                <div className="text-center py-20">
                                    <ClipboardList size={52} className="mx-auto mb-4 text-shnoor-indigoMedium opacity-25" />
                                    <p className="font-semibold text-xl text-shnoor-navy mb-2">No Test Results Yet</p>
                                    <p className="text-sm text-shnoor-indigoMedium">Results will appear here once students complete their assessments</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-shnoor-indigo border-b border-shnoor-mist">
                                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">Student ID</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">Student Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">Email</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">Test Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">Date Attempted</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white">Score</th>
                                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Status</th>
                                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Shortlisted</th>
                                                    <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">No Face</th>
                                                    <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Multi Faces</th>
                                                    <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Phone</th>
                                                <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Noise</th>
                                                <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Voice</th>
                                                <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Total</th>
                                                <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Flagged</th>
                                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-shnoor-mist">
                                            {testResultRows.map((r, idx) => {
                                                const totalViolations = Number(r.no_face_count || 0) + Number(r.multi_face_count || 0) + 
                                                                       Number(r.phone_count || 0) + Number(r.noise_count || 0) + Number(r.voice_count || 0);
                                                const isFlagged = totalViolations > 5;

                                                return (
                                                    <tr key={idx} className={`hover:bg-shnoor-lavender/20 transition-colors ${isFlagged ? 'bg-red-50' : ''}`}>
                                                        <td className="px-4 py-4 text-sm font-semibold text-shnoor-navy">{r.student_id}</td>
                                                        <td className="px-4 py-4 text-sm font-semibold text-shnoor-navy">{r.full_name}</td>
                                                        <td className="px-4 py-4 text-sm text-shnoor-indigoMedium">{r.email}</td>
                                                        <td className="px-4 py-4 text-sm font-medium text-shnoor-indigo">{r.test_name || 'N/A'}</td>
                                                        <td className="px-4 py-4 text-sm text-shnoor-indigoMedium">{formatDate(r.submitted_at)}</td>
                                                        <td className="px-4 py-4">
                                                            {r.obtained_marks !== null && r.total_marks !== null ? (
                                                                <div>
                                                                    <span className={`text-sm font-bold ${r.passed ? 'text-shnoor-success' : 'text-shnoor-danger'}`}>
                                                                        {parseFloat(r.obtained_marks).toFixed(2)}
                                                                    </span>
                                                                    <span className="text-sm text-shnoor-soft"> /{parseFloat(r.total_marks).toFixed(2)}</span>
                                                                    <span className={`ml-2 text-sm font-semibold ${r.passed ? 'text-shnoor-success' : 'text-shnoor-danger'}`}>
                                                                        ({parseFloat(r.percentage).toFixed(1)}%)
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-shnoor-soft">Not attempted</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            {getResultBadge(r.passed, r.percentage)}
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            {getShortlistBadge(r.status)}
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <span className={`text-sm font-semibold ${r.no_face_count > 0 ? 'text-shnoor-danger' : 'text-shnoor-soft'}`}>
                                                                {r.no_face_count || 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <span className={`text-sm font-semibold ${r.multi_face_count > 0 ? 'text-shnoor-danger' : 'text-shnoor-soft'}`}>
                                                                {r.multi_face_count || 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <span className={`text-sm font-semibold ${r.phone_count > 0 ? 'text-shnoor-danger' : 'text-shnoor-soft'}`}>
                                                                {r.phone_count || 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <span className={`text-sm font-semibold ${r.noise_count > 0 ? 'text-shnoor-warning' : 'text-shnoor-soft'}`}>
                                                                {r.noise_count || 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <span className={`text-sm font-semibold ${r.voice_count > 0 ? 'text-shnoor-warning' : 'text-shnoor-soft'}`}>
                                                                {r.voice_count || 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <span className={`text-sm font-bold ${totalViolations > 5 ? 'text-shnoor-danger' : totalViolations > 0 ? 'text-shnoor-warning' : 'text-shnoor-success'}`}>
                                                                {totalViolations}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <span className={`text-sm font-semibold ${isFlagged ? 'text-shnoor-danger' : 'text-shnoor-soft'}`}>
                                                                {isFlagged ? 'Yes' : 'No'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <button
                                                                onClick={() => handleOpenInterviewSchedule(r)}
                                                                className={`inline-block px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors ${r.status === 'shortlisted' ? 'bg-shnoor-indigo hover:bg-shnoor-indigoDark' : 'bg-gray-400 cursor-not-allowed'}`}
                                                            >
                                                                Interview
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </div>
                )}

                {showInterviewModal && selectedInterviewCandidate && (
                    <InterviewSchedule
                        student={selectedInterviewCandidate.student}
                        testId={selectedInterviewCandidate.testId}
                        applicationId={selectedInterviewCandidate.applicationId}
                        onClose={() => {
                            setShowInterviewModal(false);
                            setSelectedInterviewCandidate(null);
                        }}
                        onScheduled={() => {
                            fetchData();
                        }}
                    />
                )}
            </div>
        </AdminLayout>
    );
}