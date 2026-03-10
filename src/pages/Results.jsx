import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle, MessageSquare, Star } from 'lucide-react';

const Result = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { result, submissionReason } = location.state || {};
    
    const [feedback, setFeedback] = useState('');
    const [rating, setRating] = useState(0);
    const [difficulty, setDifficulty] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    useEffect(() => {
        // Exit fullscreen on result page
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => { });
        }
    }, []);

    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F8FB]">
                <div className="text-center bg-white p-8 rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-mist">
                    <h2 className="text-2xl font-bold text-shnoor-navy mb-4">No submission found</h2>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white font-bold rounded-lg transition-all shadow-sm hover:-translate-y-0.5"                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmitFeedback = async () => {
        setIsSubmitting(true);
        
        try {
            // Get studentId and testId from result object or fallback to localStorage
            const studentId = result.studentId || localStorage.getItem('studentId');
            const testId = result.testId || parseInt(localStorage.getItem('lastTestId'));
            
            if (!studentId || !testId) {
                alert('Missing student or test information. Please try submitting the exam again.');
                setIsSubmitting(false);
                return;
            }
            
            // Validate rating if provided (must be 1-5 or null/0 for not rated)
            const validRating = rating > 0 ? rating : null;
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    studentId: studentId,
                    testId: testId,
                    rating: validRating,
                    difficulty: difficulty || null,
                    feedbackText: feedback || null,
                    submissionReason: submissionReason
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setFeedbackSubmitted(true);
                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                alert('Failed to submit feedback: ' + data.message);
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkipFeedback = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-[#F8F8FB] py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.08)] border border-shnoor-mist overflow-hidden">
                {/* Header */}
                <div className="bg-shnoor-indigo p-8 text-center">
                    <div className="w-20 h-20 bg-shnoor-lavender rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                        <CheckCircle className="w-10 h-10 text-shnoor-indigo" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Exam Submitted Successfully!</h1>
                    <p className="text-white/80">Thank you for completing the assessment</p>
                </div>

                {/* Feedback Form or Thank You Message */}
                <div className="p-8">
                    {!feedbackSubmitted ? (
                        <>
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-shnoor-lavender rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare className="w-7 h-7 text-shnoor-indigo" />
                                </div>
                                <h2 className="text-2xl font-bold text-shnoor-navy mb-2">We Value Your Feedback</h2>
                                <p className="text-shnoor-indigoMedium">Help us improve your exam experience</p>
                            </div>

                            {/* Submission Info */}
                            {submissionReason && submissionReason !== 'manual' && (
                                <div className="bg-shnoor-warningLight border-l-4 border-shnoor-warning p-4 mb-6 rounded-r-lg">
                                    <p className="text-sm text-shnoor-warning font-medium">
                                        <strong>Note:</strong> This exam was auto-submitted due to: {
                                            submissionReason === 'time_up' ? 'Time expired' :
                                            submissionReason === 'tab_switch_violation' ? 'Multiple tab switch violations' :
                                            submissionReason
                                        }
                                    </p>
                                </div>
                            )}

                            {/* Rating */}
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-shnoor-navy mb-3">
                                    How would you rate this exam?
                                </label>
                                <div className="flex justify-center space-x-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none transition-all hover:scale-110 hover:-translate-y-1"
                                        >
                                            <Star
                                                size={40}
                                                className={`${star <= rating
                                                        ? 'fill-shnoor-warning text-shnoor-warning'
                                                        : 'text-shnoor-mist'
                                                    } transition-colors`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulty Level */}
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-shnoor-navy mb-3">
                                    How difficult was the exam?
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Easy', 'Medium', 'Hard'].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setDifficulty(level)}
                                            className={`py-3 px-4 rounded-xl font-bold transition-all shadow-sm ${difficulty === level
                                                    ? 'bg-shnoor-indigo text-white shadow-[0_0_15px_rgba(107,107,229,0.3)] -translate-y-0.5'
                                                    : 'bg-[#F8F8FB] text-shnoor-navy border border-shnoor-mist hover:border-shnoor-indigo hover:bg-shnoor-lavender hover:text-shnoor-indigo'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Feedback Text */}
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-shnoor-navy mb-2">
                                    Additional Comments (Optional)
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 border-2 border-shnoor-mist rounded-xl focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo resize-none transition-all text-shnoor-navy placeholder-shnoor-mist font-medium"
                                    placeholder="Share your thoughts about the exam, questions, or any suggestions..."
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleSubmitFeedback}
                                    disabled={isSubmitting}
                                    className="w-full py-3.5 bg-shnoor-indigo hover:bg-[#6b6be5] hover:shadow-[0_0_20px_rgba(107,107,229,0.4)] text-white font-bold rounded-xl transition-all shadow-sm hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                </button>

                                <button
                                    onClick={handleSkipFeedback}
                                    className="w-full py-3.5 border-2 border-shnoor-mist text-shnoor-navy font-bold rounded-xl hover:border-shnoor-indigo hover:bg-shnoor-lavender hover:text-shnoor-indigo transition-all shadow-sm"
                                >
                                    Skip &amp; Return to Dashboard
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Thank You Message After Feedback */}
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-shnoor-successLight rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <CheckCircle className="w-10 h-10 text-shnoor-success" />
                                </div>
                                <h2 className="text-2xl font-bold text-shnoor-navy mb-2">Thank You!</h2>
                                <p className="text-shnoor-indigoMedium mb-8">Your feedback has been submitted successfully</p>
                                
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-8 py-3 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white font-bold rounded-xl transition-all shadow-sm hover:-translate-y-0.5"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        </>
                    )}

                    {/* Footer Note */}
                    <p className="text-xs text-shnoor-indigoMedium text-center mt-6 font-medium">
                        Your exam has been recorded. Results will be shared by your administrator.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Result;