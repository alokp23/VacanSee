import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useReservation } from '../../context/ReservationContext.jsx';

/**
 * VacanSee - Floating Capsule Dock Navigation
 * 
 * Implements the Nothing OS-inspired floating pill header and expanding
 * dropdown navigation drawer with theme toggling and React Router navigation.
 * 
 * @param {{
 *   currentRoute?: string,
 *   onNavigate?: (route: string) => void
 * }} props
 */
export default function DockNav({ currentRoute = 'home', onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const { openModal } = useReservation();

  const handleLinkClick = (route) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(route);
    }
    navigate(`/${route}`);
  };

  const handleAuthAction = () => {
    setIsOpen(false);
    if (isAuthenticated) {
      logout();
      navigate('/home');
    } else {
      openModal('signin');
    }
  };

  return (
    <header className="dock-wrapper">
      {/* Floating Capsule Pill Bar */}
      <div
        className="dock-pill"
        id="dockPill"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <button
          type="button"
          className="dock-toggle"
          id="dockToggle"
          aria-label="Toggle Menu"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
        >
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
            <line y1="1" x2="18" y2="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line y1="11" x2="18" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <a
          href="#/home"
          className="dock-brand"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLinkClick('home');
          }}
        >
          VACANSEE (R)
        </a>

        <button
          type="button"
          className="dock-theme-btn themeBtn"
          aria-label="Toggle theme"
          onClick={(e) => {
            e.stopPropagation();
            toggleTheme();
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v18c4.97 0 9-4.03 9-9s-4.03-9-9-9z" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Backdrop overlay */}
      <div
        className={`dock-backdrop ${isOpen ? 'open' : ''}`}
        id="dockBackdrop"
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Expanded Nothing-style Dropdown Drawer */}
      <div
        className={`dock-menu ${isOpen ? 'open' : ''}`}
        id="dockMenu"
        aria-hidden={!isOpen}
      >
        <div className="dock-menu-card">
          <div className="dock-menu-top">
            <button
              type="button"
              className="dock-close"
              id="dockClose"
              aria-label="Close Menu"
              onClick={() => setIsOpen(false)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="dock-menu-title">VACANSEE (R)</span>
            <button
              type="button"
              className="dock-menu-theme themeBtn"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18c4.97 0 9-4.03 9-9s-4.03-9-9-9z" fill="currentColor" />
              </svg>
            </button>
          </div>

          <nav className="dock-nav-list">
            <a
              href="#/dashboard"
              className="dock-nav-item"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('dashboard');
              }}
            >
              FIND ROOMS
            </a>
            <a
              href="#/timetable"
              className="dock-nav-item"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('timetable');
              }}
            >
              TIMETABLE
            </a>
            <a
              href="#/reservations"
              className="dock-nav-item"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('reservations');
              }}
            >
              MY RESERVATIONS
            </a>
            <button
              type="button"
              className="dock-nav-item dock-btn-link"
              id="signIn"
              onClick={handleAuthAction}
            >
              {isAuthenticated ? 'SIGN OUT' : 'SIGN IN'}
            </button>
            <a
              href="#/dashboard"
              className="dock-nav-item dock-nav-cta"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('dashboard');
              }}
            >
              GET STARTED
            </a>
          </nav>

          <div className="dock-menu-footer">
            <a
              href="#/settings"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('settings');
              }}
            >
              ACCOUNT
            </a>
            <a
              href="#/report"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('report');
              }}
            >
              SUPPORT
            </a>
            <a
              href="#/home"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('home');
              }}
            >
              CAMPUS
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
