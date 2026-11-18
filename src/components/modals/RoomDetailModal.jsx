import React from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal.jsx';
import Pill from '../common/Pill.jsx';
import FacilityChips from '../common/FacilityChips.jsx';
import { getRoomById, getBuildingName } from '../../data/roomsData.js';
import {
  getCurrentTime,
  getRoomStatus,
  getBusyIntervals,
  formatTime,
  formatDuration
} from '../../data/scheduleEngine.js';
import { canRoleReserve } from '../../data/usersData.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useReservation } from '../../context/ReservationContext.jsx';

/**
 * VacanSee - Room Details Modal Dialog
 * 
 * Displays complete classroom details, live availability status,
 * a dynamic 8 AM - 6 PM occupancy timeline bar, facility chips,
 * and quick-action buttons for reserving or reporting an issue.
 * 
 * Follows strict RBAC:
 * - Students can search and view vacant classrooms but cannot reserve them.
 * - Faculty, HOD, HOS, Dean, and Admin can reserve classrooms.
 * 
 * @param {{
 *   roomId?: string,
 *   isOpen?: boolean,
 *   onClose?: () => void,
 *   onOpenBooking?: (roomId: string) => void,
 *   onReport?: (roomId: string) => void
 * }} props
 */
export default function RoomDetailModal({
  roomId: propRoomId,
  isOpen,
  onClose,
  onOpenBooking,
  onReport
}) {
  const navigate = useNavigate();
  const { user, userLevel } = useAuth();
  const {
    activeModal,
    closeModal,
    openModal,
    reservations,
    simTime,
    updateFilters,
    showToast
  } = useReservation();

  // Modal open status and targeted room
  const isModalOpen = isOpen !== undefined ? isOpen : (activeModal?.type === 'detail');
  const targetRoomId = propRoomId || (activeModal?.type === 'detail' ? activeModal.data : null);
  const handleClose = onClose || closeModal;

  if (!isModalOpen || !targetRoomId) return null;

  // Retrieve room data
  const room = getRoomById(targetRoomId);
  if (!room) return null;

  // Calculate current time and occupancy schedule
  const currentTime = getCurrentTime(simTime);
  const roomStatus = getRoomStatus(room, currentTime.m, currentTime, reservations);
  const busySlots = getBusyIntervals(room, currentTime.day, currentTime.dt, reservations);

  // Generate 8 AM to 6 PM timeline slots (10 one-hour slots)
  const timelineHours = [];
  for (let hour = 8; hour < 18; hour++) {
    const isBusy = busySlots.some((slot) => (hour * 60) >= slot[0] && (hour * 60) < slot[1]);
    const isCurrent = Math.floor(currentTime.m / 60) === hour;
    timelineHours.push({ hour, isBusy, isCurrent });
  }

  // Check role-based reservation permission
  const userCanReserve = user && canRoleReserve(userLevel);

  // Status descriptive text
  const statusDescription = (roomStatus.k === 'free') ? (
    <span>
      Vacant for the next <b>{formatDuration(roomStatus.left)}</b> (until {formatTime(roomStatus.until)}).
    </span>
  ) : (
    <span>
      Busy until <b>{formatTime(roomStatus.until)}</b>.
    </span>
  );

  // Handle reserve action
  const handleReserveClick = () => {
    if (!user) {
      handleClose();
      openModal('signin');
      return;
    }

    if (!userCanReserve) {
      showToast('Students can search and view classrooms but cannot reserve them.');
      return;
    }

    if (onOpenBooking) {
      onOpenBooking(room.id);
    } else {
      openModal('booking', room.id);
    }
  };

  // Handle report action
  const handleReportClick = () => {
    if (onReport) {
      onReport(room.id);
    } else {
      handleClose();
      updateFilters({ b: String(room.b) });
      navigate('/report');
    }
  };

  return (
    <Modal isOpen={isModalOpen} onClose={handleClose}>
      <h2>Room {room.id}</h2>

      <p className="mute" style={{ marginBottom: '12px' }}>
        {getBuildingName(room.b)} · {room.type} · Floor {room.floor} · {room.cap} seats
      </p>

      <div>
        <Pill status={roomStatus.k} label={roomStatus.label} />
      </div>

      <p style={{ margin: '12px 0' }}>
        {statusDescription}
      </p>

      <div className="mute" style={{ fontSize: '.85rem' }}>
        Today, 8 AM – 6 PM (dark = occupied)
      </div>

      {/* 8 AM to 6 PM visual timeline bar */}
      <div className="tl">
        {timelineHours.map(({ hour, isBusy, isCurrent }) => {
          const classes = [
            isBusy ? 'b' : '',
            isCurrent ? 'now' : ''
          ].filter(Boolean).join(' ');

          return <i key={hour} className={classes} />;
        })}
      </div>

      <div className="tlh">
        <span>8</span>
        <span>10</span>
        <span>12</span>
        <span>2</span>
        <span>4</span>
        <span>6</span>
      </div>

      {/* Facility amenities */}
      <div style={{ margin: '14px 0' }}>
        <FacilityChips facilities={room.fac} />
      </div>

      {/* Student notice if applicable */}
      {user && !userCanReserve && (
        <p className="text-xs text-amber-500 font-semibold mb-3">
          ⓘ Students can view availability but cannot reserve classrooms. Reservations are restricted to Faculty and Staff.
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {!user ? (
          <button
            type="button"
            className="btn p"
            onClick={handleReserveClick}
          >
            Sign In to Reserve
          </button>
        ) : userCanReserve ? (
          <button
            type="button"
            className="btn p"
            id="dRes"
            onClick={handleReserveClick}
          >
            Reserve
          </button>
        ) : (
          <button
            type="button"
            className="btn sm opacity-60 cursor-not-allowed"
            disabled
            title="Students can search and view classrooms but cannot reserve them."
          >
            Students Cannot Reserve
          </button>
        )}

        <button
          type="button"
          className="btn"
          id="dRep"
          onClick={handleReportClick}
        >
          Report incorrect status
        </button>
      </div>
    </Modal>
  );
}
