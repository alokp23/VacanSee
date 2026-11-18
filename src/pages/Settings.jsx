import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useReservation } from '../context/ReservationContext.jsx';
import { useCurrentTime } from '../hooks/useCurrentTime.js';
import { formatTime, DAYS } from '../data/scheduleEngine.js';

/**
 * VacanSee - User Settings & Demo Configuration View
 * 
 * Manages authenticated user profile view, demo time simulator,
 * theme preferences, and demo state resets.
 */
export default function Settings() {
  const navigate = useNavigate();
  const { user, roleLabel, logout, accessDescription } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { simTime, setSimTime, clearAllData, showToast } = useReservation();
  const currentTime = useCurrentTime(simTime);

  const [demoTimeInput, setDemoTimeInput] = useState(simTime || '');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSimTime(demoTimeInput);
    showToast('Settings saved');
  };

  const handleSignOut = () => {
    logout();
    navigate('/home');
  };

  const handleClearData = () => {
    clearAllData();
  };

  return (
    <div>
      {/* View Header */}
      <div className="top">
        <div>
          <h1>Settings</h1>
          <p className="mute">Your account and demo options.</p>
        </div>
        <div className="clock">
          {currentTime.sim ? 'Demo time' : 'Live'} · {DAYS[currentTime.day]} {formatTime(currentTime.m)}
        </div>
      </div>

      {/* Settings Form Card */}
      <div className="card" style={{ maxWidth: '520px' }}>
        <form className="f" id="sf" onSubmit={handleSaveSettings}>
          <label>
            Name
            <input value={user ? user.name : ''} disabled />
          </label>

          <label>
            Registration ID
            <input value={user ? user.id : ''} disabled />
          </label>

          <label>
            Role
            <input value={roleLabel} disabled />
          </label>

          <p className="mute text-xs mb-1">
            {accessDescription}
          </p>

          <label>
            Demo time <span className="mute">(leave empty to use real clock)</span>
            <input
              type="time"
              id="sTime"
              value={demoTimeInput}
              onChange={(e) => setDemoTimeInput(e.target.value)}
            />
          </label>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
            <button className="btn p cursor-pointer" type="submit">
              Save settings
            </button>

            <button
              className="btn cursor-pointer"
              type="button"
              onClick={toggleTheme}
            >
              Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>

            <button
              className="btn cursor-pointer"
              type="button"
              id="sOut"
              onClick={handleSignOut}
            >
              Sign out
            </button>

            <button
              className="btn d cursor-pointer"
              type="button"
              id="sReset"
              onClick={handleClearData}
            >
              Clear reservations and reports
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

