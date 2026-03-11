// src/pages/Feedback.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Send, X } from 'lucide-react';

const Feedback = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // console.log('Feedback:', { rating, feedback, studentId: localStorage.getItem('studentId') });
    setSubmitted(true);
    setTimeout(() => {
      localStorage.clear();
      navigate('/login');
    }, 2000);
  };

  const handleClose = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8FB] p-4">
        <div className="text-center bg-white p-8 sm:p-10 rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.08)] border border-shnoor-mist w-full max-w-md">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-shnoor-successLight rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 sm:w-10 sm:h-10 text-shnoor-success" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-shnoor-navy mb-2">Thank You!</h2>
          <p className="text-sm sm:text-base text-shnoor-indigoMedium font-medium">Your feedback has been recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FB] py-8 sm:py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.08)] border border-shnoor-mist p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-shnoor-navy">Test Feedback</h2>
          <button
            onClick={handleClose}
            className="text-shnoor-indigoMedium hover:text-shnoor-navy hover:bg-shnoor-mist/30 rounded-full p-1.5 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-shnoor-navy mb-3">
            How would you rate this test?
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`p-2 rounded-xl transition-all hover:scale-110 hover:-translate-y-1 ${rating >= star
                  ? 'bg-shnoor-warningLight text-shnoor-warning shadow-sm'
                  : 'bg-[#F8F8FB] text-shnoor-mist border border-shnoor-mist/50'
                  }`}
              >
                <Star size={24} fill={rating >= star ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-shnoor-navy mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="w-full p-3 border-2 border-shnoor-mist rounded-xl focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo transition-all text-shnoor-navy placeholder-shnoor-mist font-medium resize-none"
            placeholder="Tell us about your experience..."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3 sm:gap-0">
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="w-full sm:flex-1 py-3 bg-shnoor-indigo hover:bg-[#6b6be5] hover:shadow-[0_0_20px_rgba(107,107,229,0.4)] disabled:bg-shnoor-mist/50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
          >
            Submit Feedback
          </button>
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-3 border-2 border-shnoor-mist text-shnoor-navy font-bold rounded-xl hover:border-shnoor-indigo hover:bg-shnoor-lavender hover:text-shnoor-indigo transition-all"
          >
            Skip &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Feedback;