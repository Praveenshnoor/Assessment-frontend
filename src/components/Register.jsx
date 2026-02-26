import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../config/api';
import shnoorLogo from '../../public/favicon.png';
import Button from './Button';
import InputField from './InputField';

/* ─── Icon helpers ──────────────────────────────────────────────────────────── */
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

const FieldError = ({ msg }) => msg ? (
  <p className="text-xs text-shnoor-danger mt-1.5 flex items-center gap-1.5">
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
    </svg>
    {msg}
  </p>
) : null;

/* ─── Step metadata — 4 steps ───────────────────────────────────────────────── */
const STEP_META = [
  {
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    title: 'Personal Info',
    desc: 'Name, roll number & contact details',
  },
  {
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    title: 'Academic Details',
    desc: 'Course, institute & resume link',
  },
  {
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
    title: 'Account Setup',
    desc: 'Email address & secure password',
  },
  {
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Review & Confirm',
    desc: 'Verify your details before submitting',
  },
];

const TOTAL_STEPS = STEP_META.length; // 4
/* ─── Reusable Review Row ────────────────────────────────────────────────────── */
const ReviewRow = ({ label, value, hidden }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-shnoor-mist/50 last:border-0 gap-4">
    <span className="text-xs text-shnoor-soft font-medium flex-shrink-0 w-28">{label}</span>
    <span className={`text-sm text-shnoor-navy font-semibold text-right leading-snug ${hidden ? 'tracking-widest' : ''}`}>
      {hidden ? '••••••••' : (value || <span className="text-shnoor-soft italic font-normal">Not provided</span>)}
    </span>
  </div>
);

/* ─── Resume Link Row with text display ────────────────────────────────────── */
const ResumeLinkRow = ({ label, value }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-shnoor-mist/50 last:border-0 gap-4">
    <span className="text-xs text-shnoor-soft font-medium flex-shrink-0 w-28">{label}</span>
    <span className="text-sm text-shnoor-navy font-semibold text-right leading-snug">
      {value ? (
        <span className="text-xs break-all">
          {value.length > 40 ? value.slice(0, 40) + '…' : value}
        </span>
      ) : (
        <span className="text-shnoor-soft italic font-normal">Not provided</span>
      )}
    </span>
  </div>
);

