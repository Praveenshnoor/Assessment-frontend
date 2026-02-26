import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import shnoorlogo1 from '../assets/shnoor-logo1.png';
import shnoorLogo from '../assets/shnoor-logo.png';

const SHIELD = 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z';

const Icon = ({ d, cls = 'w-6 h-6', stroke = 2 }) => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth={stroke} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-shnoor-navy antialiased min-h-screen flex flex-col">
            {/* ── 1. NAVBAR ──────────────────────────────────────────────────────── */}
            <nav className="bg-white border-b border-shnoor-mist sticky top-0 z-50 shadow-sm">
                <div className="max-w-[1280px] mx-auto px-8 flex items-center justify-between h-[72px]">
                    <Link to="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
                        <img src={shnoorlogo1} alt="Shnoor" className="h-12 w-12 object-contain" />
                        <div>
                            <p className="font-bold text-shnoor-navy text-xl leading-tight">SHNOOR Assessments</p>
                            <p className="text-[11px] text-shnoor-soft font-semibold uppercase tracking-widest">Secure Examination Portal</p>
                        </div>
                    </Link>
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

            {/* ── POLICY CONTENT ────────────────────────────────────────────────── */}
            <main className="flex-grow bg-[#F8FAFC] py-16 px-8">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-shnoor-mist p-10 md:p-14">
                    <div className="border-b border-shnoor-mist pb-8 mb-8">
                        <h1 className="text-4xl font-extrabold text-shnoor-navy mb-4">Privacy Policy</h1>
                        <p className="text-lg text-shnoor-soft mb-4">Assessments Platform – assessments.shnoor.com</p>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-shnoor-soft font-medium bg-shnoor-lavender p-4 rounded-xl border border-shnoor-mist">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-shnoor-indigo"></div>
                                <strong className="text-shnoor-navy">Effective Date:</strong> February 25, 2026
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-shnoor-indigo"></div>
                                <strong className="text-shnoor-navy">Version:</strong> 1.0
                            </span>
                        </div>
                    </div>

                    <div className="space-y-10 text-shnoor-soft leading-relaxed">
                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">1. Introduction</h2>
                            <p>This Privacy Policy describes how the Assessments Platform (assessments.shnoor.com), operated by SHNOOR INTERNATIONAL LLC, collects, uses, and protects user data in connection with online tests, evaluations, and recruitment assessments.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">2. Data Controller</h2>
                            <p className="font-semibold text-shnoor-navy">SHNOOR INTERNATIONAL LLC</p>
                            <p>Email: <a href="mailto:info@shnoor.com" className="text-shnoor-indigo hover:underline font-medium">info@shnoor.com</a></p>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-4">3. Information We Collect</h2>
                            <div className="space-y-4 ml-2 border-l-2 border-shnoor-mist pl-5">
                                <div>
                                    <h3 className="font-bold text-shnoor-navy text-base">A. User Information:</h3>
                                    <p>Name, email address, phone number, institution/organization, and login credentials.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-shnoor-navy text-base">B. Assessment Data:</h3>
                                    <p>Test responses, scores, time spent, activity logs, and evaluation results.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-shnoor-navy text-base">C. Technical Data:</h3>
                                    <p>IP address, browser details, device info, cookies, session logs.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">4. Purpose of Processing</h2>
                            <p>To conduct assessments, evaluate performance, prevent malpractice, improve platform performance, and communicate results.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">5. Proctoring &amp; Monitoring</h2>
                            <p>The platform may monitor user activity during assessments, including browser behavior and session tracking, to ensure integrity of exams.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">6. Legal Basis</h2>
                            <p>Processing is based on contractual necessity, legitimate interest, and consent where applicable.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">7. Data Security</h2>
                            <p>We implement encryption, secure servers, and monitoring to protect user data. However, no system is completely secure.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">8. Data Retention</h2>
                            <p>Assessment data is retained as required for academic, recruitment, or compliance purposes.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">9. User Rights</h2>
                            <p>Users may request access, correction, deletion, or restriction of their data by contacting <a href="mailto:info@shnoor.com" className="text-shnoor-indigo hover:underline font-medium">info@shnoor.com</a>.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">10. Third-Party Services</h2>
                            <p>We may use third-party services for hosting, analytics, and communication, all compliant with data protection standards.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">11. Legal Disclosure</h2>
                            <p>We may disclose data if required by law or to prevent fraud and misuse.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">12. Updates</h2>
                            <p>We may update this policy. Changes will be reflected with a new effective date.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">13. Contact</h2>
                            <p>Email: <a href="mailto:info@shnoor.com" className="text-shnoor-indigo hover:underline font-medium">info@shnoor.com</a></p>
                        </section>
                    </div>
                </div>
            </main>

            {/* ── 8. FOOTER ──────────────────────────────────────────────────────── */}
            <footer className="bg-shnoor-navy pt-16 pb-8 px-8 mt-auto">
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
                            <ul className="flex flex-col gap-3 text-shnoor-soft">
                                <li><a href="mailto:info@shnoor.com" className="hover:text-white transition-colors">📧 info@shnoor.com (General)</a></li>
                                <li><a href="mailto:proc@shnoor.com" className="hover:text-white transition-colors">📧 proc@shnoor.com (Sales)</a></li>
                                <li><a href="tel:+919429694298" className="hover:text-white transition-colors">📞 +91-9429694298</a></li>
                                <li><a href="tel:+919041914601" className="hover:text-white transition-colors">📞 +91-9041914601</a></li>
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
                                <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                                <span className="text-white/20">•</span>
                                <Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-400 font-semibold">
                            <Icon d={SHIELD} cls="w-4 h-4" />
                            Secure Environment
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PrivacyPolicy;