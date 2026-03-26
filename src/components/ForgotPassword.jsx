import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../config/api';
import Button from './Button';
import InputField from './InputField';

const shnoorLogo = '/favicon.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP, 3 = New Password
  
  // State variables for form fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State variable for the reset token
  const [resetToken, setResetToken] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setApiError('Please enter a valid email address');
      return;
    }
    
    setApiError('');
    setIsLoading(true);
    
    try {
      const response = await apiFetch('api/forgot-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccessMessage('OTP sent successfully to your email');
        setStep(2);
      } else {
        setApiError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      setApiError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length < 6) {
      setApiError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setApiError('');
    setSuccessMessage('');
    setIsLoading(true);
    
    try {
      const response = await apiFetch('api/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await response.json();
      
      if (response.ok && data.success && data.resetToken) {
        setResetToken(data.resetToken);
        setSuccessMessage('OTP verified successfully');
        setStep(3);
      } else {
        setApiError(data.message || 'Invalid or expired OTP');
      }
    } catch (error) {
      setApiError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setApiError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setApiError('Passwords do not match');
      return;
    }
    
    setApiError('');
    setSuccessMessage('');
    setIsLoading(true);
    
    try {
      const response = await apiFetch('api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        navigate('/login', { state: { message: 'Password has been reset successfully. Please log in with your new password.' } });
      } else {
        setApiError(data.message || 'Failed to reset password');
      }
    } catch (error) {
      setApiError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ── LEFT PANEL (dark) ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-shnoor-navy px-14 py-12 relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-[-60px] left-[-60px] w-72 h-72 rounded-full bg-shnoor-indigo opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[-40px] w-56 h-56 rounded-full bg-[#6868AC] opacity-15 blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <img src={shnoorLogo} alt="Shnoor" className="h-11 w-11 object-contain" width="44" height="44" />
            <div>
              <p className="font-extrabold text-white text-lg leading-tight">SHNOOR Assessments</p>
              <p className="text-[11px] text-[#8F8FC4] uppercase tracking-widest font-semibold">Secure Examination Portal</p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
            Recover your<br />
            <span className="text-[#8F8FC4]">account</span>
          </h2>
          <p className="text-[#8F8FC4] text-sm leading-relaxed mb-10">
            Forgot your password? No worries. Enter your email address to verify your identity and get back into your portal.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (white form) ───────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 overflow-auto">
        <div className="w-full max-w-[440px]">
          {/* Mobile brand header */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={shnoorLogo} alt="Shnoor" className="h-9 w-9 object-contain" />
            <div>
              <p className="font-extrabold text-shnoor-navy text-base">SHNOOR Assessments</p>
              <p className="text-[10px] text-shnoor-indigoMedium uppercase tracking-widest">Secure Examination Portal</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-shnoor-navy mb-1">Reset Password</h1>
            <p className="text-sm text-shnoor-indigoMedium">
               {step === 1 && "Enter your email to receive a verification OTP."}
               {step === 2 && "Enter the 6-digit OTP sent to your email."}
               {step === 3 && "Create a new secure password."}
            </p>
          </div>

          {/* Alerts */}
          {successMessage && (
            <div className="mb-5 flex items-start gap-3 bg-shnoor-successLight border border-shnoor-successLight text-shnoor-success rounded-xl px-4 py-3 text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.97 4.97a.75.75 0 0 0-1.08-.022L6.477 9.417 4.384 7.323a.75.75 0 0 0-1.06 1.06l2.75 2.75a.75.75 0 0 0 1.137-.089l4-5.5a.75.75 0 0 0-.24-1.573z" />
              </svg>
              {successMessage}
            </div>
          )}

          {apiError && (
            <div className="mb-5 flex items-start gap-3 bg-shnoor-dangerLight border border-shnoor-dangerLight text-shnoor-danger rounded-xl px-4 py-3 text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
              </svg>
              {apiError}
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-5">
              <InputField
                label="Email Address"
                id="email"
                type="email"
                placeholder="Enter your registered email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setApiError(''); }}
                disabled={isLoading}
              />
              <Button type="submit" variant="primary" className="w-full !h-[52px] text-base" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          )}

          {/* Step 2: OTP Input */}
          {step === 2 && (
            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
               <InputField
                label="6-Digit OTP"
                id="otp"
                type="text"
                placeholder="Enter OTP"
                required
                value={otp}
                onChange={(e) => { setOtp(e.target.value); setApiError(''); }}
                disabled={isLoading}
              />
              <Button type="submit" variant="primary" className="w-full !h-[52px] text-base" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <div className="text-center">
                 <button 
                   type="button" 
                   className="text-shnoor-indigo text-sm font-semibold hover:underline"
                   onClick={() => { setStep(1); setOtp(''); setApiError(''); setSuccessMessage(''); }}
                   disabled={isLoading}
                 >
                   Use a different email or resend OTP
                 </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password Input */}
          {step === 3 && (
            <form onSubmit={handlePasswordResetSubmit} className="flex flex-col gap-5">
              <InputField
                label="New Password"
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                required
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setApiError(''); }}
                disabled={isLoading}
              />
              <InputField
                label="Confirm Password"
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                required
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setApiError(''); }}
                disabled={isLoading}
              />
              <Button type="submit" variant="primary" className="w-full !h-[52px] text-base" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          {/* Footer links */}
          <div className="mt-8 pt-6 border-t border-shnoor-lavender">
            <p className="text-center text-sm text-shnoor-indigoMedium">
              Remember your password?{' '}
              <Link to="/login" className="text-shnoor-indigo font-semibold hover:text-shnoor-navy transition-colors">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
