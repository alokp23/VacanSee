import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import { getRoomById, getBuildingName } from '../../data/roomsData.js';
import {
  getCurrentTime,
  formatTime,
  formatDuration,
  isRoomVacant,
  CAMPUS_CLOSE_MINUTE
} from '../../data/scheduleEngine.js';
import {
  validateRoomBooking,
  getMaxBookingMinutes,
  getAvailablePurposes,
  canRoleReserve
} from '../../data/usersData.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useReservation } from '../../context/ReservationContext.jsx';

/**
 * VacanSee - Room Booking & Reservation Modal Dialog
 * 
 * Facilitates booking a classroom with real-time validation:
 * - Role-Based Permission Enforcement:
 *   - Students CANNOT reserve classrooms (view-only).
 *   - Faculty, HOD, HOS, Dean, Admin can reserve classrooms.
 * - Start time selection (rounded to next 30-minute block)
 * - Duration selection capped by institutional role limits
 * - Group size validation against room capacity
 * - Purpose verification against RBAC rules and room equipment
 * - Conflict detection against deterministic lectures and active reservations
 * 
 * @param {{
 *   roomId?: string,
 *   isOpen?: boolean,
 *   onClose?: () => void
 * }} props
 */
export default function BookingModal({
  roomId: propRoomId,
  isOpen,
  onClose
}) {
  const { user, userLevel } = useAuth();
  const {
    activeModal,
    closeModal,
    openModal,
    addReservation,
    reservations,
    simTime
  } = useReservation();

  // Modal open status and targeted room
  const isModalOpen = isOpen !== undefined ? isOpen : (activeModal?.type === 'booking');
  const targetRoomId = propRoomId || (activeModal?.type === 'booking' ? activeModal.data : null);
  const handleClose = onClose || closeModal;

  // Retrieve room
  const room = targetRoomId ? getRoomById(targetRoomId) : null;

  // Calculate current campus time and available options
  const currentTime = getCurrentTime(simTime);
  const maxAllowedDuration = getMaxBookingMinutes(userLevel);
  const allowedPurposes = getAvailablePurposes(userLevel);

  // Calculate earliest 30-minute start slot today
  const firstSlot = Math.ceil(currentTime.m / 30) * 30;

  // Local form state
  const [startMinute, setStartMinute] = useState(firstSlot < 1050 ? firstSlot : 0);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [groupSize, setGroupSize] = useState(1);
  const [purpose, setPurpose] = useState(allowedPurposes[0] || 'Meeting');
  const [errorMessage, setErrorMessage] = useState('');

  // Reinitialize form when modal opens or room changes
  useEffect(() => {
    if (isModalOpen && room) {
      const nextSlot = Math.ceil(currentTime.m / 30) * 30;
      setStartMinute(nextSlot < 1050 ? nextSlot : 0);

      const defaultDur = Math.min(60, maxAllowedDuration);
      setDurationMinutes(defaultDur);

      setGroupSize(1);
      setPurpose(allowedPurposes[0] || 'Meeting');
      setErrorMessage('');
    }
  }, [isModalOpen, targetRoomId]);

  if (!isModalOpen || !room) return null;

  // If user is not authenticated, show sign-in prompt modal trigger
  if (!user) {
    return (
      <Modal isOpen={isModalOpen} onClose={handleClose}>
        <h2>Sign In Required</h2>
        <p className="mute" style={{ margin: '14px 0' }}>
          Please sign in with your college Registration ID before reserving Room {room.id}.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn p"
            onClick={() => openModal('signin')}
          >
            Sign In Now
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>
      </Modal>
    );
  }

  // Strict Rule 6: Students cannot reserve classrooms
  if (!canRoleReserve(userLevel)) {
    return (
      <Modal isOpen={isModalOpen} onClose={handleClose}>
        <h2>Reservation Restricted</h2>
        <p className="mute" style={{ margin: '14px 0', lineHeight: 1.6 }}>
          Students can search and view vacant classrooms for study purposes, but cannot reserve them.
          Classroom reservations are strictly restricted to <b>Faculty, HOD, Dean, and Admin</b>.
        </p>
        <button
          type="button"
          className="btn p"
          onClick={handleClose}
        >
          Understood
        </button>
      </Modal>
    );
  }

  // Generate start time dropdown options (up to 5:00 PM / 1020m)
  const startTimeOptions = [];
  for (let minute = firstSlot; minute < 1050; minute += 30) {
    startTimeOptions.push(minute);
  }

  // Generate allowed duration options
  const durationOptionsList = [30, 60, 90, 120, 180, 240, 480].filter(
    (dur) => dur <= maxAllowedDuration
  );

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Guard: Re-check role permission
    if (!canRoleReserve(userLevel)) {
      setErrorMessage('Students can search and view vacant classrooms but cannot reserve them.');
      return;
    }

    // Validation 1: Time slots remaining today
    if (!startMinute || startMinute >= 1050) {
      setErrorMessage('No time slots left today. Try again tomorrow.');
      return;
    }

    // Validation 2: Group size validity
    if (!groupSize || groupSize < 1) {
      setErrorMessage('Enter a group size of at least 1.');
      return;
    }

    // Validation 3: Room seating capacity limit
    if (groupSize > room.cap) {
      setErrorMessage(
        `This room only seats ${room.cap}. Reduce the group size or pick a bigger room.`
      );
      return;
    }

    // Validation 4: Role permissions, maximum duration, purpose, and equipment
    const roleValidationError = validateRoomBooking(room, purpose, durationMinutes, userLevel);
    if (roleValidationError) {
      setErrorMessage(roleValidationError);
      return;
    }

    // Validation 5: Campus closing time (6:00 PM / 1080 minutes)
    if (startMinute + durationMinutes > CAMPUS_CLOSE_MINUTE) {
      setErrorMessage('Campus closes at 6:00 PM. Choose an earlier start or shorter duration.');
      return;
    }

    // Validation 6: Collision detection against scheduled lectures and existing bookings
    if (!isRoomVacant(room, startMinute, durationMinutes, currentTime, reservations)) {
      setErrorMessage('That slot overlaps a lecture or another booking. Pick a free time from the timeline.');
      return;
    }

    // Submit reservation to context
    const result = addReservation(
      {
        startMinute,
        durationMinutes,
        groupSize,
        purpose,
        user
      },
      room
    );

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to complete reservation.');
      return;
    }

    // Close modal on success
    handleClose();
  };

  return (
    <Modal isOpen={isModalOpen} onClose={handleClose}>
      <h2>Reserve · Room {room.id}</h2>

      <p className="mute" style={{ marginBottom: '14px' }}>
        Today · {getBuildingName(room.b)} · Capacity {room.cap} seats
      </p>

      <form className="f" id="rf" noValidate onSubmit={handleSubmit}>
        <div className="two">
          <label>
            Start
            <select
              id="rS"
              value={startMinute}
              onChange={(e) => setStartMinute(parseInt(e.target.value, 10))}
            >
              {startTimeOptions.length === 0 ? (
                <option value="0">No slots available</option>
              ) : (
                startTimeOptions.map((minute) => (
                  <option key={minute} value={minute}>
                    {formatTime(minute)}
                  </option>
                ))
              )}
            </select>
          </label>

          <label>
            Duration
            <select
              id="rD"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
            >
              {durationOptionsList.map((dur) => (
                <option key={dur} value={dur}>
                  {formatDuration(dur)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Group size
          <input
            type="number"
            id="rP"
            min="1"
            max={room.cap}
            value={groupSize}
            onChange={(e) => setGroupSize(parseInt(e.target.value, 10) || 1)}
          />
        </label>

        <label>
          Purpose
          <select
            id="rU"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          >
            {allowedPurposes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <div className="err" id="rE">
          {errorMessage}
        </div>

        <button className="btn p" type="submit">
          Confirm
        </button>
      </form>
    </Modal>
  );
}
