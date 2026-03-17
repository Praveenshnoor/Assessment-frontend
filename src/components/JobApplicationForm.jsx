// src/components/JobApplicationForm.jsx
import { useState } from 'react';
import { X, Loader2, FileText, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { apiFetch } from '../config/api';

export default function JobApplicationForm({ job, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        resume_url: '',
        cover_letter: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [useExistingResume, setUseExistingResume] = useState(true);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const token = localStorage.getItem('studentAuthToken');
            const res = await apiFetch(`/api/job-applications/apply/${job.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    resume_url: useExistingResume ? null : formData.resume_url,
                    cover_letter: formData.cover_letter
                })
            });

            const data = await res.json();

            if (data.success) {
                onSuccess({
                    testsAssigned: data.data.testsAssigned,
                    status: data.data.status
                });
            } else {
                setError(data.message || 'Failed to submit application');
            }
        } catch (err) {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-shnoor-indigo px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Apply for Position</h2>
                        <p className="text-white/80 text-sm mt-1">{job.company_name} - {job.job_role}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                        disabled={submitting}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error Alert */}
                    {error && (
                        <div className="flex items-start space-x-3 bg-red-50 border border-red-200 rounded-xl p-4">
                            <AlertCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Resume Section */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-shnoor-navy uppercase tracking-wide">
                            <FileText size={16} className="inline mr-2" />
                            Resume
                        </label>

                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={useExistingResume}
                                    onChange={() => setUseExistingResume(true)}
                                    className="w-4 h-4 text-shnoor-indigo focus:ring-shnoor-indigo"
                                    disabled={submitting}
                                />
                                <span className="text-sm text-shnoor-navy">
                                    Use resume from my profile
                                    <span className="block text-xs text-shnoor-indigoMedium mt-1">
                                        (Your uploaded resume will be used automatically)
                                    </span>
                                </span>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!useExistingResume}
                                    onChange={() => setUseExistingResume(false)}
                                    className="w-4 h-4 text-shnoor-indigo focus:ring-shnoor-indigo"
                                    disabled={submitting}
                                />
                                <span className="text-sm text-shnoor-navy">
                                    Provide different resume URL
                                </span>
                            </label>

                            {!useExistingResume && (
                                <input
                                    type="url"
                                    value={formData.resume_url}
                                    onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
                                    placeholder="https://drive.google.com/your-resume.pdf"
                                    className="w-full px-4 py-2.5 border border-shnoor-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-shnoor-indigo text-sm"
                                    required={!useExistingResume}
                                    disabled={submitting}
                                />
                            )}
                        </div>

                        <p className="text-xs text-shnoor-indigoMedium">
                            💡 Tip: Make sure your resume is accessible via a public link (Google Drive, Dropbox, etc.)
                        </p>
                    </div>

                    {/* Cover Letter Section */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-shnoor-navy uppercase tracking-wide">
                            <MessageSquare size={16} className="inline mr-2" />
                            Cover Letter (Optional)
                        </label>
                        <textarea
                            value={formData.cover_letter}
                            onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                            placeholder="Why are you interested in this position? What makes you a good fit?&#10;&#10;This is your chance to make a great first impression..."
                            rows={8}
                            className="w-full px-4 py-3 border border-shnoor-mist rounded-xl focus:outline-none focus:ring-2 focus:ring-shnoor-indigo text-sm resize-none"
                            disabled={submitting}
                        />
                        <p className="text-xs text-shnoor-indigoMedium">
                            A well-written cover letter increases your chances of being shortlisted.
                        </p>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-shnoor-lavender border-2 border-shnoor-indigo rounded-xl p-4 shadow-sm">
                        <h4 className="font-bold text-sm text-shnoor-navy mb-2">📌 Important</h4>
                        <ul className="text-xs text-shnoor-navy space-y-1.5 list-disc list-inside">
                            <li>Your application will be reviewed by the recruitment team</li>
                            <li>If this job has linked assessments, tests will be automatically assigned to you</li>
                            <li>You'll receive email confirmation upon successful submission</li>
                            <li>Track your application status in the "My Applications" page</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-shnoor-mist">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-6 py-2.5 border border-shnoor-mist text-shnoor-navy rounded-xl font-semibold text-sm hover:bg-shnoor-lavender transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || (!useExistingResume && !formData.resume_url)}
                            className="px-6 py-2.5 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white rounded-lg font-bold text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={16} />
                                    <span>Submit Application</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}