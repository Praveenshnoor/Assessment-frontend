import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import SkipLink from '../components/SkipLink';
import shnoorlogo1 from '../assets/shnoor-logo1.png';
import shnoorLogo from '../assets/shnoor-logo.png';

const Icon = ({ d, cls = 'w-6 h-6', stroke = 2, ariaHidden = true }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={stroke} viewBox="0 0 24 24" aria-hidden={ariaHidden} role="img">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const CHECK = 'M5 13l4 4L19 7';
const CAMERA = 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z';
const LOCK = 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z';
const SHIELD = 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z';
const CLIP = 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4';
const REFRESH = 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15';
const CAL = 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
const SAVE = 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4';
const SCREEN = 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
const DOC = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
const PIN = 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z';
const CLOCK = 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
const FLAG = 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z';

const FEATURES = [
  { icon: CLIP, color: 'bg-[#EEF2FF] text-[#6366F1]', title: 'Auto-Assigned Tests', desc: 'Tests automatically appear in your dashboard based on your institute.' },
  { icon: REFRESH, color: 'bg-[#ECFDF5] text-[#10B981]', title: 'Multiple Attempts', desc: 'Some tests allow multiple attempts to improve your score.' },
  { icon: CAL, color: 'bg-[#F3E8FF] text-[#A855F7]', title: 'Scheduled Tests', desc: 'Tests have specific availability windows. Check deadlines in your dashboard.' },
  { icon: SAVE, color: 'bg-[#FEFCE8] text-[#EAB308]', title: 'Auto-Save', desc: 'Your answers save automatically. Resume anytime if disconnected.' },
  { icon: SCREEN, color: 'bg-[#FFF1F2] text-[#F43F5E]', title: 'Secure Fullscreen', desc: 'Exams run in fullscreen with tab-switch detection for integrity.' },
  { icon: CHECK, color: 'bg-[#F0FDF4] text-[#22C55E]', title: 'Submission Receipt', desc: 'Receive immediate confirmation that your exam has been successfully recorded.' },
];

const LandingPage = () => (
  <div className="font-['Plus_Jakarta_Sans',sans-serif] text-shnoor-navy antialiased">
    {/* Skip to main content link for accessibility */}
    <SkipLink targetId="main-content" />

    {/* ── 1. NAVBAR ──────────────────────────────────────────────────────── */}
    <header role="banner">
      <nav className="bg-white border-b border-shnoor-mist sticky top-0 z-50 shadow-sm" aria-label="Main navigation">
        <div className="max-w-[1280px] mx-auto px-8 flex items-center justify-between h-[72px]">
          <div className="flex items-center gap-4">
            <img src={shnoorlogo1} alt="" className="h-12 w-12 object-contain" aria-hidden="true" />
            <div>
              <p className="font-bold text-shnoor-navy text-xl leading-tight">SHNOOR Assessments</p>
              <p className="text-[11px] text-shnoor-soft font-semibold uppercase tracking-widest">Secure Examination Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-base font-semibold text-shnoor-navy hover:text-shnoor-indigo transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link to="/register">
              <Button variant="primary">Register Now</Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>

    {/* ── 2. HERO ────────────────────────────────────────────────────────── */}
    <main id="main-content" role="main">
      <section className="bg-white py-16 px-8" aria-labelledby="hero-heading">
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 bg-[#6B6BAE]/20 text-shnoor-indigo text-sm font-semibold px-4 py-2 rounded-full w-fit border border-shnoor-indigo/30">
            <span className="w-2 h-2 bg-shnoor-indigo rounded-full animate-pulse"></span>
            Student Assessment Portal
          </div>

          <h1 id="hero-heading" className="text-5xl font-extrabold leading-[1.1]">
            <span className="text-shnoor-navy">SHNOOR </span>
            <span className="text-shnoor-indigo">Recruitment Portal</span>
          </h1>

          <p className="text-lg text-shnoor-soft leading-[1.7] max-w-lg">
            Complete your placement assessment for SHNOOR recruitment drives. Access assigned tests, take secure exams, and track your results all in one place.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="/register">
              <Button variant="primary" className="!px-8">Start Your Assessment</Button>
            </Link>
            <Link to="/login">
              <Button className="h-[50px] px-8 rounded-xl font-bold text-shnoor-navy border-2 border-shnoor-mist hover:border-shnoor-indigo hover:bg-shnoor-lavender transition-all">
                Already Registered?
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-8">
            {['Secure Proctored Exams', 'Easy Submission'].map(t => (
              <div key={t} className="flex items-center gap-2 text-sm text-shnoor-indigoMedium font-semibold">
                <Icon d={CHECK} cls="w-5 h-5 text-shnoor-indigo" />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Floating Mock Card */}
        <div className="flex justify-center">
          <Card noPadding className="w-full max-w-[480px] shadow-[0_20px_60px_rgba(68,68,142,0.15)]">
            <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-shnoor-mist">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-shnoor-lavender rounded-xl flex items-center justify-center">
                  <Icon d={DOC} cls="w-6 h-6 text-shnoor-indigo" />
                </div>
                <div>
                  <p className="font-bold text-base text-shnoor-navy">Your Assigned Tests</p>
                  <p className="text-sm text-shnoor-soft">3 tests available</p>
                </div>
              </div>
              <span className="bg-shnoor-successLight text-shnoor-success text-xs font-bold px-3 py-1 rounded-full">Active</span>
            </div>

            {/* Test 1 */}
            <div className="mx-5 mt-5 mb-4 rounded-xl border border-shnoor-mist bg-shnoor-lavender border-l-4 border-l-shnoor-indigo p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm text-shnoor-navy">Java Fundamentals Assessment</p>
                <span className="text-xs font-semibold text-shnoor-indigo">60 mins</span>
              </div>
              <p className="text-xs text-shnoor-soft mb-3">25 Questions • 2 Attempts Remaining</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-shnoor-soft">Available until Dec 31, 2025</p>
                <Button className="bg-shnoor-indigo text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-shnoor-navy transition-colors">
                  Start Test
                </Button>
              </div>
            </div>

            {/* Test 2 */}
            <div className="mx-5 mb-6 rounded-xl border border-shnoor-mist p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm text-shnoor-navy">Data Structures Quiz</p>
                <span className="text-xs font-semibold text-shnoor-soft">45 mins</span>
              </div>
              <p className="text-xs text-shnoor-soft mb-2">20 Questions • Scheduled</p>
              <p className="text-xs text-shnoor-soft">Available from Jan 15, 2025</p>
            </div>
          </Card>
        </div>
      </div>
    </section>

    {/* ── 3. HOW IT WORKS ────────────────────────────────────────────────── */}
    <section className="bg-white py-24 px-8 border-t border-shnoor-lavender">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-shnoor-navy mb-4">How It Works</h2>
          <p className="text-lg text-shnoor-soft max-w-xl mx-auto">Complete your placement assessment in three simple steps</p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { n: '1', title: 'Register', desc: 'Sign up with your institute details and enrollment information.' },
            { n: '2', title: 'Take Assessment', desc: 'Complete the secure, proctored exam assigned for your campus drive.' },
            { n: '3', title: 'Submit Exam', desc: 'Securely submit your assessment and receive completion confirmation.' },
          ].map(s => (
            <div key={s.n} className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-xl bg-shnoor-indigo text-white font-extrabold text-2xl flex items-center justify-center shadow-[0_4px_14px_rgba(68,68,142,0.35)]">
                {s.n}
              </div>
              <h3 className="font-extrabold text-xl text-shnoor-navy">{s.title}</h3>
              <p className="text-shnoor-soft leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── 4. PLATFORM FEATURES ───────────────────────────────────────────── */}
    <section className="bg-shnoor-lavender py-24 px-8">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-shnoor-navy mb-4">Platform Features</h2>
          <p className="text-lg text-shnoor-soft">Secure and reliable assessment experience</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <Card key={f.title} className="!border-0 !p-8 hover:shadow-[0_16px_40px_rgba(68,68,142,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${f.color}`}>
                <Icon d={f.icon} cls="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-lg text-shnoor-navy mb-2">{f.title}</h3>
              <p className="text-shnoor-soft leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* ── 5. SECURE EXAMINATION ENV ──────────────────────────────────────── */}
    <section className="bg-shnoor-navy py-24 px-8">
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Secure Examination<br />Environment
          </h2>
          <p className="text-lg text-shnoor-soft mb-10 leading-[1.7]">
            Proctored assessments ensure fair evaluation for all candidates.
          </p>
          <div className="flex flex-col gap-8">
            {[
              { icon: CAMERA, title: 'Live Proctoring', desc: 'Webcam monitoring with periodic snapshots during your exam session.' },
              { icon: LOCK, title: 'Tab Switch Detection', desc: 'System warns you if you leave the exam window. Multiple violations may terminate the exam.' },
              { icon: SHIELD, title: 'Encrypted Answers', desc: 'All responses are securely encrypted and stored with timestamps.' },
            ].map(f => (
              <div key={f.title} className="flex gap-5">
                <div className="w-12 h-12 rounded-xl bg-shnoor-indigo flex items-center justify-center flex-shrink-0">
                  <Icon d={f.icon} cls="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white mb-1">{f.title}</h3>
                  <p className="text-shnoor-soft leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Security Status Card */}
        <div>
          <div className="bg-[#1f2937] border border-[#374151] rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-white">Security Status</h3>
              <span className="bg-shnoor-success text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">ACTIVE</span>
            </div>
            <div className="space-y-0 divide-y divide-[#374151]">
              {[
                { label: 'Fullscreen Enforcement', val: '✓ Enabled', cls: 'text-shnoor-success' },
                { label: 'Camera Monitoring', val: '✓ Required', cls: 'text-shnoor-success' },
                { label: 'Tab Switch Limit', val: '3 Warnings', cls: 'text-shnoor-warning' },
                { label: 'Auto-Submit', val: 'On Timeout', cls: 'text-[#60a5fa]' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-4">
                  <span className="text-[#9ca3af]">{r.label}</span>
                  <span className={`text-sm font-bold ${r.cls}`}>{r.val}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-[#374151] rounded-xl p-4">
              <p className="text-sm text-[#d1d5db] italic leading-relaxed">
                "These measures ensure a fair and secure assessment process for all candidates."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ── 6. WHAT TO EXPECT ─────────────────────────────────────────────── */}
    <section className="bg-white py-24 px-8">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-shnoor-navy mb-4">What to Expect</h2>
          <p className="text-lg text-shnoor-soft">Understand the assessment process before you begin</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {/* Card 1 */}
          <div className="bg-shnoor-lavender border border-shnoor-mist/60 rounded-2xl p-8 flex flex-col gap-6">
            <span className="text-xs font-extrabold text-shnoor-indigo uppercase tracking-widest">Before You Start</span>
            <h3 className="text-2xl font-extrabold text-shnoor-navy">Preparation</h3>
            <ul className="flex flex-col gap-4 flex-1">
              {['Read detailed instructions and exam rules', 'System checks for webcam and fullscreen', 'Allow camera permission request', 'Enter fullscreen mode to begin'].map(i => (
                <li key={i} className="flex items-start gap-3 text-[#4b5563] leading-relaxed">
                  <span className="mt-2 w-2 h-2 rounded-full bg-shnoor-indigo flex-shrink-0"></span>
                  {i}
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2 — Highlighted */}
          <div className="bg-shnoor-indigo rounded-2xl p-8 flex flex-col gap-6 shadow-[0_20px_40px_rgba(68,68,142,0.3)] scale-105">
            <span className="text-xs font-extrabold text-white/60 uppercase tracking-widest">Step 2</span>
            <h3 className="text-2xl font-extrabold text-white">During Your Exam</h3>
            <ul className="flex flex-col gap-4 flex-1">
              {[
                { icon: CHECK, text: 'Answer multiple-choice questions at your pace' },
                { icon: FLAG, text: 'Navigate freely and flag questions for review' },
                { icon: CLOCK, text: 'Timer countdown visible at all times' },
                { icon: SAVE, text: 'Answers save automatically' },
              ].map(i => (
                <li key={i.text} className="flex items-start gap-3 text-white/80 leading-relaxed">
                  <Icon d={i.icon} cls="w-5 h-5 text-white/70 flex-shrink-0 mt-0.5" />
                  {i.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Card 3 */}
          <div className="bg-shnoor-lavender border border-shnoor-mist/60 rounded-2xl p-8 flex flex-col gap-6">
            <span className="text-xs font-extrabold text-shnoor-indigo uppercase tracking-widest">After Submission</span>
            <h3 className="text-2xl font-extrabold text-shnoor-navy">Completion</h3>
            <ul className="flex flex-col gap-4 flex-1">
              {['Submit exam securely', 'Receive submission confirmation', 'Return to dashboard', 'Wait for result announcement'].map(i => (
                <li key={i} className="flex items-start gap-3 text-[#4b5563] leading-relaxed">
                  <span className="mt-2 w-2 h-2 rounded-full bg-shnoor-indigo flex-shrink-0"></span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* ── 7. CTA ─────────────────────────────────────────────────────────── */}
    <section className="bg-shnoor-indigo py-24 px-8">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-white mb-5">Ready to Start?</h2>
        <p className="text-lg text-white/70 mb-10 leading-relaxed">
          Register with your institute details to access your assigned assessment for the SHNOOR recruitment drive.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <Link to="/register">
            <Button className="h-[50px] px-8 rounded-lg font-bold text-white border-2 border-white hover:bg-white/10 transition-all">
              Register Now
            </Button>
          </Link>
          <Link to="/login">
            <Button className="h-[50px] px-8 rounded-lg font-bold text-white border-2 border-white hover:bg-white/10 transition-all">
              Sign In
            </Button>
          </Link>
        </div>
        <p className="text-white/50 text-sm">Quick registration • Secure exams • Reliable platform</p>
      </div>
    </section>
    </main>

    {/* ── 8. FOOTER ──────────────────────────────────────────────────────── */}
    <footer className="bg-shnoor-navy pt-16 pb-8 px-8" role="contentinfo">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={shnoorLogo} alt="Shnoor" className="h-9 w-9 object-contain" loading="lazy" />
              <span className="font-extrabold text-white text-lg">SHNOOR Assessments</span>
            </div>
            <p className="text-shnoor-soft mb-6 leading-relaxed text-sm">Secure examination platform for campus recruitment drives.</p>
            <p className="text-xs font-extrabold text-white uppercase tracking-widest mb-2">Location</p>
            <p className="text-shnoor-soft text-sm leading-relaxed">10009 Mount Tabor Road,<br />Odessa Missouri, United States.</p>
          </div>
          <div>
            <p className="text-xs font-extrabold text-shnoor-mist uppercase tracking-widest mb-5">Contacts</p>
            <ul className="flex flex-col gap-3 text-shnoor-soft" aria-label="Contact information">
              <li><a href="mailto:info@shnoor.com" className="hover:text-white transition-colors" aria-label="Email info@shnoor.com for general inquiries">📧 info@shnoor.com (General)</a></li>
              <li><a href="mailto:proc@shnoor.com" className="hover:text-white transition-colors" aria-label="Email proc@shnoor.com for sales">📧 proc@shnoor.com (Sales)</a></li>
              <li><a href="tel:+919429694298" className="hover:text-white transition-colors" aria-label="Call +91 9429694298">📞 +91-9429694298</a></li>
              <li><a href="tel:+919041914601" className="hover:text-white transition-colors" aria-label="Call +91 9041914601">📞 +91-9041914601</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-extrabold text-shnoor-mist uppercase tracking-widest mb-5">Useful Links</p>
            <ul className="flex flex-col gap-3 text-shnoor-soft">
              <li><a href="https://www.linkedin.com/company/shnoor-international/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">We are Social</a></li>
              <li><a href="https://api.whatsapp.com/qr/D6I7XIACKIKVD1?autoload=1&app_absent=0" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Let's Connect</a></li>
              <li><a href="/company-profile.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Company Profile</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-shnoor-soft">
            <p>© Copyrights 2025. All Rights Reserved. SHNOOR INTERNATIONAL LLC</p>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-white/20">•</span>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>              <span className="text-white/20">•</span>
              <Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-shnoor-success font-semibold">
            <Icon d={SHIELD} cls="w-4 h-4" />
            Secure Environment
          </div>
        </div>
      </div>
    </footer>
  </div>
);

export default LandingPage;