import React from 'react';
import { useNavigate } from 'react-router-dom';
import DockNav from '../components/common/DockNav.jsx';
import { useCountUp } from '../hooks/useCountUp.js';
import classroomImg from '../assets/classroom.jpg';

/**
 * VacanSee - Home & Landing Page View
 * 
 * Implements the full Nothing OS-inspired landing page:
 * - Floating capsule dock header with theme toggle and expandable menu
 * - Atmospheric ambient corner glows
 * - Hero banner with typography, scribbles, and action buttons
 * - Animated stats counters (50 rooms, 10 available, 380 students, 1,450 hours saved)
 * - Campus photography card
 */
export default function Home() {
  const navigate = useNavigate();

  // Animated counters with ease-out cubic interpolation
  const countClassrooms = useCountUp(50, 1400);
  const countAvailable = useCountUp(10, 1400);
  const countStudents = useCountUp(380, 1400);
  const countHours = useCountUp(1450, 1400);

  return (
    <div id="landing">
      {/* Ambient Corner Glow Blobs for atmospheric lighting */}
      <div className="ambient-glow glow-top-left" aria-hidden="true" />
      <div className="ambient-glow glow-bottom-right" aria-hidden="true" />

      {/* Floating Pill Capsule Dock */}
      <DockNav currentRoute="home" />

      {/* Main Content Viewport */}
      <main className="wrap">
        <div className="hero">
          {/* Left Hero Column */}
          <div className="hero-left">
            <div className="hero-eyebrow">
              <span className="eyebrow-dash" />
              <span className="eyebrow-text">SMART CLASSROOM FINDER</span>
            </div>

            <div className="hero-title-wrap">
              <h1>
                Turn Empty<br />
                Classrooms Into<br />
                Productive<br />
                Spaces.
              </h1>
            </div>

            <p className="hero-desc">
              Find vacant classrooms across your campus and use your free time wisely.
            </p>

            {/* Hero Navigation Actions */}
            <div className="hero-ctas">
              <button
                type="button"
                className="btn hero-btn-find cursor-pointer"
                onClick={() => navigate('/dashboard')}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span>Find a Classroom</span>
              </button>

              <button
                type="button"
                className="btn hero-btn-time cursor-pointer"
                onClick={() => navigate('/timetable')}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                <span>Explore Timetable</span>
              </button>
            </div>

            {/* Feature Badges */}
            <div className="hero-features">
              <div className="feat-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Real-time Availability</span>
              </div>

              <div className="feat-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                  <path d="m9 16 2 2 4-4" />
                </svg>
                <span>Easy Scheduling</span>
              </div>

              <div className="feat-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>For Authorized Users</span>
              </div>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="hero-photo-wrap">
            <div className="hero-photo-card">
              <div className="photo-badge">
                <span className="live-dot" />
                <span>Campus View</span>
              </div>

              <img
                src={classroomImg}
                alt="VacanSee Campus View"
                className="hero-photo-img"
              />

              <div className="photo-dots">
                <span className="p-dot" />
                <span className="p-dot active" />
                <span className="p-dot" />
              </div>
            </div>
          </div>
        </div>

        {/* 4 Animated Live Stats */}
        <div className="stats" id="stats">
          <div className="card stat">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="3" rx="2" />
                <line x1="8" x2="16" y1="21" y2="21" />
                <line x1="12" x2="12" y1="17" y2="21" />
              </svg>
            </div>
            <div className="stat-info">
              <b>{countClassrooms}</b>
              <span>Total Classrooms</span>
            </div>
          </div>

          <div className="card stat">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <path d="M4 18v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5" />
                <line x1="6" x2="6" y1="18" y2="20" />
                <line x1="18" x2="18" y1="18" y2="20" />
              </svg>
            </div>
            <div className="stat-info">
              <b>{countAvailable}</b>
              <span>Currently Available</span>
            </div>
          </div>

          <div className="card stat">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="stat-info">
              <b>{countStudents}</b>
              <span>Students Using Vacansee</span>
            </div>
          </div>

          <div className="card stat">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="stat-info">
              <b>{countHours.toLocaleString()}</b>
              <span>Hours Saved</span>
            </div>
          </div>
        </div>

        {/* Enriched Landing Bottom Bar */}
        <footer className="landing-footer-bar">
          <div className="landing-footer-content">
            {/* Left: Campus Status & System Health */}
            <div className="footer-status-pill">
              <span className="live-status-dot" aria-hidden="true" />
              <span className="footer-status-text">
                <b>40 Buildings Online</b> · 960 Classrooms Monitored · Real-time Sync Active
              </span>
            </div>

            {/* Center: System Operating Hours */}
            <div className="footer-center-meta">
              <span className="footer-meta-item">
                🕒 Campus Hours: <b>8:00 AM – 6:00 PM</b> (Mon–Fri)
              </span>
              <span className="footer-meta-sep">·</span>
              <span className="footer-meta-item">
                Deterministic Lecture Simulation
              </span>
            </div>

            {/* Right: Quick Links / Brand */}
            <div className="footer-quick-links">
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => navigate('/dashboard')}
              >
                Find Room
              </button>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => navigate('/timetable')}
              >
                Timetable
              </button>
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => navigate('/report')}
              >
                Report Issue
              </button>
              <span className="footer-copy">© 2026 Vacansee</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

