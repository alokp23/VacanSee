import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useReservation } from '../context/ReservationContext.jsx';
import { useCurrentTime } from '../hooks/useCurrentTime.js';
import Pill from '../components/common/Pill.jsx';
import { ROOMS, getBuildingList } from '../data/roomsData.js';
import { formatTime, DAYS } from '../data/scheduleEngine.js';

/**
 * VacanSee - Report Classroom Status Issue View
 * 
 * Allows students and faculty to submit discrepancy reports when classroom availability,
 * capacity, or equipment state differs from the system timetable.
 */
export default function Report() {
  const { user, isAdmin } = useAuth();
  const {
    filters,
    updateFilters,
    reports,
    addReport,
    simTime
  } = useReservation();

  const currentTime = useCurrentTime(simTime);
  const buildingList = getBuildingList();

  // Form local state
  const [selectedBuilding, setSelectedBuilding] = useState(filters.b || '');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [issueType, setIssueType] = useState('Shown vacant but in use');
  const [detailsText, setDetailsText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Rooms in selected building
  const availableRooms = selectedBuilding
    ? ROOMS.filter((r) => String(r.b) === String(selectedBuilding))
    : [];

  // When building changes, update room selection
  const handleBuildingChange = (e) => {
    const bId = e.target.value;
    setSelectedBuilding(bId);
    updateFilters({ b: bId });
    const roomsInBuilding = ROOMS.filter((r) => String(r.b) === String(bId));
    setSelectedRoom(roomsInBuilding.length > 0 ? roomsInBuilding[0].id : '');
    setErrorMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedBuilding || !selectedRoom) {
      setErrorMessage('Select a building and a room.');
      return;
    }

    if (detailsText.trim().length < 10) {
      setErrorMessage('Add at least 10 characters so we can check it.');
      return;
    }

    addReport({
      room: selectedRoom,
      type: issueType,
      txt: detailsText.trim(),
      user: user || { id: 'anonymous', name: 'Anonymous' }
    });

    // Reset details and error
    setDetailsText('');
    setErrorMessage('');
  };

  // Filter reports visible to current user (Admin views all)
  const visibleReports = isAdmin
    ? [...reports]
    : reports.filter((r) => r.by === (user ? user.id : ''));

  return (
    <div>
      {/* View Header */}
      <div className="top">
        <div>
          <h1>Report Issue</h1>
          <p className="mute">Tell us when a room's status is wrong.</p>
        </div>
        <div className="clock">
          {currentTime.sim ? 'Demo time' : 'Live'} · {DAYS[currentTime.day]} {formatTime(currentTime.m)}
        </div>
      </div>

      {/* Submission Form Card */}
      <div className="card" style={{ maxWidth: '520px' }}>
        <form className="f" id="pf" noValidate onSubmit={handleSubmit}>
          {/* Building Selection */}
          <label>
            Building
            <select
              id="rB"
              value={selectedBuilding}
              onChange={handleBuildingChange}
            >
              <option value="">Select a building</option>
              {buildingList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          {/* Room Selection */}
          <label>
            Room
            <select
              id="rRoom"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
            >
              {availableRooms.length === 0 ? (
                <option value="">Select a building first</option>
              ) : (
                availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} ({r.type})
                  </option>
                ))
              )}
            </select>
          </label>

          {/* Issue Type */}
          <label>
            What is wrong?
            <select
              id="rType"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
            >
              <option value="Shown vacant but in use">Shown vacant but in use</option>
              <option value="Shown occupied but empty">Shown occupied but empty</option>
              <option value="Wrong capacity">Wrong capacity</option>
              <option value="Facility not working">Facility not working</option>
            </select>
          </label>

          {/* Details */}
          <label>
            Details
            <textarea
              id="rTxt"
              rows={3}
              placeholder="What did you see?"
              value={detailsText}
              onChange={(e) => {
                setDetailsText(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
            />
          </label>

          <div className="err" id="pE">
            {errorMessage}
          </div>

          <button className="btn p cursor-pointer" type="submit">
            Submit report
          </button>
        </form>
      </div>

      {/* Recent Reports List */}
      {visibleReports.length > 0 && (
        <div style={{ marginTop: '28px' }}>
          <h2 className="text-base font-bold text-neutral-200 mb-3">
            {isAdmin ? 'All Reports' : 'Your Reports'}
          </h2>

          <div className="list">
            {visibleReports
              .slice()
              .reverse()
              .map((item, index) => (
                <div key={index} className="card li">
                  <div>
                    <h3>
                      Room {item.room} — {item.type}
                    </h3>
                    <span className="mute">
                      {item.txt}
                      {isAdmin ? ` · ${item.name}` : ''}
                    </span>
                  </div>

                  <Pill status="soon" label="Under review" />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

