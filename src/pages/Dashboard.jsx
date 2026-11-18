import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useReservation } from '../context/ReservationContext.jsx';
import { useCurrentTime } from '../hooks/useCurrentTime.js';
import RoomCard from '../components/common/RoomCard.jsx';
import {
  ROOMS,
  getBuildingList,
  getBuildingName,
  ALL_FACILITIES
} from '../data/roomsData.js';
import {
  formatTime,
  formatDuration,
  isRoomVacant,
  getRoomStatus,
  getFreeUntilMinute,
  DAYS
} from '../data/scheduleEngine.js';
import { validateRoomBooking } from '../data/usersData.js';

/**
 * VacanSee - Find Vacant Classrooms Dashboard
 * 
 * Features interactive real-time classroom searching across all 40 buildings:
 * - Dynamic Building, Start Time, Capacity, Duration, Purpose, and Facilities filters
 * - Live summary metrics (Vacant now, Available soon, Matches, My reservations)
 * - Deterministic occupancy calculations with double-booking collision detection
 * - Clear filters button to easily reset constraints
 * - "View Details" action triggering RoomDetailModal
 */
export default function Dashboard() {
  const { user, userLevel, roleLabel, accessDescription, maxBookingMinutes, allowedPurposes } = useAuth();
  const {
    filters,
    updateFilters,
    reservations,
    openModal,
    simTime
  } = useReservation();

  const currentTime = useCurrentTime(simTime);
  const buildingList = getBuildingList();

  // Reset duration filter if it exceeds user's max allowed
  const currentDuration = parseInt(filters.dur, 10) > maxBookingMinutes ? '60' : filters.dur;

  // Generate 30-min start time options (from next slot up to 5:00 PM / 1020m)
  const startTimeOptions = [];
  const nextHourSlot = (Math.floor(currentTime.m / 30) + 1) * 30;
  for (let minute = nextHourSlot; minute < 1050; minute += 30) {
    startTimeOptions.push(minute);
  }

  // Capacity options
  const capacityOptionsList = [
    { value: '0', label: 'Any' },
    { value: '10', label: '10+' },
    { value: '20', label: '20+' },
    { value: '30', label: '30+' },
    { value: '50', label: '50+' },
    { value: '80', label: '80+' },
    { value: '100', label: '100+' }
  ];

  // Duration options allowed for user role
  const durationOptionsList = [30, 60, 90, 120, 180, 240, 480].filter(
    (mins) => mins <= maxBookingMinutes
  );

  // Filter change handlers
  const handleBuildingChange = (e) => {
    updateFilters({ b: e.target.value });
  };

  const handleStartChange = (e) => {
    updateFilters({ start: e.target.value });
  };

  const handleCapacityChange = (e) => {
    updateFilters({ cap: e.target.value });
  };

  const handleDurationChange = (e) => {
    updateFilters({ dur: e.target.value });
  };

  const handlePurposeChange = (e) => {
    updateFilters({ pur: e.target.value });
  };

  const handleFacilityToggle = (facility) => {
    updateFilters((prev) => {
      const exists = prev.fac.includes(facility);
      const updatedFac = exists
        ? prev.fac.filter((f) => f !== facility)
        : [...prev.fac, facility];
      return { ...prev, fac: updatedFac };
    });
  };

  const handleClearFilters = () => {
    updateFilters({
      start: 'now',
      cap: '0',
      dur: '60',
      pur: '',
      fac: []
    });
  };

  // Calculation parameters
  const selectedBuildingId = filters.b;
  const startMinute = filters.start === 'now' ? currentTime.m : parseInt(filters.start, 10);
  const durationMinutes = parseInt(currentDuration, 10);
  const minCapacity = parseInt(filters.cap, 10);

  // Compute matching rooms in selected building
  let buildingRooms = [];
  let roomStatuses = [];
  let matchingRooms = [];
  let vacantNowCount = 0;
  let freesSoonCount = 0;

  if (selectedBuildingId) {
    buildingRooms = ROOMS.filter((r) => String(r.b) === String(selectedBuildingId));
    roomStatuses = buildingRooms.map((r) =>
      getRoomStatus(r, currentTime.m, currentTime, reservations)
    );

    vacantNowCount = roomStatuses.filter((s) => s.k === 'free').length;
    freesSoonCount = roomStatuses.filter((s) => s.k === 'soon').length;

    matchingRooms = buildingRooms.filter((room) => {
      // 1. Vacancy during requested time block
      const isVacant = isRoomVacant(room, startMinute, durationMinutes, currentTime, reservations);
      // 2. Capacity requirement
      const hasCapacity = room.cap >= minCapacity;
      // 3. Facility requirements
      const hasAllFacilities = filters.fac.every((f) => room.fac.includes(f));
      // 4. Purpose compatibility
      const noPurposeError = !filters.pur || !validateRoomBooking(room, filters.pur, durationMinutes, userLevel);

      return isVacant && hasCapacity && hasAllFacilities && noPurposeError;
    });

    // Sort: best fit for capacity closest first, then longest remaining availability
    matchingRooms.sort((a, b) => {
      if (minCapacity > 0) {
        const diffA = Math.abs(a.cap - minCapacity);
        const diffB = Math.abs(b.cap - minCapacity);
        if (diffA !== diffB) return diffA - diffB;
      }
      return (
        getFreeUntilMinute(b, startMinute, currentTime, reservations) -
        getFreeUntilMinute(a, startMinute, currentTime, reservations)
      );
    });
  }

  // Active reservations count for current user
  const activeBookingsCount = reservations.filter((res) => {
    const isPast =
      res.date < currentTime.dt ||
      (res.date === currentTime.dt && res.end <= currentTime.m);
    return !isPast;
  }).length;

  return (
    <div>
      {/* Top Header with Live Campus Clock */}
      <div className="top">
        <div>
          <h1>Find a Vacant Classroom</h1>
          <p className="mute">
            {user ? `${user.name} ` : ''}
            <span className="role">{roleLabel}</span>
          </p>
        </div>
        <div className="clock">
          {currentTime.sim ? 'Demo time' : 'Live'} · {DAYS[currentTime.day]} {formatTime(currentTime.m)}
        </div>
      </div>

      {/* Filter Control Card */}
      <div className="card fcard">
        <div className="fg">
          {/* Building Selector */}
          <label>
            Building
            <select
              id="fb"
              value={filters.b}
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

          {/* Start Time Selector */}
          <label>
            Start
            <select
              id="fst"
              value={filters.start}
              onChange={handleStartChange}
            >
              <option value="now">Now</option>
              {startTimeOptions.map((min) => (
                <option key={min} value={min}>
                  {formatTime(min)}
                </option>
              ))}
            </select>
          </label>

          {/* Capacity Selector */}
          <label>
            Capacity
            <select
              id="fcap"
              value={filters.cap}
              onChange={handleCapacityChange}
            >
              {capacityOptionsList.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {/* Duration Selector */}
          <label>
            Duration
            <select
              id="fd"
              value={currentDuration}
              onChange={handleDurationChange}
            >
              {durationOptionsList.map((dur) => (
                <option key={dur} value={dur}>
                  {formatDuration(dur)}
                </option>
              ))}
            </select>
          </label>

          {/* Purpose Selector */}
          <label>
            Purpose
            <select
              id="fp"
              value={filters.pur}
              onChange={handlePurposeChange}
            >
              <option value="">Select Purpose</option>
              {allowedPurposes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Facility Amenity Checkboxes */}
        <div className="fac">
          <span className="font-semibold text-neutral-300 mr-2">Facilities:</span>
          {ALL_FACILITIES.map((fac) => (
            <label key={fac} className="ck">
              <input
                type="checkbox"
                checked={filters.fac.includes(fac)}
                onChange={() => handleFacilityToggle(fac)}
              />
              {fac}
            </label>
          ))}
        </div>

        {/* Reset & Role Policy Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800">
          <p className="mute note m-0 text-xs">
            {accessDescription}
          </p>
          <button
            type="button"
            className="btn sm"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Summary Metrics Row */}
      {selectedBuildingId ? (
        <div id="fsum">
          <div className="sum">
            <div className="card" style={{ '--c': 'var(--free)' }}>
              <b>{vacantNowCount}</b>
              <span>Vacant now in {getBuildingName(selectedBuildingId)}</span>
            </div>
            <div className="card" style={{ '--c': 'var(--soon)' }}>
              <b>{freesSoonCount}</b>
              <span>Available soon</span>
            </div>
            <div className="card">
              <b>{matchingRooms.length}</b>
              <span>Match your filters</span>
            </div>
            <div className="card">
              <b>{activeBookingsCount}</b>
              <span>My reservations</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Classroom Results Grid */}
      <div id="fres" className="grid">
        {!selectedBuildingId ? (
          <div className="card empty" style={{ gridColumn: '1/-1' }}>
            Select a building above to see its vacant classrooms.
          </div>
        ) : matchingRooms.length > 0 ? (
          <>
            {minCapacity > 0 && (
              <div style={{ gridColumn: '1/-1' }}>
                <span className="pill free">
                  Best fit for {minCapacity}+ people comes first
                </span>
              </div>
            )}
            {matchingRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                startMinute={startMinute}
                onViewDetails={(id) => openModal('detail', id)}
              />
            ))}
          </>
        ) : (
          <div className="card empty" style={{ gridColumn: '1/-1' }}>
            No vacant rooms in {getBuildingName(selectedBuildingId)} for that window.<br />
            Try a shorter duration, a later start time, or fewer required facilities.
          </div>
        )}
      </div>
    </div>
  );
}

