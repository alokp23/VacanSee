import React from 'react';
import { getBuildingName } from '../../data/roomsData.js';
import {
  formatTime,
  formatDuration,
  getFreeUntilMinute,
  hasRecentReport,
  getCurrentTime
} from '../../data/scheduleEngine.js';
import { useReservation } from '../../context/ReservationContext.jsx';
import FacilityChips from './FacilityChips.jsx';
import Pill from './Pill.jsx';

/**
 * VacanSee - Classroom Search Result Card
 * 
 * Displays individual classroom information, real-time availability badge,
 * capacity, amenity chips, and triggers the Room Details modal dialog.
 * 
 * @param {{
 *   room: { id: string, b: number, floor: number, cap: number, fac: string[], type: string },
 *   startMinute?: number,
 *   onViewDetails: (roomId: string) => void
 * }} props
 */
export default function RoomCard({ room, startMinute, onViewDetails }) {
  const { reservations, reports, simTime } = useReservation();
  const currentTime = getCurrentTime(simTime);

  const activeStartMinute = startMinute !== undefined ? startMinute : currentTime.m;
  const freeUntil = getFreeUntilMinute(room, activeStartMinute, currentTime, reservations);
  const statusBadge = (activeStartMinute === currentTime.m)
    ? 'Available'
    : `Free at ${formatTime(activeStartMinute)}`;

  const isReported = hasRecentReport(room, reports);

  return (
    <article className="card room">
      <div className="hd">
        <h3>Room {room.id}</h3>
        <Pill status="free" label={statusBadge} />
      </div>

      <div className="info">
        {getBuildingName(room.b)} · Floor {room.floor} · {room.type}
      </div>

      <div className="info">
        Capacity: <b>{room.cap}</b> seats
      </div>

      <div className="info">
        Available until: <b>{formatTime(freeUntil)}</b> ({formatDuration(freeUntil - activeStartMinute)})
      </div>

      <FacilityChips facilities={room.fac} className="my-2" />

      {isReported && (
        <div className="info text-amber-500 font-semibold text-xs my-1">
          ⚑ Availability reported — verify on arrival
        </div>
      )}

      <button
        type="button"
        className="btn p sm mt-2"
        onClick={() => onViewDetails(room.id)}
      >
        View Details
      </button>
    </article>
  );
}

