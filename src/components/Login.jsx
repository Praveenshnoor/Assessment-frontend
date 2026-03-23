import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { apiFetch } from '../config/api';
import Button from './Button';
import InputField from './InputField';

const shnoorLogo = '/favicon.png';

// Eye icons
const EyeOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// Feature items shown on the left dark panel
const LEFT_FEATURES = [
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Secure Proctored Exams' },
  { icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', label: 'Live Camera Monitoring' },
  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Auto-Save & Timer' },
  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Instant Results & Reports' },
];


const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // For admin emails, try direct admin login first (more reliable)
      if (email.includes('@admin') || email.includes('admin@') || email.toLowerCase().includes('admin')) {
        try {
          const adminResponse = await apiFetch('api/admin/login', {
            method: 'POST',
            skipGlobalErrorRedirect: true,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email.trim(), password }),
          });

          const adminData = await adminResponse.json();

          if (adminResponse.ok && adminData.success) {
            // Admin login successful
            localStorage.setItem('adminToken', adminData.token);
            localStorage.setItem('adminUser', JSON.stringify(adminData.admin));
            navigate('/admin/dashboard');
            return;
          }
        } catch (adminError) {
          console.log('Direct admin login failed, trying Firebase...');
        }
      }

      // Step 1: Try Firebase Authentication (for both admin and student)
      try {
        const { signInWithEmailAndPassword, auth } = await import('../config/firebase');
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        // Get Firebase ID token
        const idToken = await userCredential.user.getIdToken();

        // Call backend to get user profile (admin or student)
        const response = await apiFetch('api/login', {
          method: 'POST',
          skipGlobalErrorRedirect: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Authentication failed');
        }

        // Extract user data, role, and JWT session token
        const { user, token, role } = data;

        if (!user || !token || !role) {
          throw new Error('Session data incomplete');
        }

        // Store JWT session token and redirect based on role
        if (role === 'admin') {
          localStorage.setItem('adminToken', token);
          localStorage.setItem('adminUser', JSON.stringify(user));
          navigate('/admin/dashboard');
        } else {
          localStorage.setItem('studentAuthToken', token);
          localStorage.setItem('studentId', user.id.toString());
          localStorage.setItem('studentName', user.full_name || '');
          localStorage.setItem('rollNumber', user.roll_number || '');
          localStorage.setItem('email', user.email || '');
          localStorage.setItem('institute', user.institute || '');
          
          navigate('/dashboard', {
            replace: true,
            state: {
              studentId: user.id,
              studentName: user.full_name
            }
          });
        }
        return; // Success, exit function

      } catch (firebaseError) {
        // If Firebase auth fails, try direct admin login (for admins not in Firebase)
        console.log('Firebase auth failed, trying direct admin login...');
        
        if (firebaseError.code === 'auth/invalid-credential' || 
            firebaseError.code === 'auth/user-not-found' ||
            firebaseError.code === 'auth/wrong-password' ||
            firebaseError.message?.includes('Failed to fetch dynamically imported module') ||
            firebaseError.message?.includes('Loading chunk')) {
          
          // Try direct admin login with bcrypt
          try {
            const adminResponse = await apiFetch('api/admin/login', {
              method: 'POST',
              skipGlobalErrorRedirect: true,
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email: email.trim(), password }),
            });

            const adminData = await adminResponse.json();

            if (adminResponse.ok && adminData.success) {
              // Admin login successful
              localStorage.setItem('adminToken', adminData.token);
              localStorage.setItem('adminUser', JSON.stringify(adminData.admin));
              navigate('/admin/dashboard');
              return;
            }
          } catch (adminError) {
            // Admin login also failed, throw original Firebase error
            throw firebaseError;
          }
        }
        
        // If it's not an auth error, throw it
        throw firebaseError;
      }

    } catch (error) {
      console.error('Login error:', error);

      // Handle timeout errors
      if (error.name === 'AbortError') {
        setApiError('Server is waking up. Please wait a moment and try again.');
      }
      // Handle Firebase-specific errors
      else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setApiError('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setApiError('Invalid email address format.');
      } else if (error.code === 'auth/too-many-requests') {
        setApiError('Too many failed login attempts. Please try again later.');
      } else if (error.message?.includes('Failed to fetch dynamically imported module') || error.message?.includes('Loading chunk')) {
        setApiError('Loading issue detected. Please refresh the page and try again.');
      } else {
        setApiError(error.message || 'Login failed. Please verify your credentials.');
      }
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
            <img src={shnoorLogo} alt="Shnoor" className="h-11 w-11 object-contain" width="44" height="44" loading="eager" fetchPriority="high" />
            <div>
              <p className="font-extrabold text-white text-lg leading-tight">SHNOOR Assessments</p>
              <p className="text-[11px] text-[#8F8FC4] uppercase tracking-widest font-semibold">Secure Examination Portal</p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
            Welcome back to<br />
            <span className="text-[#8F8FC4]">your portal</span>
          </h2>
          <p className="text-[#8F8FC4] text-sm leading-relaxed mb-10">
            Sign in to access your assigned assessments, track your progress, and complete recruitment tests.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-5">
            {LEFT_FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-shnoor-indigo/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#B7B7D9]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <span className="text-sm text-[#B7B7D9] font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 border-t border-white/10 pt-6">
          <p className="text-xs text-[#B7B7D9] italic leading-relaxed">
            "These measures ensure a fair and secure assessment process for all candidates."
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (white form) ───────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 overflow-auto">
        <div className="w-full max-w-[440px]">
          {/* Mobile brand header */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={shnoorLogo} alt="Shnoor" loading="lazy" className="h-9 w-9 object-contain" width="36" height="36" decoding="async" />
            <div>
              <p className="font-extrabold text-shnoor-navy text-base">SHNOOR Assessments</p>
              <p className="text-[10px] text-shnoor-indigoMedium uppercase tracking-widest">Secure Examination Portal</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-shnoor-navy mb-1">Sign In</h1>
            <p className="text-sm text-shnoor-indigoMedium">Enter your credentials </p>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <InputField
                label="Email Address"
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => { 
                  setEmail(e.target.value); 
                  if (errors.email) setErrors(p => ({ ...p, email: '' })); 
                  setApiError(''); 
                }}
                disabled={isLoading}
                autoComplete="username"
              />
              {errors.email && <p className="text-xs text-shnoor-danger mt-1">{errors.email}</p>}
            </div>

            <div className="relative">
              <InputField
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => { 
                  setPassword(e.target.value); 
                  if (errors.password) setErrors(p => ({ ...p, password: '' })); 
                  setApiError(''); 
                }}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[37px] text-shnoor-indigoMedium hover:text-shnoor-navy transition-colors p-1"
                tabIndex={-1}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff /> : <EyeOpen />}
              </button>
              {errors.password && <p className="text-xs text-shnoor-danger mt-1">{errors.password}</p>}
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full !h-[52px] text-base" 
              disabled={isLoading}
            >
              {isLoading && <div className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin" />}
              {isLoading ? 'Signing In...' : 'Sign In '}
            </Button>
          </form>

          {/* Footer links */}
          <div className="mt-8 pt-6 border-t border-shnoor-lavender">
            <p className="text-center text-sm text-shnoor-indigoMedium">
              New candidate?{' '}
              <Link to="/register" className="text-shnoor-indigo font-semibold hover:text-shnoor-navy transition-colors">
                Register for examination
              </Link>
            </p>
            <p className="text-center text-xs text-shnoor-indigoMedium mt-4 flex items-center justify-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              </svg>
              Secure, proctored examination environment
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;