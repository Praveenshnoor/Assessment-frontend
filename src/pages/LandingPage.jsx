import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import shnoorLogo from '../assets/shnoor-logo.png';
import shnoorlogo1 from '../assets/shnoor-logo1.png';

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-brand">
            <img src={shnoorlogo1} alt="Shnoor Logo" className="nav-logo" />
            <div className="nav-brand-text">
              <h1 className="nav-title">Shnoor Assessments</h1>
              <p className="nav-subtitle">Secure Examination Portal</p>
            </div>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/register" className="nav-btn-primary">Register Now</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="pulse-dot"></span>
              Student Assessment Portal
            </div>
            <h1 className="hero-title">
              Shnoor <span className="gradient-text">Recruitment Portal</span>
            </h1>
            <p className="hero-description">
              Complete your placement assessment for Shnoor recruitment drives. Access assigned tests, take secure exams, and track your results—all in one place.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn-hero-primary">Start Your Assessment</Link>
              <Link to="/login" className="btn-hero-secondary">Already Registered?</Link>
            </div>
            <div className="hero-features">
              <div className="hero-feature">
                <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Secure Proctored Exams
              </div>
              <div className="hero-feature">
                <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Easy Submission
              </div>
            </div>
          </div>

          <div className="hero-mockup">
            <div className="mockup-card">
              <div className="mockup-header">
                <div className="mockup-header-content">
                  <div className="mockup-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="mockup-title">Your Assigned Tests</h3>
                    <p className="mockup-subtitle">3 tests available</p>
                  </div>
                </div>
                <span className="status-badge">Active</span>
              </div>

              <div className="test-list">
                <div className="test-item active-test">
                  <div className="test-info">
                    <h4 className="test-name">Java Fundamentals Assessment</h4>
                    <span className="test-duration">60 mins</span>
                  </div>
                  <p className="test-meta">25 Questions • 2 Attempts Remaining</p>
                  <div className="test-footer">
                    <span className="test-date">Available until Dec 31, 2025</span>
                    <button className="test-btn">Start Test</button>
                  </div>
                </div>

                <div className="test-item scheduled-test">
                  <div className="test-info">
                    <h4 className="test-name">Data Structures Quiz</h4>
                    <span className="test-duration">45 mins</span>
                  </div>
                  <p className="test-meta">20 Questions • Scheduled</p>
                  <div className="test-date">Available from Jan 15, 2025</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* How It Works */}
      <section className="how-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-description">Complete your placement assessment in three simple steps</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 className="step-title">Register</h3>
            <p className="step-description">Sign up with your institute details and enrollment information.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3 className="step-title">Take Assessment</h3>
            <p className="step-description">Complete the secure, proctored exam assigned for your campus drive.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3 className="step-title">Submit Exam</h3>
            <p className="step-description">Securely submit your assessment and receive completion confirmation.</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Platform Features</h2>
          <p className="section-description">Secure and reliable assessment experience</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon blue-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </div>
            <h3 className="feature-title">Auto-Assigned Tests</h3>
            <p className="feature-description">Tests automatically appear in your dashboard based on your institute.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon green-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </div>
            <h3 className="feature-title">Multiple Attempts</h3>
            <p className="feature-description">Some tests allow multiple attempts to improve your score.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon purple-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 className="feature-title">Scheduled Tests</h3>
            <p className="feature-description">Tests have specific availability windows. Check deadlines in your dashboard.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon yellow-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
              </svg>
            </div>
            <h3 className="feature-title">Auto-Save</h3>
            <p className="feature-description">Your answers save automatically. Resume anytime if disconnected.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon red-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 className="feature-title">Secure Fullscreen</h3>
            <p className="feature-description">Exams run in fullscreen with tab-switch detection for integrity.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon indigo-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="feature-title">Submission Receipt</h3>
            <p className="feature-description">Receive immediate confirmation that your exam has been successfully recorded.</p>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="security-section">
        <div className="security-container">
          <div className="security-content">
            <h2 className="security-title">Secure Examination Environment</h2>
            <p className="security-intro">Proctored assessments ensure fair evaluation for all candidates.</p>

            <div className="security-features">
              <div className="security-feature">
                <div className="security-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="security-feature-title">Live Proctoring</h3>
                  <p className="security-feature-desc">Webcam monitoring with periodic snapshots during your exam session.</p>
                </div>
              </div>

              <div className="security-feature">
                <div className="security-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="security-feature-title">Tab Switch Detection</h3>
                  <p className="security-feature-desc">System warns you if you leave the exam window. Multiple violations may terminate the exam.</p>
                </div>
              </div>

              <div className="security-feature">
                <div className="security-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="security-feature-title">Encrypted Answers</h3>
                  <p className="security-feature-desc">All responses are securely encrypted and stored with timestamps.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="security-status">
            <div className="status-header">
              <h3>Security Status</h3>
              <span className="status-active">ACTIVE</span>
            </div>
            <div className="status-list">
              <div className="status-row">
                <span>Fullscreen Enforcement</span>
                <span className="status-enabled">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Enabled
                </span>
              </div>
              <div className="status-row">
                <span>Camera Monitoring</span>
                <span className="status-enabled">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Required
                </span>
              </div>
              <div className="status-row">
                <span>Tab Switch Limit</span>
                <span className="status-warning">3 Warnings</span>
              </div>
              <div className="status-row">
                <span>Auto-Submit</span>
                <span className="status-info">On Timeout</span>
              </div>
            </div>
            <div className="status-quote">
              <p>"These measures ensure a fair and secure assessment process for all candidates."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Test Experience Preview */}
      <section className="experience-section">
        <div className="section-header">
          <h2 className="section-title">What to Expect</h2>
          <p className="section-description">Understand the assessment process before you begin</p>
        </div>

        <div className="experience-grid">
          <div className="experience-card">
            <div className="experience-phase">Before You Start</div>
            <h3 className="experience-title">Preparation</h3>
            <ul className="experience-list">
              <li>Read detailed instructions and exam rules</li>
              <li>System checks for webcam and fullscreen</li>
              <li>Allow camera permission request</li>
              <li>Enter fullscreen mode to begin</li>
            </ul>
          </div>

          <div className="experience-card highlight">
            <div className="experience-phase">Step 2</div>
            <h3 className="experience-title">During Your Exam</h3>
            <ul className="experience-list-highlight">
              <li>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Answer multiple-choice questions at your pace
              </li>
              <li>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M3 21h18M5 21v-8a2 2 0 012-2h14a2 2 0 012 2v8m-2-8h-2m-2 0h-2m-2 0H9m-2 0H5"></path>
                </svg>
                Navigate freely and flag questions for review
              </li>
              <li>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Timer countdown visible at all times
              </li>
              <li>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                </svg>
                Answers save automatically
              </li>
            </ul>
          </div>

          <div className="experience-card">
            <div className="experience-phase">After Submission</div>
            <h3 className="experience-title">Completion</h3>
            <ul className="experience-list">
              <li>Submit exam securely</li>
              <li>Receive submission confirmation</li>
              <li>Return to dashboard</li>
              <li>Wait for result announcement</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Start?</h2>
          <p className="cta-description">Register with your institute details to access your assigned assessment for the Shnoor recruitment drive.</p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-btn-primary">Register Now</Link>
            <Link to="/login" className="cta-btn-secondary">Sign In</Link>
          </div>
          <p className="cta-features">Quick registration • Secure exams • Reliable platform</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo-container">
                <img src={shnoorLogo} alt="Shnoor Logo" className="footer-logo" />
                <span className="footer-brand-name">Shnoor Assessments</span>
              </div>
              <p className="footer-brand-desc">Secure examination platform for campus recruitment drives.</p>
              <div className="footer-location">
                <h4 className="footer-subtitle">Location</h4>
                <p>10009 Mount Tabor Road,<br />Odessa Missouri, United States.</p>
              </div>
            </div>

            <div className="footer-column">
              <h4 className="footer-title">Contacts</h4>
              <ul className="footer-links">
                <li><a href="mailto:info@shnoor.com">📧 info@shnoor.com (General)</a></li>
                <li><a href="mailto:proc@shnoor.com">📧 proc@shnoor.com (Sales)</a></li>
                <li><a href="tel:+919429694298">📞 +91-9429694298</a></li>
                <li><a href="tel:+919041914601">📞 +91-9041914601</a></li>
              </ul>
            </div>



            <div className="footer-column">
              <h4 className="footer-title">Useful Links</h4>
              <ul className="footer-links">
                <li><a href="#">Our Partners</a></li>
                <li><a href="#">We are Social</a></li>
                <li><a href="#">Let's Connect</a></li>
                <li><a href="#">Company Profile</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-copyright">
              <p>&copy; Copyrights 2025. All Rights Reserved. SHNOOR INTERNATIONAL LLC</p>
              <div className="footer-legal-links">
                <a href="#">Privacy Policy</a>
                <span className="separator">•</span>
                <a href="#">Terms & Conditions</a>
              </div>
            </div>
            <div className="footer-security">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <span>Secure Environment</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
