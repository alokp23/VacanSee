import React, { useState, useEffect } from 'react';
import { useReservation } from '../context/ReservationContext.jsx';
import { useCurrentTime } from '../hooks/useCurrentTime.js';
import {
  ROOMS,
  getBuildingList,
  getBuildingName
} from '../data/roomsData.js';
import {
  formatTime,
  isHourBusy,
  DAYS
} from '../data/scheduleEngine.js';

/**
 * VacanSee - Weekly Classroom Timetable View
 * 
 * Displays the complete Monday through Friday, 8:00 AM to 5:00 PM weekly
 * schedule for any selected classroom. Accurately highlights scheduled lectures (.b),
 * user bookings (.r), and free slots (.f).
 */
export default function Timetable() {
  const { filters, updateFilters, reservations, simTime } = useReservation();
  const currentTime = useCurrentTime(simTime);
  const buildingList = getBuildingList();

  const selectedBuildingId = filters.b;
  const buildingRooms = selectedBuildingId
    ? ROOMS.filter((r) => String(r.b) === String(selectedBuildingId))
    : [];

  // Local state for selected room in timetable
  const [selectedRoomId, setSelectedRoomId] = useState(() => {
    return buildingRooms.length > 0 ? buildingRooms[0].id : '';
  });

  // Keep room selection synchronized when building changes
  useEffect(() => {
    if (buildingRooms.length > 0) {
      if (!buildingRooms.some((r) => r.id === selectedRoomId)) {
        setSelectedRoomId(buildingRooms[0].id);
      }
    } else {
      setSelectedRoomId('');
    }
  }, [selectedBuildingId]);

  const handleBuildingChange = (e) => {
    updateFilters({ b: e.target.value });
  };

  const handleRoomChange = (e) => {
    setSelectedRoomId(e.target.value);
  };

  // If no building is selected, show the building gate selector
  if (!selectedBuildingId) {
    return (
      <div>
        <div className="top">
          <div>
            <h1>Timetable</h1>
            <p className="mute">Select a campus building to view weekly room schedules.</p>
          </div>
          <div className="clock">
            {currentTime.sim ? 'Demo time' : 'Live'} · {DAYS[currentTime.day]} {formatTime(currentTime.m)}
          </div>
        </div>

        <div className="card empty">
          Select a building to continue.
          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center' }}>
            <select
              id="gb"
              value=""
              onChange={handleBuildingChange}
              style={{ maxWidth: '320px' }}
            >
              <option value="">Select a building</option>
              {buildingList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  // Find active room object
  const activeRoom = buildingRooms.find((r) => r.id === selectedRoomId) || buildingRooms[0];

  // Build weekly schedule rows (8:00 AM to 5:00 PM)
  const hoursList = [];
  for (let hour = 8; hour < 18; hour++) {
    hoursList.push(hour);
  }

  return (
    <div>
      {/* Top Header */}
      <div className="top">
        <div>
          <h1>Timetable</h1>
          <p className="mute">
            {getBuildingName(selectedBuildingId)} · Room {activeRoom ? activeRoom.id : ''} Weekly Schedule
          </p>
        </div>
        <div className="clock">
          {currentTime.sim ? 'Demo time' : 'Live'} · {DAYS[currentTime.day]} {formatTime(currentTime.m)}
        </div>
      </div>

      {/* Filter Bar with Building and Room Selectors */}
      <div className="fbar">
        <select
          id="tb"
          value={selectedBuildingId}
          onChange={handleBuildingChange}
        >
          {buildingList.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          id="tr"
          value={selectedRoomId}
          onChange={handleRoomChange}
        >
          {buildingRooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id} ({r.type} · {r.cap} seats)
            </option>
          ))}
        </select>
      </div>

      {/* Weekly Schedule Grid Table */}
      {activeRoom && (
        <div className="card tt overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th></th>
                {DAYS.map((day) => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hoursList.map((hour) => {
                const hourStartMinute = hour * 60;

                return (
                  <tr key={hour}>
                    <th>{formatTime(hourStartMinute)}</th>
                    {DAYS.map((day, dayIndex) => {
                      // Check if user has an active booking
                      const hasBooking = reservations.some((res) => {
                        return (
                          res.room === activeRoom.id &&
                          res.date === currentTime.dt &&
                          dayIndex === currentTime.day &&
                          hourStartMinute >= res.start &&
                          hourStartMinute < res.end
                        );
                      });

                      if (hasBooking) {
                        return (
                          <td key={day} className="r">
                            Booked
                          </td>
                        );
                      }

                      if (isHourBusy(activeRoom, dayIndex, hour)) {
                        return (
                          <td key={day} className="b">
                            Lecture
                          </td>
                        );
                      }

                      return (
                        <td key={day} className="f">
                          Free
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

