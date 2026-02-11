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
            document.exitFullscreen().catch(() => {});
        }
    }, []);

    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white p-8 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">No submission found</h2>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmitFeedback = async () => {
        setIsSubmitting(true);
        
        // Simulate API call - you can add actual backend endpoint later
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setFeedbackSubmitted(true);
        setIsSubmitting(false);
    };

    const handleSkipFeedback = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 p-8 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Exam Submitted Successfully!</h1>
                    <p className="text-white/90">Thank you for completing the assessment</p>
                </div>

                {/* Feedback Form or Thank You Message */}
                <div className="p-8">
                    {!feedbackSubmitted ? (
                        <>
                            <div className="text-center mb-8">
                                <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">We Value Your Feedback</h2>
                                <p className="text-gray-600">Help us improve your exam experience</p>
                            </div>

                            {/* Submission Info */}
                            {submissionReason && submissionReason !== 'manual' && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                                    <p className="text-sm text-yellow-800">
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
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    How would you rate this exam?
                                </label>
                                <div className="flex justify-center space-x-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={40}
                                                className={`${
                                                    star <= rating
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulty Level */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    How difficult was the exam?
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Easy', 'Medium', 'Hard'].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setDifficulty(level)}
                                            className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                                                difficulty === level
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Feedback Text */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional Comments (Optional)
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Share your thoughts about the exam, questions, or any suggestions..."
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleSubmitFeedback}
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                </button>

                                <button
                                    onClick={handleSkipFeedback}
                                    className="w-full py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                                >
                                    Skip & Return to Dashboard
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Thank You Message After Feedback */}
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                                <p className="text-gray-600 mb-8">Your feedback has been submitted successfully</p>
                                
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        </>
                    )}

                    {/* Footer Note */}
                    <p className="text-xs text-gray-500 text-center mt-6">
                        Your exam has been recorded. Results will be shared by your administrator.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Result;