/* ─── Review Section Card ────────────────────────────────────────────────────── */
const ReviewSection = ({ title, stepIndex, onEdit, children }) => (
  <div className="bg-white border border-shnoor-mist rounded-xl overflow-hidden shadow-sm">
    <div className="flex items-center justify-between px-5 py-3 bg-shnoor-lavender border-b border-shnoor-mist">
      <p className="text-xs font-extrabold text-shnoor-indigo uppercase tracking-widest">{title}</p>
      <Button
        type="button"
        onClick={() => onEdit(stepIndex)}
        className="flex items-center gap-1.5 text-xs font-bold text-shnoor-indigo hover:text-shnoor-navy transition-colors group"
      >
        <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Edit
      </Button>
    </div>
    <div className="px-5 py-1">{children}</div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────────── */
const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '', rollNumber: '', phone: '', address: '',
    institute: '', course: '', specialization: '', resumeLink: '',
    email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [institutes, setInstitutes] = useState([]);
  const [showInstituteDropdown, setShowInstituteDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('api/institutes/public', { method: 'GET' });
        const data = await res.json();
        if (data.success && data.institutes) setInstitutes(data.institutes);
      } catch { }
    })();
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowInstituteDropdown(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    setApiError('');
  };
  /* ── Per-step validation ─────────────────────────────────────────────── */
  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!formData.fullName.trim()) e.fullName = 'Full name is required';
      else if (formData.fullName.length < 3) e.fullName = 'Name must be at least 3 characters';
      if (!formData.rollNumber.trim()) e.rollNumber = 'Roll number is required';
      else if (!/^[a-zA-Z0-9-]+$/.test(formData.rollNumber)) e.rollNumber = 'Alphanumeric and hyphens only';
      if (!formData.phone.trim()) e.phone = 'Phone number is required';
      else if (!/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) e.phone = 'Enter a valid 10-digit number';
      if (!formData.address.trim()) e.address = 'Address is required';
    }
    if (s === 1) {
      if (!formData.institute.trim()) e.institute = 'Please select an institute';
      if (!formData.course.trim()) e.course = 'Course is required';
      if (!formData.specialization.trim()) e.specialization = 'Specialization is required';
      if (!formData.resumeLink.trim()) e.resumeLink = 'Resume link is required';
    }
    if (s === 2) {
      if (!formData.email.trim()) e.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Enter a valid email';
      if (!formData.password) e.password = 'Password is required';
      else if (formData.password.length < 8) e.password = 'Minimum 8 characters required';
      if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep(s => s + 1);
  };

  const goBack = () => {
    setErrors({});
    setStep(s => s - 1);
  };

  /* Jump to a specific step to edit — called from Review page */
  const jumpToStep = (targetStep) => {
    setErrors({});
    setStep(targetStep);
  };

  const handleSubmit = async () => {
    setApiError('');
    setIsLoading(true);
    try {
      const { createUserWithEmailAndPassword, auth } = await import('../config/firebase');
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const idToken = await userCredential.user.getIdToken();
      const response = await apiFetch('api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          roll_number: formData.rollNumber.trim(),
          institute: formData.institute.trim().toLowerCase(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          course: formData.course.trim(),
          specialization: formData.specialization.trim(),
          resume_link: formData.resumeLink.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      navigate('/login', { state: { message: 'Registration successful. Please sign in to begin.' } });
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') setApiError('This email is already registered. Please login instead.');
      else if (error.code === 'auth/weak-password') setApiError('Password is too weak. Please use a stronger password.');
      else if (error.code === 'auth/invalid-email') setApiError('Invalid email address format.');
      else setApiError(error.message || 'Unable to complete registration. Please try again.');
      // Jump back to account step on auth error
      if (error.code) setStep(2);
    } finally {
      setIsLoading(false);
    }
  };
  /* ── renderStep — plain function, NOT inner component ────────────────── */
  const renderStep = () => {
    /* STEP 0 — Personal Info */
    if (step === 0) return (
      <div className="flex flex-col gap-5">
        <div>
          <InputField label="Full Name" type="text" name="fullName" placeholder="As per official records" required
            value={formData.fullName} onChange={handleChange} disabled={isLoading} autoComplete="name" />
          <FieldError msg={errors.fullName} />
        </div>
        <div>
          <InputField label="Student Roll Number" type="text" name="rollNumber" placeholder="e.g., 2024CS001" required
            value={formData.rollNumber} onChange={handleChange} disabled={isLoading} autoComplete="off" />
          <FieldError msg={errors.rollNumber} />
        </div>
        <div>
          <InputField label="Phone Number" type="tel" name="phone" placeholder="e.g., 9876543210" required
            value={formData.phone} onChange={handleChange} disabled={isLoading} autoComplete="tel" maxLength="10" />
          <FieldError msg={errors.phone} />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-shnoor-navy mb-1.5 uppercase tracking-wide flex items-center gap-1 block">
            Address <span className="text-shnoor-danger">*</span>
          </label>
          <textarea name="address"
            className={`w-full h-[90px] px-4 py-3 rounded-lg border bg-white text-sm text-shnoor-navy placeholder-shnoor-soft transition-colors focus:outline-none focus:ring-1 resize-none
              ${errors.address ? 'border-shnoor-danger focus:ring-shnoor-danger' : 'border-shnoor-mist focus:border-shnoor-indigo focus:ring-shnoor-indigo'}`}
            placeholder="Enter your full address"
            value={formData.address} onChange={handleChange} disabled={isLoading} />
          <FieldError msg={errors.address} />
        </div>
      </div>
    );

    /* STEP 1 — Academic Details */
    if (step === 1) return (
      <div className="flex flex-col gap-5">
        <div ref={dropdownRef}>
          <label className="text-[11px] font-semibold text-shnoor-navy mb-1.5 uppercase tracking-wide flex items-center gap-1 block">
            Institute / University <span className="text-shnoor-danger">*</span>
          </label>
          <div className="relative">
            <div
              className={`w-full h-[50px] px-4 rounded-lg border bg-white transition-colors cursor-pointer flex items-center justify-between text-sm
                ${errors.institute ? 'border-shnoor-danger' : 'border-shnoor-mist hover:border-shnoor-indigo'}`}
              onClick={() => !isLoading && setShowInstituteDropdown(v => !v)}
            >
              <span className={formData.institute ? 'text-shnoor-navy' : 'text-shnoor-soft'}>
                {formData.institute || 'Select your institute...'}
              </span>
              <div className="flex items-center gap-2">
                {formData.institute && (
                  <Button type="Button" onClick={e => { e.stopPropagation(); setFormData(p => ({ ...p, institute: '' })); }}
                    className="text-shnoor-soft hover:text-shnoor-danger transition-colors">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
                    </svg>
                  </Button>
                )}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"
                  className={`text-shnoor-soft transition-transform duration-200 ${showInstituteDropdown ? 'rotate-180' : ''}`}>
                  <path d="M4.427 5.427a.5.5 0 0 0 0 .707l3 3a.5.5 0 0 0 .707 0l3-3a.5.5 0 1 0-.707-.707L8 7.793 5.573 5.427a.5.5 0 0 0-.707 0z" />
                </svg>
              </div>
            </div>
            {showInstituteDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-shnoor-mist rounded-xl shadow-[0_8px_24px_rgba(68,68,142,0.12)] overflow-hidden">
                <div className="max-h-52 overflow-y-auto">
                  {institutes.length > 0 ? institutes.map(inst => (
                    <div key={inst.id}
                      onClick={() => { setFormData(p => ({ ...p, institute: inst.display_name })); setShowInstituteDropdown(false); if (errors.institute) setErrors(p => ({ ...p, institute: '' })); }}
                      className="px-4 py-3 hover:bg-shnoor-lavender cursor-pointer transition-colors text-sm text-shnoor-navy border-b border-shnoor-mist/50 last:border-0">
                      {inst.display_name}
                    </div>
                  )) : <div className="px-4 py-3 text-sm text-shnoor-soft italic">No institutes available.</div>}
                </div>
              </div>
            )}
          </div>
          <FieldError msg={errors.institute} />
        </div>
        <div>
          <InputField label="Course" type="text" name="course" placeholder="e.g., B.Tech, M.Sc, BCA" required
            value={formData.course} onChange={handleChange} disabled={isLoading} autoComplete="off" />
          <FieldError msg={errors.course} />
        </div>
        <div>
          <InputField label="Specialization" type="text" name="specialization" placeholder="e.g., Computer Science, Electronics" required
            value={formData.specialization} onChange={handleChange} disabled={isLoading} autoComplete="off" />
          <FieldError msg={errors.specialization} />
        </div>
        <div>
          <InputField label="Resume Link" type="text" name="resumeLink" placeholder="Enter resume link or 'test'" required
            value={formData.resumeLink} onChange={handleChange} disabled={isLoading} autoComplete="off" />
          <p className="text-[11px] text-shnoor-soft mt-1">Enter Resume Link...</p>
          <FieldError msg={errors.resumeLink} />
        </div>
      </div>
    );
    /* STEP 2 — Account Setup */
    if (step === 2) return (
      <div className="flex flex-col gap-5">
        <div>
          <InputField label="Email Address" type="email" name="email" placeholder="student@institution.edu" required
            value={formData.email} onChange={handleChange} disabled={isLoading} autoComplete="email" />
          <FieldError msg={errors.email} />
        </div>
        <div className="relative">
          <InputField label="Password" type={showPassword ? 'text' : 'password'} name="password" placeholder="Minimum 8 characters" required
            value={formData.password} onChange={handleChange} disabled={isLoading} autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[37px] text-shnoor-soft hover:text-shnoor-navy transition-colors p-1" tabIndex={-1}>
            {showPassword ? <EyeOff /> : <EyeOpen />}
          </button>
          <FieldError msg={errors.password} />
        </div>
        <div className="relative">
          <InputField label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Re-enter your password" required
            value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} autoComplete="new-password" />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[37px] text-shnoor-soft hover:text-shnoor-navy transition-colors p-1" tabIndex={-1}>
            {showConfirmPassword ? <EyeOff /> : <EyeOpen />}
          </button>
          <FieldError msg={errors.confirmPassword} />
        </div>
      </div>
    );

    /* STEP 3 — Review & Confirm */
    return (
      <div className="flex flex-col gap-4">
        {/* Banner */}
        <div className="flex items-start gap-3 bg-[#EEF9F0] border border-shnoor-successLight rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-shnoor-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.97 4.97a.75.75 0 0 0-1.08-.022L6.477 9.417 4.384 7.323a.75.75 0 0 0-1.06 1.06l2.75 2.75a.75.75 0 0 0 1.137-.089l4-5.5a.75.75 0 0 0-.24-1.573z" />
          </svg>
          <p className="text-sm text-shnoor-success leading-relaxed">
            <span className="font-bold">Almost done!</span> Please review your details carefully. Click <strong>Edit</strong> on any section to make changes before submitting.
          </p>
        </div>

        {/* Section 1: Personal Info */}
        <ReviewSection title="Personal Information" stepIndex={0} onEdit={jumpToStep}>
          <ReviewRow label="Full Name" value={formData.fullName} />
          <ReviewRow label="Roll Number" value={formData.rollNumber} />
          <ReviewRow label="Phone" value={formData.phone} />
          <ReviewRow label="Address" value={formData.address} />
        </ReviewSection>

        {/* Section 2: Academic */}
        <ReviewSection title="Academic Details" stepIndex={1} onEdit={jumpToStep}>
          <ReviewRow label="Institute" value={formData.institute} />
          <ReviewRow label="Course" value={formData.course} />
          <ReviewRow label="Specialization" value={formData.specialization} />
          <ResumeLinkRow label="Resume Link" value={formData.resumeLink} />
        </ReviewSection>

        {/* Section 3: Account */}
        <ReviewSection title="Account Credentials" stepIndex={2} onEdit={jumpToStep}>
          <ReviewRow label="Email" value={formData.email} />
          <ReviewRow label="Password" value="set" hidden />
        </ReviewSection>

        {/* Disclaimer */}
        <p className="text-xs text-shnoor-soft text-center leading-relaxed">
          By submitting, you confirm that all details are accurate and you agree to the platform's terms of use.
        </p>
      </div>
    );
  };
  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen w-full flex font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ── LEFT PANEL ────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[38%] flex-col justify-between bg-shnoor-navy px-12 py-12 relative overflow-hidden">
        <div className="absolute top-[-80px] right-[-60px] w-80 h-80 rounded-full bg-shnoor-indigo opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-40px] w-60 h-60 rounded-full bg-[#6868AC] opacity-15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <img src={shnoorLogo} alt="Shnoor" className="h-11 w-11 object-contain" />
            <div>
              <p className="font-extrabold text-white text-lg leading-tight">SHNOOR Assessments</p>
              <p className="text-[11px] text-[#8F8FC4] uppercase tracking-widest font-semibold">Secure Examination Portal</p>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-white leading-tight mb-2">
            Join the <span className="text-[#8F8FC4]">SHNOOR</span><br />Recruitment Drive
          </h2>
          <p className="text-[#8F8FC4] text-sm leading-relaxed mb-10">
            Complete 4 quick steps to create your account and access your assessments.
          </p>

          {/* Step list */}
          <div className="flex flex-col gap-5">
            {STEP_META.map((s, i) => {
              const isDone = i < step;
              const isActive = i === step;
              return (
                <div key={i} className={`flex items-start gap-4 transition-all duration-300 ${isActive ? 'opacity-100' : isDone ? 'opacity-75' : 'opacity-30'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300
                    ${isDone ? 'bg-shnoor-success' : isActive ? 'bg-shnoor-indigo shadow-[0_0_16px_rgba(68,68,142,0.6)]' : 'bg-white/10'}`}>
                    {isDone ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isActive ? 'text-white' : isDone ? 'text-white/70' : 'text-white/40'}`}>{s.title}</p>
                    <p className={`text-xs leading-relaxed ${isActive ? 'text-[#8F8FC4]' : 'text-[#8F8FC4]/50'}`}>{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex gap-1 mb-3">
            {['#E0E0EF', '#B7B7D9', '#8F8FC4', '#6868AC', '#44448E', '#272757', '#0E0E27'].map(c => (
              <div key={c} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: c }} />
            ))}
          </div>
          <p className="text-xs text-[#6868AC]">SHNOOR Recruitment & Assessment Portal</p>
        </div>
      </div>
      {/* ── RIGHT PANEL ───────────────────────────────────── */}
      <div className="flex-1 bg-white flex items-center justify-center px-6 py-10 overflow-auto">
        <div className="w-full max-w-[500px]">
          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <img src={shnoorLogo} alt="Shnoor" className="h-9 w-9 object-contain" />
            <div>
              <p className="font-extrabold text-shnoor-navy text-base">SHNOOR Assessments</p>
              <p className="text-[10px] text-shnoor-soft uppercase tracking-widest">Secure Examination Portal</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-shnoor-indigo uppercase tracking-widest">Step {step + 1} of {TOTAL_STEPS}</span>
              <span className="text-xs text-shnoor-soft font-medium">{STEP_META[step].title}</span>
            </div>
            <div className="h-1.5 bg-shnoor-lavender rounded-full overflow-hidden">
              <div
                className="h-full bg-shnoor-indigo rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {STEP_META.map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full transition-all duration-300
                    ${i < step ? 'bg-shnoor-success' : i === step ? 'bg-shnoor-indigo scale-125' : 'bg-shnoor-mist'}`} />
                  <span className={`text-[10px] font-semibold hidden sm:block transition-colors duration-200
                    ${i === step ? 'text-shnoor-navy' : i < step ? 'text-shnoor-success' : 'text-shnoor-soft'}`}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-shnoor-navy">{STEP_META[step].title}</h1>
            <p className="text-sm text-shnoor-soft mt-0.5">{STEP_META[step].desc}</p>
          </div>

          {/* API error */}
          {apiError && (
            <div className="mb-5 flex items-start gap-3 bg-shnoor-dangerLight border border-shnoor-dangerLight text-shnoor-danger rounded-xl px-4 py-3 text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
              </svg>
              {apiError}
            </div>
          )}

          {/* Step fields — wrapped in form for enter-key and validation */}
          <form onSubmit={step < TOTAL_STEPS - 1 ? (e) => { e.preventDefault(); goNext(); } : (e) => { e.preventDefault(); handleSubmit(); }}>
            {renderStep()}

            {/* Navigation */}
            <div className={`flex gap-3 mt-8 ${step === 0 ? 'justify-end' : 'justify-between'}`}>
              {step > 0 && (
                <Button type="button" onClick={goBack} disabled={isLoading}
                  className="h-[50px] px-6 rounded-lg font-semibold text-shnoor-navy border-2 border-shnoor-mist hover:border-shnoor-indigo hover:bg-shnoor-lavender transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
              )}

              {step < TOTAL_STEPS - 1 ? (
                <Button type="submit" variant="primary" className="flex-1 !h-[50px]">
                  Continue
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              ) : (
                <Button type="submit" variant="primary" className="flex-1 !h-[50px]" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Confirm & Register
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="mt-7 pt-6 border-t border-shnoor-lavender">
            <p className="text-center text-sm text-shnoor-soft">
              Already registered?{' '}
              <Link to="/login" className="text-shnoor-indigo font-semibold hover:text-shnoor-navy transition-colors">
                Sign in to examination
              </Link>
            </p>
            <p className="text-center text-xs text-[#8F8FC4] mt-3 flex items-center justify-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              </svg>
              Secure, proctored examination environment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;