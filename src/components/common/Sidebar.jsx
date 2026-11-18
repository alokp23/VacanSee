import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

/**
 * VacanSee - Authenticated App Shell Sidebar
 * 
 * Provides navigation between internal application pages (Find Room, Timetable,
 * Reservations, Report, Settings), user profile badge, theme toggling, and sign-out.
 * 
 * @param {{
 *   currentRoute: string,
 *   onNavigate?: (route: string) => void
 * }} props
 */
export default function Sidebar({ currentRoute = 'dashboard', onNavigate }) {
  const navigate = useNavigate();
  const { user, roleLabel, logout } = useAuth();
  const { toggleTheme } = useTheme();

  const navItems = [
    { route: 'dashboard', label: '⌕ Find Vacant Room' },
    { route: 'timetable', label: '▥ Timetable' },
    { route: 'reservations', label: '✓ My Reservations' },
    { route: 'report', label: '⚑ Report Issue' },
    { route: 'settings', label: '⚙ Settings' }
  ];

  const handleLinkClick = (route) => {
    if (onNavigate) {
      onNavigate(route);
    }
    navigate(`/${route}`);
  };

  const handleSignOut = () => {
    logout();
    navigate('/home');
  };

  return (
    <aside className="side">
      {/* Brand Logo */}
      <a
        href="#/home"
        className="logo"
        onClick={(e) => {
          e.preventDefault();
          handleLinkClick('home');
        }}
      >
        <i>
          <b></b><b></b><b></b><b></b>
        </i>
        Vacansee
      </a>

      {/* Navigation Links */}
      {navItems.map((item) => (
        <a
          key={item.route}
          href={`#/${item.route}`}
          className={currentRoute === item.route ? 'on' : ''}
          data-r={item.route}
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick(item.route);
          }}
        >
          {item.label}
        </a>
      ))}

      {/* Footer Profile & Actions */}
      <div className="ft">
        {user && (
          <div className="ub" id="ub">
            <b>{user.name}</b>
            {user.id}
            <span className="role">{roleLabel}</span>
          </div>
        )}

        <button
          type="button"
          className="btn sm themeBtn"
          onClick={toggleTheme}
        >
          ◐ Theme
        </button>

        <button
          type="button"
          className="btn sm"
          id="out"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
