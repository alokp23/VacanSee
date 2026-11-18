import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useReservation } from '../context/ReservationContext.jsx';
import { useCurrentTime } from '../hooks/useCurrentTime.js';
import Pill from '../components/common/Pill.jsx';
import { getRoomById, getBuildingName } from '../data/roomsData.js';
import { formatTime, padZero, DAYS } from '../data/scheduleEngine.js';

/**
 * VacanSee - My Reservations View
 * 
 * Lists all active and past classroom reservations.
 * Standard users see their personal bookings; Administrators can review
 * institutional bookings across campus.
 * Allows cancelling active upcoming reservations with immediate feedback.
 */
export default function Reservations() {
  const navigate = useNavigate();
  const { user, isAdmin, ROLE_LABELS } = useAuth();
  const { reservations, cancelReservation, simTime } = useReservation();
  const currentTime = useCurrentTime(simTime);

  // Filter reservations visible to current user (Admin views all)
  const visibleReservations = isAdmin
    ? [...reservations]
    : reservations.filter((r) => r.by === (user ? user.id : ''));

  // Sort by date and start time
  visibleReservations.sort((a, b) => {
    const keyA = `${a.date}${padZero(Math.floor(a.start / 60))}`;
    const keyB = `${b.date}${padZero(Math.floor(b.start / 60))}`;
    return keyA.localeCompare(keyB);
  });

  const pageTitle = isAdmin ? 'All Reservations' : 'My Reservations';
  const pageSubtitle = isAdmin
    ? 'Admin view of every booking across campus.'
    : 'Rooms you have reserved.';

  return (
    <div>
      {/* View Header */}
      <div className="top">
        <div>
          <h1>{pageTitle}</h1>
          <p className="mute">{pageSubtitle}</p>
        </div>
        <div className="clock">
          {currentTime.sim ? 'Demo time' : 'Live'} · {DAYS[currentTime.day]} {formatTime(currentTime.m)}
        </div>
      </div>

      {/* Reservations List */}
      {visibleReservations.length > 0 ? (
        <div className="list">
          {visibleReservations.map((booking) => {
            const isPast =
              booking.date < currentTime.dt ||
              (booking.date === currentTime.dt && booking.end <= currentTime.m);

            const room = getRoomById(booking.room);
            const buildingName = room ? getBuildingName(room.b) : '';
            const dateLabel = booking.date === currentTime.dt ? 'Today' : booking.date;
            const peopleLabel =
              booking.people > 1 ? `${booking.people} people` : '1 person';
            const adminDetails = isAdmin
              ? ` · ${booking.name} (${ROLE_LABELS[booking.role] || booking.role})`
              : '';

            return (
              <div key={booking.id} className="card li">
                <div>
                  <h3>
                    Room {booking.room}{' '}
                    <span className="mute" style={{ fontWeight: 400 }}>
                      · {buildingName}
                    </span>
                  </h3>
                  <span className="mute">
                    {dateLabel} · {formatTime(booking.start)}–{formatTime(booking.end)} ·{' '}
                    {peopleLabel} · {booking.purpose}
                    {adminDetails}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Pill
                    status={isPast ? 'closed' : 'free'}
                    label={isPast ? 'Completed' : 'Upcoming'}
                  />

                  {!isPast && (
                    <button
                      type="button"
                      className="btn sm d"
                      onClick={() => cancelReservation(booking.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card empty">
          No reservations yet.
          <br /><br />
          <button
            type="button"
            className="btn p cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            Find a vacant classroom
          </button>
        </div>
      )}
    </div>
  );
}

