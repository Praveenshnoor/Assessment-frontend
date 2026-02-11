import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';


const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    rollNumber: '',
    email: '',
    institute: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    if (!formData.rollNumber.trim()) {
      newErrors.rollNumber = 'Roll number is required';
    } else if (!/^[a-zA-Z0-9-]+$/.test(formData.rollNumber)) {
      newErrors.rollNumber = 'Alphanumeric characters and hyphens only';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid institutional email';
    }
    if (!formData.institute.trim()) {
      newErrors.institute = 'Institute/University is required';
    } else if (formData.institute.length < 3) {
      newErrors.institute = 'Institute name must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Step 1: Register user in Firebase
      const { createUserWithEmailAndPassword, auth } = await import('../config/firebase');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Step 2: Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // Step 3: Send user data to backend with Firebase token
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          roll_number: formData.rollNumber.trim(),
          institute: formData.institute.trim().toLowerCase()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Success: Navigate to login page
      navigate('/login', {
        state: { message: 'Registration successful. Please sign in to begin.' }
      });

    } catch (error) {
      console.error('Registration error:', error);

      // Handle Firebase-specific errors
      if (error.code === 'auth/email-already-in-use') {
        setApiError('This email is already registered. Please login instead.');
      } else if (error.code === 'auth/weak-password') {
        setApiError('Password is too weak. Please use a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        setApiError('Invalid email address format.');
      } else {
        setApiError(error.message || 'Unable to complete registration. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 font-sans p-4 sm:p-6 overflow-auto">
      <div className="bg-white w-full max-w-[520px] p-6 sm:p-8 md:p-12 lg:p-14 flex flex-col justify-center rounded-lg shadow-xl border border-slate-200 relative my-4">
        <div className="text-center mb-6 sm:mb-8 md:mb-10 flex-shrink-0">
          <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-3 sm:mb-4">
            Secure Assessment Portal
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-slate-900 rounded-xl mx-auto mb-4 sm:mb-5 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-sm">
            EX
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight">Candidate Registration</h1>
          <p className="text-sm sm:text-[15px] text-slate-500 font-normal leading-relaxed px-2">
            Create your examination account
          </p>
        </div>

        {apiError && (
          <div className="bg-red-50 border-l-4 border-red-600 text-red-600 p-3 sm:p-4 rounded-r-md text-xs sm:text-sm font-medium flex items-center gap-2.5 mb-4 sm:mb-6 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
            </svg>
            <span className="break-words">{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5 md:gap-6 flex-1 justify-center">
          <div className="flex flex-col gap-2">
            <label className="text-xs sm:text-[13px] font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              Full Name <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              className={`w-full h-[48px] sm:h-[52px] px-4 sm:px-[18px] border-2 rounded-md text-sm sm:text-base text-slate-900 bg-white transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 placeholder:text-sm sm:placeholder:text-[15px] ${errors.fullName ? 'border-red-600 bg-red-50 focus:ring-red-600/10' : 'border-slate-200'
                }`}
              placeholder="As per official records"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="name"
            />
            {errors.fullName && (
              <span className="text-xs sm:text-[13px] text-red-600 font-medium flex items-center gap-1.5 mt-1">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
                </svg>
                {errors.fullName}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs sm:text-[13px] font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              Student Roll Number <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="text"
              name="rollNumber"
              className={`w-full h-[48px] sm:h-[52px] px-4 sm:px-[18px] border-2 rounded-md text-sm sm:text-base text-slate-900 bg-white transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 placeholder:text-sm sm:placeholder:text-[15px] ${errors.rollNumber ? 'border-red-600 bg-red-50 focus:ring-red-600/10' : 'border-slate-200'
                }`}
              placeholder="e.g., 2024CS001"
              value={formData.rollNumber}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="off"
            />
            {errors.rollNumber && (
              <span className="text-xs sm:text-[13px] text-red-600 font-medium flex items-center gap-1.5 mt-1">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
                </svg>
                {errors.rollNumber}
              </span>
            )}
            <span className="text-[10px] sm:text-xs text-slate-400 italic mt-1">This will be your permanent examination ID</span>
          </div>

          

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              Institute/University <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="text"
              name="institute"
              className={`w-full h-[52px] px-[18px] border-2 rounded-md text-base text-slate-900 bg-white transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 placeholder:text-[15px] ${errors.institute ? 'border-red-600 bg-red-50 focus:ring-red-600/10' : 'border-slate-200'
                }`}
              placeholder="e.g., MIT, Stanford University"
              value={formData.institute}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="organization"
            />
            {errors.institute && (
              <span className="text-red-600 text-[13px] font-medium flex items-center gap-1.5 mt-1">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
                </svg>
                {errors.institute}
              </span>
            )}
            <span className="text-xs text-slate-400 italic mt-1">Enter your institute or university name</span>
          </div>




          <div className="flex flex-col gap-2">
            <label className="text-xs sm:text-[13px] font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              Email Address <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="email"
              name="email"
              className={`w-full h-[48px] sm:h-[52px] px-4 sm:px-[18px] border-2 rounded-md text-sm sm:text-base text-slate-900 bg-white transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 placeholder:text-sm sm:placeholder:text-[15px] ${errors.email ? 'border-red-600 bg-red-50 focus:ring-red-600/10' : 'border-slate-200'
                }`}
              placeholder="student@institution.edu"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && (
              <span className="text-xs sm:text-[13px] text-red-600 font-medium flex items-center gap-1.5 mt-1">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
                </svg>
                {errors.email}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs sm:text-[13px] font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              Password <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="password"
              name="password"
              className={`w-full h-[48px] sm:h-[52px] px-4 sm:px-[18px] border-2 rounded-md text-sm sm:text-base text-slate-900 bg-white transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 placeholder:text-sm sm:placeholder:text-[15px] ${errors.password ? 'border-red-600 bg-red-50 focus:ring-red-600/10' : 'border-slate-200'
                }`}
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {errors.password && (
              <span className="text-xs sm:text-[13px] text-red-600 font-medium flex items-center gap-1.5 mt-1">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
                </svg>
                {errors.password}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs sm:text-[13px] font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              Confirm Password <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              className={`w-full h-[48px] sm:h-[52px] px-4 sm:px-[18px] border-2 rounded-md text-sm sm:text-base text-slate-900 bg-white transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 placeholder:text-sm sm:placeholder:text-[15px] ${errors.confirmPassword ? 'border-red-600 bg-red-50 focus:ring-red-600/10' : 'border-slate-200'
                }`}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <span className="text-xs sm:text-[13px] text-red-600 font-medium flex items-center gap-1.5 mt-1">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
                </svg>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <button
            type="submit"
            className={`w-full h-12 sm:h-14 mt-2 bg-slate-900 text-white rounded-md text-sm sm:text-base font-semibold uppercase tracking-wider shadow-sm hover:bg-slate-800 hover:-translate-y-px hover:shadow-md active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 ${isLoading ? 'text-transparent relative' : ''
              }`}
            disabled={isLoading}
          >
            {isLoading && (
              <div className="absolute top-1/2 left-1/2 -ml-2.5 -mt-2.5 w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isLoading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 flex-shrink-0">
          <div className="text-center text-sm sm:text-[15px] text-slate-500 font-medium">
            Already registered?{' '}
            <Link to="/login" className="text-blue-500 font-semibold no-underline ml-1 hover:text-blue-600 hover:underline transition-colors duration-200">
              Sign in to examination
            </Link>
          </div>

          <div className="h-px bg-slate-200 my-4 sm:my-6"></div>

          <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
              <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            </svg>
            <span className="break-words">Secure, proctored examination environment</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;