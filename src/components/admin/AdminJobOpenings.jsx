// src/components/admin/AdminJobOpenings.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Send, Trash2, X, Building2, Clock, ExternalLink, CheckCircle, XCircle, Loader2, AlertCircle, ChevronDown, ChevronUp, Users, Link as LinkIcon, TestTube } from 'lucide-react';
import { apiFetch } from '../../config/api';

const EMPTY_FORM = {
    company_name: '',
    job_role: '',
    job_description: '',
    registration_deadline: '',
    eligibility_criteria: '',
    application_link: ''
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const adminHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`
});

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminJobOpenings() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [publishingId, setPublishingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }
    const [showTestLinkModal, setShowTestLinkModal] = useState(null); // jobId when modal open
    const [tests, setTests] = useState([]);
    const [linkedTests, setLinkedTests] = useState({});
    const [linkingTest, setLinkingTest] = useState(false);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4500);
    };

    // ── Fetch jobs ─────────────────────────────────────────────────────────
    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/job-openings', { headers: adminHeaders() });
            const data = await res.json();
            if (data.success) setJobs(data.data);
            else showToast('error', data.message || 'Failed to load jobs');
        } catch {
            showToast('error', 'Network error — could not load job openings.');
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Fetch all tests for linking ───────────────────────────────────────
    const fetchTests = async () => {
        try {
            const res = await apiFetch('/api/tests', { headers: adminHeaders() });
            const data = await res.json();
            if (data.success) {
                const testsFromApi = data.tests || data.data || [];
                const normalizedTests = testsFromApi.map((test) => ({
                    ...test,
                    display_name: test.test_name || test.title || test.name || 'Untitled Test',
                    display_duration: test.time_limit ?? test.duration ?? '—',
                    display_question_count: Number(test.question_count || 0),
                    display_total_marks: test.total_marks ?? '—'
                }));
                setTests(normalizedTests);
            }
        } catch (err) {
            console.error('Failed to fetch tests:', err);
            showToast('error', 'Failed to load tests');
        }
    };

    // ── Fetch linked tests for a job ──────────────────────────────────────
    const fetchLinkedTests = async (jobId) => {
        try {
            const res = await apiFetch(`/api/job-openings/${jobId}/linked-tests`, {
                headers: adminHeaders()
            });
            const data = await res.json();
            if (data.success) {
                setLinkedTests(prev => ({ ...prev, [jobId]: data.data }));
            }
        } catch (err) {
            console.error('Failed to fetch linked tests:', err);
        }
    };

    // ── Link test to job ───────────────────────────────────────────────────
    const handleLinkTest = async (jobId, testId) => {
        setLinkingTest(true);
        try {
            const res = await apiFetch(`/api/job-openings/${jobId}/link-test`, {
                method: 'POST',
                headers: adminHeaders(),
                body: JSON.stringify({
                    test_id: testId,
                    is_mandatory: true,
                    passing_criteria: 50
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast('success', 'Test linked successfully!');
                fetchLinkedTests(jobId);
            } else {
                showToast('error', data.message || 'Failed to link test');
            }
        } catch (err) {
            showToast('error', 'Network error');
        } finally {
            setLinkingTest(false);
        }
    };

    // ── Unlink test from job ───────────────────────────────────────────────
    const handleUnlinkTest = async (jobId, testId) => {
        if (!window.confirm('Remove this test from the job opening?')) return;

        try {
            const res = await apiFetch(`/api/job-openings/${jobId}/unlink-test/${testId}`, {
                method: 'DELETE',
                headers: adminHeaders()
            });
            const data = await res.json();
            if (data.success) {
                showToast('success', 'Test unlinked successfully');
                fetchLinkedTests(jobId);
            } else {
                showToast('error', data.message || 'Failed to unlink test');
            }
        } catch (err) {
            showToast('error', 'Network error');
        }
    };

    // ── Open test link modal ───────────────────────────────────────────────
    const openTestLinkModal = async (jobId) => {
        setShowTestLinkModal(jobId);
        if (tests.length === 0) await fetchTests();
        await fetchLinkedTests(jobId);
    };

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    // ── Create draft ───────────────────────────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await apiFetch('/api/job-openings', {
                method: 'POST',
                headers: adminHeaders(),
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                showToast('success', 'Job opening saved as draft. Press "Publish & Email" to notify students.');
                setForm(EMPTY_FORM);
                setShowForm(false);
                fetchJobs();
            } else {
                showToast('error', data.message || 'Failed to create job opening.');
            }
        } catch {
            showToast('error', 'Network error — could not create job opening.');
        } finally {
            setSaving(false);
        }
    };

    // ── Publish & send emails ──────────────────────────────────────────────
    const handlePublish = async (id) => {
        if (!window.confirm('This will send an email to ALL registered students. Proceed?')) return;
        setPublishingId(id);
        try {
            const res = await apiFetch(`/api/job-openings/${id}/publish`, {
                method: 'POST',
                headers: adminHeaders()
            });
            const data = await res.json();
            if (data.success) {
                const { emailsSent, emailsFailed, totalStudents } = data.stats;
                showToast(
                    'success',
                    `Published! ${emailsSent}/${totalStudents} emails sent${emailsFailed > 0 ? ` (${emailsFailed} failed)` : ''}.`
                );
                fetchJobs();
            } else {
                showToast('error', data.message || 'Failed to publish.');
            }
        } catch {
            showToast('error', 'Network error — could not publish.');
        } finally {
            setPublishingId(null);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this job opening permanently?')) return;
        setDeletingId(id);
        try {
            const res = await apiFetch(`/api/job-openings/${id}`, {
                method: 'DELETE',
                headers: adminHeaders()
            });
            const data = await res.json();
            if (data.success) {
                showToast('success', 'Job opening deleted.');
                fetchJobs();
            } else {
                showToast('error', data.message || 'Failed to delete.');
            }
        } catch {
            showToast('error', 'Network error — could not delete.');
        } finally {
            setDeletingId(null);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center space-x-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all
                    ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{toast.msg}</span>
                    <button onClick={() => setToast(null)}><X size={16} /></button>
                </div>
            )}

            {/* Header card */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-mist p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-shnoor-navy flex items-center">
                            <Briefcase className="mr-3 text-shnoor-indigo" size={28} />
                            Job Openings &amp; Off-Campus Hiring
                        </h2>
                        <p className="text-sm text-shnoor-indigoMedium mt-1">
                            Post new opportunities — students are notified automatically by email.
                        </p>
                    </div>
                    <button
                        onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }}
                        className="flex items-center space-x-2 px-5 py-3 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-xl font-semibold transition-all shadow-[0_8px_30px_rgba(14,14,39,0.1)] hover:shadow-[0_8px_30px_rgba(14,14,39,0.18)] transform hover:-translate-y-0.5"
                    >
                        {showForm ? <X size={20} /> : <Plus size={20} />}
                        <span>{showForm ? 'Cancel' : 'Post New Job'}</span>
                    </button>
                </div>
            </div>

            {/* Create form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-mist p-8">
                    <h3 className="text-xl font-bold text-shnoor-navy mb-6">New Job Opening</h3>
                    <form onSubmit={handleCreate} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-shnoor-navy mb-1.5">Company Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.company_name}
                                    onChange={e => setForm({ ...form, company_name: e.target.value })}
                                    placeholder="e.g. Google, Infosys, TCS"
                                    className="w-full border border-shnoor-mist rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shnoor-indigo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-shnoor-navy mb-1.5">Job Role *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.job_role}
                                    onChange={e => setForm({ ...form, job_role: e.target.value })}
                                    placeholder="e.g. Software Engineer, Data Analyst"
                                    className="w-full border border-shnoor-mist rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shnoor-indigo"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-shnoor-navy mb-1.5">Job Description *</label>
                            <textarea
                                required
                                rows={4}
                                value={form.job_description}
                                onChange={e => setForm({ ...form, job_description: e.target.value })}
                                placeholder="Describe the role, responsibilities, skills required…"
                                className="w-full border border-shnoor-mist rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shnoor-indigo resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-shnoor-navy mb-1.5">Eligibility Criteria *</label>
                            <textarea
                                required
                                rows={3}
                                value={form.eligibility_criteria}
                                onChange={e => setForm({ ...form, eligibility_criteria: e.target.value })}
                                placeholder="e.g. B.Tech CSE/IT, CGPA ≥ 7.0, No active backlogs…"
                                className="w-full border border-shnoor-mist rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shnoor-indigo resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-shnoor-navy mb-1.5">Registration Deadline *</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={form.registration_deadline}
                                    onChange={e => setForm({ ...form, registration_deadline: e.target.value })}
                                    className="w-full border border-shnoor-mist rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shnoor-indigo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-shnoor-navy mb-1.5">Application Link *</label>
                                <input
                                    type="url"
                                    required
                                    value={form.application_link}
                                    onChange={e => setForm({ ...form, application_link: e.target.value })}
                                    placeholder="https://company.com/careers/apply"
                                    className="w-full border border-shnoor-mist rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shnoor-indigo"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center space-x-2 px-8 py-3 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-xl font-semibold transition-all disabled:opacity-60"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                <span>{saving ? 'Saving…' : 'Save as Draft'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Jobs list */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-mist overflow-hidden">
                <div className="px-8 py-5 border-b border-shnoor-mist">
                    <p className="text-sm font-semibold text-shnoor-navy">
                        {jobs.length} Job Posting{jobs.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-shnoor-indigoMedium">
                        <Loader2 size={28} className="animate-spin mr-3" />
                        <span>Loading job openings…</span>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-16 text-shnoor-indigoMedium">
                        <Briefcase size={40} className="mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No job postings yet.</p>
                        <p className="text-sm mt-1 opacity-70">Click "Post New Job" to add the first one.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-shnoor-mist">
                        {jobs.map(job => (
                            <div key={job.id} className="px-8 py-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                                            <h3 className="text-lg font-bold text-shnoor-navy truncate">{job.job_role}</h3>
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                                job.is_published
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {job.is_published ? '✓ Published' : '● Draft'}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-4 mt-1 text-sm text-shnoor-indigoMedium flex-wrap gap-y-1">
                                            <span className="flex items-center">
                                                <Building2 size={14} className="mr-1" />
                                                {job.company_name}
                                            </span>
                                            <span className="flex items-center">
                                                <Clock size={14} className="mr-1" />
                                                Deadline: {fmtDate(job.registration_deadline)}
                                            </span>
                                            {job.is_published && (
                                                <span className="flex items-center text-emerald-600">
                                                    <CheckCircle size={14} className="mr-1" />
                                                    {job.emails_sent ?? 0} emails sent
                                                    {parseInt(job.emails_failed) > 0 && (
                                                        <span className="ml-2 text-red-500 flex items-center">
                                                            <XCircle size={14} className="mr-1" />
                                                            {job.emails_failed} failed
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-2 shrink-0">
                                        <button
                                            onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                                            title="Toggle details"
                                            className="p-2 rounded-lg text-shnoor-indigoMedium hover:bg-shnoor-lavender transition-colors"
                                        >
                                            {expandedId === job.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>

                                        {job.is_published && (
                                            <>
                                                <button
                                                    onClick={() => navigate(`/admin/job-applicants/${job.id}`)}
                                                    title="View applicants"
                                                    className="flex items-center space-x-1.5 px-4 py-2 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                                                >
                                                    <Users size={16} />
                                                    <span>View Applicants</span>
                                                </button>

                                                <button
                                                    onClick={() => openTestLinkModal(job.id)}
                                                    title="Link tests to this job"
                                                    className="flex items-center space-x-1.5 px-4 py-2 bg-shnoor-indigoMedium hover:bg-shnoor-indigo text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                                                >
                                                    <TestTube size={16} />
                                                    <span>Link Tests</span>
                                                </button>
                                            </>
                                        )}

                                        {!job.is_published && (
                                            <button
                                                onClick={() => handlePublish(job.id)}
                                                disabled={publishingId === job.id}
                                                title="Publish & send emails"
                                                className="flex items-center space-x-1.5 px-4 py-2 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                                            >
                                                {publishingId === job.id
                                                    ? <Loader2 size={16} className="animate-spin" />
                                                    : <Send size={16} />}
                                                <span>{publishingId === job.id ? 'Sending…' : 'Publish & Email'}</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(job.id)}
                                            disabled={deletingId === job.id}
                                            title="Delete"
                                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                                        >
                                            {deletingId === job.id
                                                ? <Loader2 size={18} className="animate-spin" />
                                                : <Trash2 size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded details */}
                                {expandedId === job.id && (
                                    <div className="mt-4 space-y-3 text-sm text-shnoor-navy bg-shnoor-lavender rounded-xl p-5">
                                        <div>
                                            <p className="font-semibold text-shnoor-indigoMedium uppercase text-xs tracking-wider mb-1">Job Description</p>
                                            <p className="whitespace-pre-wrap">{job.job_description}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-shnoor-indigoMedium uppercase text-xs tracking-wider mb-1">Eligibility Criteria</p>
                                            <p className="whitespace-pre-wrap">{job.eligibility_criteria}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-shnoor-indigoMedium uppercase text-xs tracking-wider mb-1">Application Link</p>
                                            <a href={job.application_link} target="_blank" rel="noopener noreferrer"
                                                className="text-shnoor-indigo underline flex items-center space-x-1 break-all">
                                                <span>{job.application_link}</span>
                                                <ExternalLink size={13} />
                                            </a>
                                        </div>
                                        {job.published_at && (
                                            <div>
                                                <p className="font-semibold text-shnoor-indigoMedium uppercase text-xs tracking-wider mb-1">Published At</p>
                                                <p>{fmtDate(job.published_at)}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Test Link Modal */}
            {showTestLinkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-shnoor-indigo px-6 py-5 flex items-center justify-between sticky top-0 z-10">
                            <div className="flex items-center space-x-3">
                                <TestTube size={24} className="text-white" />
                                <h3 className="text-xl font-bold text-white">Link Tests to Job</h3>
                            </div>
                            <button
                                onClick={() => setShowTestLinkModal(null)}
                                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* All Tests - Single List with Toggle */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold uppercase text-shnoor-navy">
                                        Available Tests
                                    </h4>
                                    <div className="flex items-center space-x-2">
                                        <span className="bg-shnoor-successLight text-shnoor-success px-3 py-1 rounded-full text-xs font-bold border border-shnoor-successLight">
                                            {linkedTests[showTestLinkModal]?.length || 0} Linked
                                        </span>
                                        <span className="bg-shnoor-lavender text-shnoor-indigo px-3 py-1 rounded-full text-xs font-bold border border-shnoor-mist">
                                            {tests.length} Total
                                        </span>
                                    </div>
                                </div>

                                {tests.length === 0 ? (
                                    <div className="bg-shnoor-warningLight border border-shnoor-warning rounded-xl p-6 text-center">
                                        <AlertCircle size={32} className="mx-auto text-shnoor-warning mb-2" />
                                        <p className="text-sm text-shnoor-warning font-bold">No tests available</p>
                                        <p className="text-xs text-shnoor-navy mt-1">Create and publish tests from "Manage Exams" first</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                        {tests.map((test) => {
                                            const isLinked = linkedTests[showTestLinkModal]?.some(link => link.test_id === test.id);
                                            return (
                                                <div
                                                    key={test.id}
                                                    className={`flex items-center justify-between rounded-xl p-4 transition-all ${
                                                        isLinked 
                                                            ? 'bg-shnoor-successLight border-2 border-shnoor-success shadow-sm'
                                                            : 'bg-white border border-shnoor-mist hover:border-shnoor-indigo hover:shadow-md'
                                                    }`}
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            {isLinked && <CheckCircle size={18} className="text-green-600" />}
                                                            <p className="font-bold text-shnoor-navy">{test.display_name}</p>
                                                        </div>
                                                        <p className="text-xs text-shnoor-indigoMedium ml-6">
                                                            {test.display_duration} min • {test.display_question_count} questions • {test.display_total_marks} marks
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => isLinked 
                                                            ? handleUnlinkTest(showTestLinkModal, test.id)
                                                            : handleLinkTest(showTestLinkModal, test.id)
                                                        }
                                                        disabled={linkingTest}
                                                        className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm hover:shadow-md ${
                                                            isLinked
                                                                ? 'bg-shnoor-success hover:opacity-90 text-white'
                                                                : 'bg-shnoor-indigo hover:bg-[#4d4d9c] text-white'
                                                        }`}
                                                    >
                                                        {linkingTest ? (
                                                            <>
                                                                <Loader2 size={16} className="animate-spin" />
                                                                <span>{isLinked ? 'Unlinking...' : 'Linking...'}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {isLinked ? (
                                                                    <>
                                                                        <CheckCircle size={16} />
                                                                        <span>Linked</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <LinkIcon size={16} />
                                                                        <span>Link Test</span>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}