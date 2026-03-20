import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import SEOHead from '../components/SEOHead';
import SkipLink from '../components/SkipLink';
import shnoorlogo1 from '../assets/shnoor-logo1.png';
import shnoorLogo from '../assets/shnoor-logo.png';

const SHIELD = 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z';

const Icon = ({ d, cls = 'w-6 h-6', stroke = 2 }) => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth={stroke} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

const TermsAndConditions = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-shnoor-navy antialiased min-h-screen flex flex-col">
            <SEOHead 
                title="Terms and Conditions - SHNOOR Assessments"
                description="Read the terms and conditions for using SHNOOR Assessments platform. Understand the rules and regulations for the assessment portal."
                canonical="https://assessments.shnoor.com/terms-and-conditions"
            />
            <SkipLink targetId="main-content" />
            
            {/* ── 1. NAVBAR ──────────────────────────────────────────────────────── */}
            <header role="banner">
                <nav className="bg-white border-b border-shnoor-mist sticky top-0 z-50 shadow-sm" aria-label="Main navigation">
                    <div className="max-w-[1280px] mx-auto px-8 flex items-center justify-between h-[72px]">
                        <Link to="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
                            <img src={shnoorlogo1} alt="" className="h-12 w-12 object-contain" aria-hidden="true" />
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
            </header>

            {/* ── POLICY CONTENT ────────────────────────────────────────────────── */}
            <main id="main-content" className="flex-grow bg-[#F8FAFC] py-16 px-8" role="main">
                <article className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-shnoor-mist p-10 md:p-14">
                    <header className="border-b border-shnoor-mist pb-8 mb-8">
                        <h1 className="text-4xl font-extrabold text-shnoor-navy mb-4">Terms and Conditions</h1>
                        <p className="text-lg text-shnoor-soft mb-4">Assessments Platform – assessments.shnoor.com</p>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-shnoor-soft font-medium bg-shnoor-lavender p-4 rounded-xl border border-shnoor-mist">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-shnoor-indigo" aria-hidden="true"></div>
                                Welcome to assessments.shnoor.com!
                            </span>
                        </div>
                    </header>

                    <div className="space-y-10 text-shnoor-soft leading-relaxed">
                        <p className="text-base">
                            These terms and conditions outline the rules and regulations for the use of SHNOOR INTERNATIONAL's Assessment Platform, located at <a href="https://assessments.shnoor.com" className="text-shnoor-indigo hover:underline font-medium">https://assessments.shnoor.com</a>.
                        </p>
                        <p className="text-base">
                            By accessing this platform, we assume you accept these terms and conditions. Do not continue to use assessments.shnoor.com if you do not agree to all the terms stated on this page.
                        </p>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">Cookies:</h2>
                            <p>The platform uses cookies to personalize user experience and manage secure assessment sessions. Required cookies are essential for login, test delivery, and evaluation processes.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">License:</h2>
                            <p>Unless otherwise stated, SHNOOR INTERNATIONAL owns the intellectual property rights for all material on assessments.shnoor.com. You may use the platform only for authorized assessment purposes.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-4">User Responsibilities:</h2>
                            <ul className="space-y-3 ml-2 border-l-2 border-shnoor-mist pl-5">
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-shnoor-indigo mt-2 flex-shrink-0"></div>
                                    <span>Users must not attempt to cheat, manipulate results, or misuse the platform.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-shnoor-indigo mt-2 flex-shrink-0"></div>
                                    <span>Sharing login credentials is strictly prohibited.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-shnoor-indigo mt-2 flex-shrink-0"></div>
                                    <span>Any malpractice may result in account suspension or permanent ban.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-extrabold text-shnoor-navy mb-3">Disclaimer:</h2>
                            <p>The assessment results are provided for evaluation purposes only. SHNOOR INTERNATIONAL is not liable for decisions taken solely based on assessment outcomes.</p>
                        </section>
                    </div>
                </article>
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
                        <div className="flex items-center gap-2 text-sm text-shnoor-success font-semibold">
                            <Icon d={SHIELD} cls="w-4 h-4" />
                            Secure Environment
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default TermsAndConditions;