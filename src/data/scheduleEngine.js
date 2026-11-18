/**
 * VacanSee - Schedule & Time Calculation Engine
 * 
 * Provides time utilities, procedural lecture occupancy simulation,
 * busy interval merging, and conflict/collision detection.
 */

// Days of the academic week (Monday to Friday)
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Campus operating hours (Minutes from midnight)
export const CAMPUS_OPEN_MINUTE = 480;   // 8:00 AM (8 * 60)
export const CAMPUS_CLOSE_MINUTE = 1080; // 6:00 PM (18 * 60)
export const LUNCH_HOUR = 13;            // 1:00 PM (13:00)

/**
 * Add a leading zero for single-digit numbers (e.g. 5 -> "05")
 * @param {number|string} num 
 * @returns {string}
 */
export function padZero(num) {
  const n = Number(num);
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Deterministic string hash function.
 * Produces consistent pseudo-random numbers based on room ID, day, and hour.
 * @param {string} text 
 * @returns {number}
 */
export function simpleHash(text) {
  let hashValue = 7;
  for (let i = 0; i < text.length; i++) {
    hashValue = (hashValue * 31 + text.charCodeAt(i)) % 10000000;
  }
  return hashValue;
}

/**
 * Escape HTML special characters for safe string rendering.
 * @param {string} text 
 * @returns {string}
 */
export function escapeHTML(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Converts minutes from midnight into 12-hour AM/PM format.
 * Example: 540 -> "9:00 AM", 810 -> "1:30 PM"
 * @param {number} minutesFromMidnight 
 * @returns {string}
 */
export function formatTime(minutesFromMidnight) {
  const hours24 = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const ampm = hours24 < 12 ? 'AM' : 'PM';
  return `${hours12}:${padZero(minutes)} ${ampm}`;
}

/**
 * Converts duration in minutes into a human-readable string.
 * Example: 45 -> "45m", 90 -> "1h 30m", 120 -> "2h"
 * @param {number} minutes 
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Returns current campus date and time.
 * If simulated demo time is provided, or if the real clock is outside campus hours
 * (before 8 AM, after 6 PM, or on weekends), it falls back to 11:15 AM Monday.
 * @param {string} [simulatedTime=""] e.g. "14:30"
 * @returns {{ m: number, day: number, dt: string, sim: boolean }}
 */
export function getCurrentTime(simulatedTime = '') {
  const now = new Date();
  let dayIndex = now.getDay() - 1; // 0 = Monday, 4 = Friday
  let currentMinutes = now.getHours() * 60 + now.getMinutes();
  let isSimulated = false;

  if (simulatedTime) {
    const parts = simulatedTime.split(':');
    currentMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    isSimulated = true;
    if (dayIndex < 0 || dayIndex > 4) dayIndex = 0;
  } else if (dayIndex < 0 || dayIndex > 4 || currentMinutes < CAMPUS_OPEN_MINUTE || currentMinutes >= CAMPUS_CLOSE_MINUTE) {
    // Weekend or after hours fallback: simulate Monday at 11:15 AM (675 minutes)
    currentMinutes = 675;
    isSimulated = true;
    if (dayIndex < 0 || dayIndex > 4) dayIndex = 0;
  }

  const year = now.getFullYear();
  const month = padZero(now.getMonth() + 1);
  const date = padZero(now.getDate());
  const dateString = `${year}-${month}-${date}`;

  return {
    m: currentMinutes,
    day: dayIndex,
    dt: dateString,
    sim: isSimulated
  };
}

/**
 * Checks if a room has a scheduled class at a given hour (8 to 17).
 * Hour 13 (1:00 PM) is the campus lunch break and is always free.
 * @param {{ id: string }} room 
 * @param {number} dayIndex (0 = Mon, 4 = Fri)
 * @param {number} hour (8 to 17)
 * @returns {boolean}
 */
export function isHourBusy(room, dayIndex, hour) {
  if (hour === LUNCH_HOUR) {
    return false; // Lunch hour is 100% free
  }
  const checkValue = simpleHash(room.id + dayIndex + hour) % 100;
  return checkValue < 48; // ~48% chance of scheduled lecture
}

/**
 * Calculates all busy time intervals [startMinute, endMinute] for a room on a given date.
 * Combines scheduled university lectures and active user bookings, merging overlapping slots.
 * @param {{ id: string }} room 
 * @param {number} dayIndex (0-4)
 * @param {string} dateString ("YYYY-MM-DD")
 * @param {Array<Object>} [reservations=[]] List of active reservations
 * @returns {Array<[number, number]>} Sorted, non-overlapping [start, end] minutes
 */
export function getBusyIntervals(room, dayIndex, dateString, reservations = []) {
  const busySlots = [];

  // 1. Add scheduled lectures (8:00 AM to 6:00 PM)
  for (let hour = 8; hour < 18; hour++) {
    if (isHourBusy(room, dayIndex, hour)) {
      busySlots.push([hour * 60, (hour + 1) * 60]);
    }
  }

  // 2. Add confirmed user reservations
  for (let i = 0; i < reservations.length; i++) {
    const res = reservations[i];
    if (res.room === room.id && res.date === dateString) {
      busySlots.push([res.start, res.end]);
    }
  }

  // 3. Sort intervals by start time
  busySlots.sort((a, b) => a[0] - b[0]);

  // 4. Merge overlapping or adjacent intervals
  const merged = [];
  for (let i = 0; i < busySlots.length; i++) {
    const slot = busySlots[i];
    if (merged.length === 0) {
      merged.push([...slot]);
    } else {
      const last = merged[merged.length - 1];
      if (slot[0] <= last[1]) {
        last[1] = Math.max(last[1], slot[1]);
      } else {
        merged.push([...slot]);
      }
    }
  }

  return merged;
}

/**
 * Calculates current room occupancy status.
 * @param {{ id: string }} room 
 * @param {{ m: number, day: number, dt: string }} [currentTime]
 * @param {Array<Object>} [reservations=[]]
 * @returns {{ k: 'free'|'soon'|'busy', until: number, left: number, label: string }}
 */
export function getRoomStatus(room, currentTime = getCurrentTime(), reservations = []) {
  const busySlots = getBusyIntervals(room, currentTime.day, currentTime.dt, reservations);

  // Check if room is occupied right now
  const currentBusy = busySlots.find(slot => currentTime.m >= slot[0] && currentTime.m < slot[1]);
  if (currentBusy) {
    const timeLeft = currentBusy[1] - currentTime.m;
    if (timeLeft <= 30) {
      return {
        k: 'soon',
        until: currentBusy[1],
        left: timeLeft,
        label: 'Frees up soon'
      };
    }
    return {
      k: 'busy',
      until: currentBusy[1],
      left: timeLeft,
      label: 'In lecture'
    };
  }

  // Room is free right now
  const nextBusy = busySlots.find(slot => slot[0] > currentTime.m);
  const freeUntil = nextBusy ? nextBusy[0] : CAMPUS_CLOSE_MINUTE;

  return {
    k: 'free',
    until: freeUntil,
    left: freeUntil - currentTime.m,
    label: 'Available'
  };
}

/**
 * Determines whether a room is vacant for an entire requested reservation duration.
 * Checks against campus opening/closing hours, scheduled lectures, and prior reservations.
 * @param {{ id: string }} room 
 * @param {number} startMinute 
 * @param {number} durationMinutes 
 * @param {{ m: number, day: number, dt: string }} [currentTime]
 * @param {Array<Object>} [reservations=[]]
 * @returns {boolean} True if slot is 100% vacant without collision
 */
export function isRoomVacant(room, startMinute, durationMinutes, currentTime = getCurrentTime(), reservations = []) {
  const endMinute = startMinute + durationMinutes;

  // Must be strictly within campus hours: 8:00 AM (480) to 6:00 PM (1080)
  if (startMinute < CAMPUS_OPEN_MINUTE || endMinute > CAMPUS_CLOSE_MINUTE) {
    return false;
  }

  const busySlots = getBusyIntervals(room, currentTime.day, currentTime.dt, reservations);
  for (let i = 0; i < busySlots.length; i++) {
    const slot = busySlots[i];
    // Overlap condition: start < slot.end AND end > slot.start
    if (startMinute < slot[1] && endMinute > slot[0]) {
      return false; // Collision detected
    }
  }

  return true;
}

/**
 * Finds until when a room is vacant starting from a given minute.
 * @param {{ id: string }} room 
 * @param {number} startMinute 
 * @param {{ m: number, day: number, dt: string }} [currentTime]
 * @param {Array<Object>} [reservations=[]]
 * @returns {number} Minute when the next busy slot begins, or 1080 (6 PM)
 */
export function getFreeUntilMinute(room, startMinute, currentTime = getCurrentTime(), reservations = []) {
  const busySlots = getBusyIntervals(room, currentTime.day, currentTime.dt, reservations);
  const nextBusy = busySlots.find(slot => slot[0] >= startMinute);
  return nextBusy ? nextBusy[0] : CAMPUS_CLOSE_MINUTE;
}

/**
 * Checks if a room has an issue report submitted within the past 3 hours.
 * @param {{ id: string }} room 
 * @param {Array<Object>} [reports=[]]
 * @returns {boolean}
 */
export function hasRecentReport(room, reports = []) {
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  const nowMs = Date.now();
  return reports.some(report => report.room === room.id && (nowMs - report.t) < THREE_HOURS_MS);
}

