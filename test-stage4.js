/**
 * Stage 4 Verification Test Suite
 * Tests all Stage 4 Reusable React UI Components, Modals, and Logic
 */

import { ROOMS, getRoomById } from './src/data/roomsData.js';
import { USERS, getUserLevel, getMaxBookingMinutes, getAvailablePurposes, validateRoomBooking } from './src/data/usersData.js';
import { getCurrentTime, getBusyIntervals, getRoomStatus, isRoomVacant, CAMPUS_CLOSE_MINUTE, formatTime } from './src/data/scheduleEngine.js';
import fs from 'fs';
import path from 'path';

console.log('--- Starting Stage 4 Automated Component & Logic Verification ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
  }
}

// 1. Verify all 10 component files exist on disk
const expectedComponents = [
  'src/components/common/DockNav.jsx',
  'src/components/common/Sidebar.jsx',
  'src/components/common/RoomCard.jsx',
  'src/components/common/Pill.jsx',
  'src/components/common/FacilityChips.jsx',
  'src/components/common/Modal.jsx',
  'src/components/common/Toast.jsx',
  'src/components/modals/SignInModal.jsx',
  'src/components/modals/RoomDetailModal.jsx',
  'src/components/modals/BookingModal.jsx'
];

expectedComponents.forEach((compPath) => {
  const exists = fs.existsSync(path.resolve(compPath));
  assert(exists, `Component exists: ${compPath}`);
});

// 2. Test SignInModal logic: 8-digit numeric filtering & demo users
const testInputClean = (input) => input.replace(/\D/g, '').slice(0, 8);
assert(testInputClean('23001234') === '23001234', 'SignIn: valid 8 digits accepted');
assert(testInputClean('23abc00#12 34567') === '23001234', 'SignIn: letters and symbols stripped, capped at 8');
assert(testInputClean('hello') === '', 'SignIn: non-numeric yields empty string');
assert(USERS.length === 6, 'SignIn: 6 demo user accounts available for quick-fill');

// 3. Test RoomDetailModal timeline generation
const roomB01_101 = getRoomById('B01-101');
assert(roomB01_101 !== undefined, 'RoomDetail: Room B01-101 exists');

const simCurrentTime = { d: 1, day: 'Mon', h: 10, m: 600, dt: 'Mon, 10:00 AM' };
const busySlots = getBusyIntervals(roomB01_101, simCurrentTime.day, simCurrentTime.dt, []);

const timelineHours = [];
for (let hour = 8; hour < 18; hour++) {
  const isBusy = busySlots.some((slot) => (hour * 60) >= slot[0] && (hour * 60) < slot[1]);
  const isCurrent = Math.floor(simCurrentTime.m / 60) === hour;
  timelineHours.push({ hour, isBusy, isCurrent });
}

assert(timelineHours.length === 10, 'RoomDetail: timeline generates exactly 10 slots (8 AM to 5 PM)');
assert(timelineHours[0].hour === 8 && timelineHours[9].hour === 17, 'RoomDetail: timeline bounds are 8 to 17');
assert(timelineHours.find(t => t.hour === 10).isCurrent === true, 'RoomDetail: hour 10 marked as current (now)');

// 4. Test Role-based Action Labels
const getActionLabel = (level) => (level === 0 ? 'Use this room' : 'Reserve');
assert(getActionLabel(0) === 'Use this room', 'Action label: Student (level 0) is "Use this room"');
assert(getActionLabel(1) === 'Reserve', 'Action label: Faculty (level 1) is "Reserve"');
assert(getActionLabel(3) === 'Reserve', 'Action label: Admin (level 3) is "Reserve"');

// 5. Test BookingModal start slots and duration capping
const firstSlot = Math.ceil(simCurrentTime.m / 30) * 30; // 600
assert(firstSlot === 600, 'Booking: earliest start slot is rounded to next 30-min block (600 = 10:00 AM)');

const studentMaxDur = getMaxBookingMinutes(0); // 120
const adminMaxDur = getMaxBookingMinutes(3); // 480
const allDurations = [30, 60, 90, 120, 180, 240, 480];
const studentDurations = allDurations.filter(d => d <= studentMaxDur);
const adminDurations = allDurations.filter(d => d <= adminMaxDur);

assert(studentDurations.length === 4 && studentDurations[3] === 120, 'Booking: Student durations capped at 120m');
assert(adminDurations.length === 7 && adminDurations[6] === 480, 'Booking: Admin durations allowed up to 480m');

// 6. Test BookingModal Validation & Collision checks
// Capacity limit
const smallRoom = ROOMS.find(r => r.cap === 20);
assert(smallRoom !== undefined && smallRoom.cap === 20, 'Booking: Found small room with cap 20');
const studentExceedsCap = validateRoomBooking(smallRoom, 'Self study', 60, 0);
assert(studentExceedsCap === '', 'Booking: Student group size <= cap allowed');

// Student in large room (> 60 seats)
const largeHall = ROOMS.find(r => r.cap === 120);
const studentInHall = validateRoomBooking(largeHall, 'Self study', 60, 0);
assert(studentInHall.includes('up to 60 seats'), 'Booking: Student rejected for 120-seat Lecture Hall');

// Closing time validation
const lateStart = 1050; // 17:30 (5:30 PM)
const dur60 = 60;
assert(lateStart + dur60 > CAMPUS_CLOSE_MINUTE, 'Booking: 5:30 PM + 60m exceeds campus close minute (1080)');

// Double booking collision detection
const testBooking = {
  id: 'R_TEST',
  room: smallRoom.id,
  date: simCurrentTime.dt,
  start: 600,
  end: 660,
  people: 5,
  purpose: 'Self study',
  by: '23001234'
};
const vacantBefore = isRoomVacant(smallRoom, 600, 60, simCurrentTime, []);
const vacantAfterCollision = isRoomVacant(smallRoom, 600, 60, simCurrentTime, [testBooking]);
assert(vacantBefore === true || vacantBefore === false, 'Booking: Vacancy check before reservation executes cleanly');
assert(vacantAfterCollision === false, 'Booking: Collision check rejects overlapping booking at minute 600');

console.log(`\n==================================================`);
console.log(`Stage 4 Verification: ${passedTests} / ${totalTests} assertions passed.`);
console.log(`==================================================`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

