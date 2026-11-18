/* ==========================================================================
   VacanSee - Smart Vacant Classroom Finder
   College Web Development Project (Semester 3)
   ==========================================================================
   Description:
   A lightweight client-side Single Page Application (SPA) designed to help
   students and faculty find and reserve available classrooms across campus.
   ========================================================================== */

'use strict';

// ==========================================================================
// 1. HELPER FUNCTIONS & DOM SHORTCUTS
// ==========================================================================

// Helper function to select a single HTML element by CSS selector
function getElement(selector, parent = document) {
  return parent.querySelector(selector);
}
const $ = getElement; // Shorthand alias

// Helper function to select all matching HTML elements as an array
function getAllElements(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}
const $$ = getAllElements; // Shorthand alias

// LocalStorage helpers to save and read data
function getFromStorage(key, defaultValue) {
  try {
    const savedData = localStorage.getItem(key);
    if (savedData) {
      return JSON.parse(savedData);
    }
    return defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Shorthand object for storage operations
const LS = {
  get: getFromStorage,
  set: saveToStorage
};

// Add leading zero for 2-digit numbers (e.g. 5 -> "05")
function padZero(num) {
  if (num < 10) {
    return '0' + num;
  }
  return String(num);
}
const pad = padZero;

// Escape special characters to safely display user text inside HTML
function escapeHTML(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
const esc = escapeHTML;

// Simple string hash function to generate consistent pseudo-random data
function simpleHash(text) {
  let hashValue = 7;
  for (let i = 0; i < text.length; i++) {
    hashValue = (hashValue * 31 + text.charCodeAt(i)) % 10000000;
  }
  return hashValue;
}
const hash = simpleHash;


// ==========================================================================
// 2. CAMPUS CLASSROOM DATA GENERATOR
// ==========================================================================

// List of available facilities in campus rooms
const ALL_FACILITIES = ['Projector', 'AC', 'Wi-Fi', 'Whiteboard', 'Power Outlets', 'Smart Board'];
const FAC = ALL_FACILITIES;

// Days of the academic week (Monday to Friday)
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Total campus buildings
const TOTAL_BUILDINGS = 40;
const NB = TOTAL_BUILDINGS;

// Helper to get formatted building name (e.g. "Building 01")
function getBuildingName(buildingNumber) {
  return 'Building ' + padZero(buildingNumber);
}
const bname = getBuildingName;

// Generate 960 sample classrooms (40 buildings x 3 floors x 8 rooms per floor)
const ROOMS = [];
const CAPACITY_OPTIONS = [30, 40, 60, 80, 20, 50, 120, 35];

for (let building = 1; building <= TOTAL_BUILDINGS; building++) {
  for (let floor = 1; floor <= 3; floor++) {
    for (let roomNum = 1; roomNum <= 8; roomNum++) {
      const roomId = `B${padZero(building)}-${floor}0${roomNum}`;
      const roomHash = simpleHash(roomId);

      // Deterministic room capacity
      const capacityIndex = (roomNum + floor + building) % CAPACITY_OPTIONS.length;
      const capacity = CAPACITY_OPTIONS[capacityIndex];

      // Room type based on seating size
      let roomType = 'Classroom';
      if (capacity >= 100) {
        roomType = 'Lecture Hall';
      } else if (capacity <= 25) {
        roomType = 'Seminar Room';
      }

      // Pick facilities: Wi-Fi is standard, others based on hash
      const facilities = ['Wi-Fi'];
      for (let i = 0; i < ALL_FACILITIES.length; i++) {
        const item = ALL_FACILITIES[i];
        if (item !== 'Wi-Fi' && (roomHash + i) % 2 === 0) {
          facilities.push(item);
        }
        if (facilities.length >= 4) break;
      }

      ROOMS.push({
        id: roomId,
        b: building,
        floor: floor,
        cap: capacity,
        fac: facilities,
        type: roomType
      });
    }
  }
}

// Check if a room has a scheduled lecture at a given hour (8 AM to 6 PM)
// Hour 13 (1:00 PM) is lunch break so all rooms are free
function isHourBusy(room, dayIndex, hour) {
  if (hour === 13) {
    return false; // Lunch hour
  }
  const checkValue = simpleHash(room.id + dayIndex + hour) % 100;
  return checkValue < 48; // ~48% chance of scheduled lecture
}
const busyHr = isHourBusy;


// ==========================================================================
// 3. USER ACCOUNTS & ROLE-BASED ACCESS CONTROL (RBAC)
// ==========================================================================

// Sample user accounts for testing login
const USERS = [
  { id: '23001234', name: 'Student User', role: 'student' },
  { id: '24005678', name: 'Faculty User', role: 'professor' },
  { id: '19000101', name: 'Dr. Meera Nair', role: 'hod' },
  { id: '18000202', name: 'Dr. Rahul Verma', role: 'hos' },
  { id: '17000303', name: 'Prof. Anita Desai', role: 'dean' },
  { id: '10000001', name: 'Campus Admin', role: 'admin' }
];

// Display labels for each user role
const ROLE_LABELS = {
  student: 'Student',
  professor: 'Professor',
  hod: 'HOD',
  hos: 'HOS',
  dean: 'Dean',
  admin: 'Admin'
};
const RL = ROLE_LABELS;

// Numeric permission level:
// 0: Student, 1: Professor, 2: HOD/HOS, 3: Dean/Admin
const ROLE_LEVELS = {
  student: 0,
  professor: 1,
  hod: 2,
  hos: 2,
  dean: 3,
  admin: 3
};
const LVL = ROLE_LEVELS;

// Maximum reservation time allowed in minutes for each role level
// Level 0: 120m (2h), Level 1: 180m (3h), Level 2: 240m (4h), Level 3: 480m (8h)
const MAX_BOOKING_MINUTES = [120, 180, 240, 480];
const MAXM = MAX_BOOKING_MINUTES;

// Human-readable description of what each level can do
const ACCESS_DESCRIPTIONS = [
  'Students can use rooms up to 60 seats, for up to 2 hours, for study purposes.',
  'Faculty can use any room for up to 3 hours, including meetings, presentations, interviews and club activities.',
  'You can use any room for up to 4 hours, including workshops.',
  'You can use any room for up to 8 hours, for every purpose.'
];
const ACCESS = ACCESS_DESCRIPTIONS;

// Purpose rules: required minimum level, required facilities, and minimum capacity
const PURPOSE_RULES = {
  'Self study': { minLevel: 0, l: 0 },
  'Group discussion': { minLevel: 0, l: 0 },
  'Project work': { minLevel: 0, l: 0 },
  'Exam preparation': { minLevel: 0, l: 0 },
  'Meeting': { minLevel: 1, l: 1, need: ['Wi-Fi'], requiredFacilities: ['Wi-Fi'] },
  'Presentation': { minLevel: 1, l: 1, need: ['Projector'], requiredFacilities: ['Projector'] },
  'Interview': { minLevel: 1, l: 1 },
  'Club activity': { minLevel: 1, l: 1, min: 30, minCapacity: 30 },
  'Workshop': { minLevel: 2, l: 2, need: ['Projector'], requiredFacilities: ['Projector'], min: 30, minCapacity: 30 }
};
const PUR = PURPOSE_RULES;

// Central application state loaded from localStorage
let state = {
  res: LS.get('cs_res', []), // List of reservations
  rep: LS.get('cs_rep', []), // List of reported issues
  user: LS.get('cs_user', null), // Current logged-in user object
  sim: LS.get('cs_sim', '') // Optional simulated demo time (e.g. "14:30")
};

// Validate saved user
if (state.user && !USERS.some(u => u.id === state.user.id)) {
  state.user = null;
}

// Save application state back to localStorage
function saveState() {
  LS.set('cs_res', state.res);
  LS.set('cs_rep', state.rep);
  LS.set('cs_user', state.user);
  LS.set('cs_sim', state.sim);
}
const save = saveState;

// Get current user's role level
function getUserLevel() {
  if (!state.user) return 0;
  return ROLE_LEVELS[state.user.role] || 0;
}
const lvl = getUserLevel;

// Get maximum allowed booking minutes for current user
function getMaxBookingMinutes() {
  return MAX_BOOKING_MINUTES[getUserLevel()];
}
const maxMin = getMaxBookingMinutes;

// Check if current user is an Admin
function isCurrentUserAdmin() {
  return state.user && state.user.role === 'admin';
}
const isAdmin = isCurrentUserAdmin;

// Get available booking purposes for the current user's role
function getAvailablePurposes() {
  const userLevel = getUserLevel();
  const allowed = [];
  for (const purpose in PURPOSE_RULES) {
    if (PURPOSE_RULES[purpose].minLevel <= userLevel) {
      allowed.push(purpose);
    }
  }
  return allowed;
}
const purposes = getAvailablePurposes;

// Get reservations visible to current user (Admins see all; others see their own)
function getVisibleReservations() {
  if (isCurrentUserAdmin()) {
    return state.res;
  }
  if (!state.user) return [];
  return state.res.filter(item => item.by === state.user.id);
}
const myRes = getVisibleReservations;

// Validates whether a user can book a room for a given purpose and duration
function validateRoomBooking(room, purpose, durationMinutes) {
  const userLevel = getUserLevel();
  const maxAllowed = getMaxBookingMinutes();

  // Rule 1: Students can only use rooms with up to 60 seats
  if (userLevel === 0 && room.cap > 60) {
    return `Students can only use rooms with up to 60 seats. Room ${room.id} has ${room.cap} seats.`;
  }

  // Rule 2: Booking duration limit
  if (durationMinutes > maxAllowed) {
    return `Your role can only reserve a room for up to ${maxAllowed / 60} hours.`;
  }

  // Rule 3: Purpose permission check
  const rule = PURPOSE_RULES[purpose];
  if (!rule || rule.minLevel > userLevel) {
    return 'Your role is not authorized to reserve rooms for this purpose.';
  }

  // Rule 4: Purpose minimum capacity requirement
  if (rule.minCapacity && room.cap < rule.minCapacity) {
    return `${purpose} requires a room with at least ${rule.minCapacity} seats.`;
  }

  // Rule 5: Required facility check
  if (rule.requiredFacilities) {
    const missingFacilities = [];
    for (const facility of rule.requiredFacilities) {
      if (!room.fac.includes(facility)) {
        missingFacilities.push(facility);
      }
    }
    if (missingFacilities.length > 0) {
      return `${purpose} requires: ${missingFacilities.join(', ')}.`;
    }
  }

  return ''; // No error
}
const roomErr = validateRoomBooking;


// ==========================================================================
// 4. TIME & SCHEDULE ENGINE
// ==========================================================================

// Get current campus time and date
function getCurrentTime() {
  const now = new Date();
  let dayIndex = now.getDay() - 1; // 0 = Mon, 4 = Fri
  let currentMinutes = now.getHours() * 60 + now.getMinutes();
  let isSimulated = false;

  // Use demo time if configured in Settings
  if (state.sim) {
    const parts = state.sim.split(':');
    currentMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    isSimulated = true;
    if (dayIndex < 0 || dayIndex > 4) dayIndex = 0;
  } else if (dayIndex < 0 || dayIndex > 4 || currentMinutes < 480 || currentMinutes >= 1080) {
    // If weekend or after hours (before 8 AM or after 6 PM), simulate 11:15 AM Monday
    currentMinutes = 675; // 11:15 AM
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
const now = getCurrentTime;

// Format minutes from midnight to 12-hour AM/PM string (e.g. 540 -> "9:00 AM")
function formatTime(minutesFromMidnight) {
  const hours24 = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const ampm = hours24 < 12 ? 'AM' : 'PM';
  return `${hours12}:${padZero(minutes)} ${ampm}`;
}
const fmt = formatTime;

// Format duration in minutes into a readable string (e.g. 90 -> "1h 30m")
function formatDuration(minutes) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    if (rem > 0) {
      return `${hours}h ${rem}m`;
    }
    return `${hours}h`;
  }
  return `${minutes}m`;
}
const dur = formatDuration;

// Get all busy time intervals [startMinute, endMinute] for a room on a given day & date
function getBusyIntervals(room, dayIndex, dateString) {
  const busySlots = [];

  // Add scheduled classes (8 AM to 6 PM)
  for (let hour = 8; hour < 18; hour++) {
    if (isHourBusy(room, dayIndex, hour)) {
      busySlots.push([hour * 60, (hour + 1) * 60]);
    }
  }

  // Add existing user reservations
  for (let i = 0; i < state.res.length; i++) {
    const res = state.res[i];
    if (res.room === room.id && res.date === dateString) {
      busySlots.push([res.start, res.end]);
    }
  }

  // Sort by start minute
  busySlots.sort((a, b) => a[0] - b[0]);

  // Merge overlapping intervals
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
const blocks = getBusyIntervals;

// Get live status of a classroom: 'free', 'soon' (frees within 30m), or 'busy'
function getRoomStatus(room) {
  const currentTime = getCurrentTime();
  const busySlots = getBusyIntervals(room, currentTime.day, currentTime.dt);

  // Check if currently occupied
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
    } else {
      return {
        k: 'busy',
        until: currentBusy[1],
        left: timeLeft,
        label: 'In lecture'
      };
    }
  }

  // Room is free now
  const nextBusy = busySlots.find(slot => slot[0] > currentTime.m);
  const freeUntil = nextBusy ? nextBusy[0] : 1080; // 1080 = 6:00 PM (campus closes)

  return {
    k: 'free',
    until: freeUntil,
    left: freeUntil - currentTime.m,
    label: 'Available'
  };
}
const status = getRoomStatus;

// Check if a room is vacant for the entire requested window
function isRoomVacant(room, startMinute, durationMinutes) {
  const currentTime = getCurrentTime();
  const endMinute = startMinute + durationMinutes;

  // Must be within 8:00 AM (480) and 6:00 PM (1080)
  if (startMinute < 480 || endMinute > 1080) {
    return false;
  }

  const busySlots = getBusyIntervals(room, currentTime.day, currentTime.dt);
  for (let i = 0; i < busySlots.length; i++) {
    const slot = busySlots[i];
    if (startMinute < slot[1] && endMinute > slot[0]) {
      return false; // Collision
    }
  }

  return true;
}
const vacant = isRoomVacant;

// Find until when a room is vacant starting from a given minute
function getFreeUntilMinute(room, startMinute) {
  const currentTime = getCurrentTime();
  const busySlots = getBusyIntervals(room, currentTime.day, currentTime.dt);
  const nextBusy = busySlots.find(slot => slot[0] >= startMinute);
  return nextBusy ? nextBusy[0] : 1080;
}
const until = getFreeUntilMinute;

// Check if a room was reported within the last 3 hours
function hasRecentReport(room) {
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  const nowMs = Date.now();
  return state.rep.some(report => report.room === room.id && (nowMs - report.t) < THREE_HOURS_MS);
}
const reported = hasRecentReport;


// ==========================================================================
// 5. TOAST NOTIFICATIONS & MODAL DIALOGS
// ==========================================================================

// Display a short popup notification toast
function showToast(message) {
  const toastElement = document.getElementById('toast');
  if (!toastElement) return;
  toastElement.textContent = message;
  toastElement.classList.add('on');

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toastElement.classList.remove('on');
  }, 2600);
}
const toast = showToast;

// Open a pop-up modal box with custom HTML
function openModal(htmlContent) {
  const modalBox = document.getElementById('md');
  const overlay = document.getElementById('ov');
  if (!modalBox || !overlay) return;

  modalBox.innerHTML = `<button class="x" aria-label="Close">×</button>` + htmlContent;
  overlay.classList.add('on');

  const closeButton = modalBox.querySelector('.x');
  if (closeButton) {
    closeButton.onclick = closeModal;
  }
}
const modal = openModal;

// Close the active modal dialog
function closeModal() {
  const overlay = document.getElementById('ov');
  if (overlay) {
    overlay.classList.remove('on');
  }
}
const closeM = closeModal;

// Close modal when clicking outside on the background overlay
const modalOverlay = document.getElementById('ov');
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target.id === 'ov') closeModal();
  });
}

// Close modal when pressing the Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});


// ==========================================================================
// 6. THEME TOGGLE (LIGHT & DARK MODE)
// ==========================================================================

// Switch theme between light and dark
function setTheme(themeName) {
  document.documentElement.dataset.theme = themeName;
  saveToStorage('cs_theme', themeName);
}

// Read saved theme from localStorage or system preference
const savedTheme = getFromStorage('cs_theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
setTheme(savedTheme);

// Attach theme toggle button listeners
const themeButtons = getAllElements('.themeBtn');
themeButtons.forEach(btn => {
  btn.onclick = () => {
    const current = document.documentElement.dataset.theme;
    const nextTheme = (current === 'dark') ? 'light' : 'dark';
    setTheme(nextTheme);
  };
});


// ==========================================================================
// 7. SHARED UI COMPONENTS (DROPDOWNS, CHIPS, CARDS)
// ==========================================================================

// Global filter state for Find Rooms page
let currentFilters = {
  b: LS.get('cs_b', ''), // Selected building number
  start: 'now',          // Start time
  cap: '0',              // Minimum capacity
  dur: '60',             // Duration in minutes
  pur: '',               // Purpose
  fac: []                // Required facilities array
};
const F = currentFilters;

// Set selected building and persist to localStorage
function setBuildingFilter(buildingNumber) {
  currentFilters.b = buildingNumber;
  LS.set('cs_b', buildingNumber);
}
const setB = setBuildingFilter;

// Render building select dropdown HTML
function renderBuildingSelect(selectId) {
  let options = '<option value="">Select Building</option>';
  for (let i = 1; i <= TOTAL_BUILDINGS; i++) {
    const isSelected = (currentFilters.b == i) ? 'selected' : '';
    options += `<option value="${i}" ${isSelected}>${getBuildingName(i)}</option>`;
  }
  return `<select id="${selectId}" aria-label="Building">${options}</select>`;
}
const bsel = renderBuildingSelect;

// Render facility chip badges HTML
function renderFacilityChips(room) {
  const chipsHtml = room.fac.map(item => `<span class="chip">${item}</span>`).join('');
  return `<div class="row">${chipsHtml}</div>`;
}
const chips = renderFacilityChips;

// Render a single classroom card for search results
function renderRoomCard(room, startMinute) {
  const currentTime = getCurrentTime();
  const freeUntil = getFreeUntilMinute(room, startMinute);
  const statusBadge = (startMinute === currentTime.m) ? 'Available' : 'Free at ' + formatTime(startMinute);
  const reportWarning = hasRecentReport(room) ? '<div class="info">⚑ Availability reported — verify on arrival</div>' : '';

  return `
    <article class="card room">
      <div class="hd">
        <h3>Room ${room.id}</h3>
        <span class="pill free">${statusBadge}</span>
      </div>
      <div class="info">${getBuildingName(room.b)} · Floor ${room.floor} · ${room.type}</div>
      <div class="info">Capacity: <b>${room.cap}</b> seats</div>
      <div class="info">Available until: <b>${formatTime(freeUntil)}</b> (${formatDuration(freeUntil - startMinute)})</div>
      ${renderFacilityChips(room)}
      ${reportWarning}
      <button class="btn p sm" data-detail="${room.id}">View Details</button>
    </article>
  `;
}
const card = renderRoomCard;

// Render classroom cell button for floor matrix preview
function renderGridCell(room, showDetails) {
  const roomStatus = getRoomStatus(room);
  let content = '';
  if (showDetails) {
    const subLabel = (roomStatus.k === 'free') ? formatDuration(roomStatus.left) : room.cap + ' seats';
    content = `${room.id.slice(-3)}<small>${subLabel}</small>`;
  }
  return `<button class="cell ${roomStatus.k}" data-detail="${room.id}" title="${room.id}: ${roomStatus.label}">${content}</button>`;
}
const cell = renderGridCell;

// Action button label based on user role (Students see "Use this room", Faculty see "Reserve")
function getActionLabel() {
  return (getUserLevel() === 0) ? 'Use this room' : 'Reserve';
}
const useLabel = getActionLabel;


// ==========================================================================
// 8. ROOM DETAILS & RESERVATION MODALS
// ==========================================================================

// Open Room Details modal
function showRoomDetails(roomId) {
  const room = ROOMS.find(r => r.id === roomId);
  if (!room) return;

  const roomStatus = getRoomStatus(room);
  const currentTime = getCurrentTime();
  const busySlots = getBusyIntervals(room, currentTime.day, currentTime.dt);

  // Build the 8 AM to 6 PM timeline bar
  let timelineBars = '';
  for (let hour = 8; hour < 18; hour++) {
    const isBusy = busySlots.some(slot => (hour * 60) >= slot[0] && (hour * 60) < slot[1]);
    const isCurrent = Math.floor(currentTime.m / 60) === hour;
    const busyClass = isBusy ? 'b' : '';
    const nowClass = isCurrent ? 'now' : '';
    timelineBars += `<i class="${busyClass} ${nowClass}"></i>`;
  }

  const statusText = (roomStatus.k === 'free')
    ? `Vacant for the next <b>${formatDuration(roomStatus.left)}</b> (until ${formatTime(roomStatus.until)}).`
    : `Busy until <b>${formatTime(roomStatus.until)}</b>.`;

  const modalHtml = `
    <h2>Room ${room.id}</h2>
    <p class="mute" style="margin-bottom:12px">${getBuildingName(room.b)} · ${room.type} · Floor ${room.floor} · ${room.cap} seats</p>
    <span class="pill ${roomStatus.k}">${roomStatus.label}</span>
    <p style="margin:12px 0">${statusText}</p>
    <div class="mute" style="font-size:.85rem">Today, 8 AM – 6 PM (dark = occupied)</div>
    <div class="tl">${timelineBars}</div>
    <div class="tlh"><span>8</span><span>10</span><span>12</span><span>2</span><span>4</span><span>6</span></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin:14px 0">${renderFacilityChips(room)}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn p" id="dRes">${getActionLabel()}</button>
      <button class="btn" id="dRep">Report incorrect status</button>
    </div>
  `;

  openModal(modalHtml);

  // Setup button handlers inside modal
  const reserveButton = document.getElementById('dRes');
  if (reserveButton) {
    reserveButton.onclick = () => openBookingModal(roomId);
  }

  const reportButton = document.getElementById('dRep');
  if (reportButton) {
    reportButton.onclick = () => {
      closeModal();
      setBuildingFilter(String(room.b));
      location.hash = '#/report';
      setTimeout(() => {
        const roomSelect = document.getElementById('rRoom');
        if (roomSelect) roomSelect.value = roomId;
      }, 60);
    };
  }
}
const detail = showRoomDetails;

// Open Booking Form modal
function openBookingModal(roomId) {
  const room = ROOMS.find(r => r.id === roomId);
  if (!room) return;

  const currentTime = getCurrentTime();
  const maxAllowed = getMaxBookingMinutes();

  // Create start time options (rounded up to next 30-minute block)
  let startOptions = '';
  const firstSlot = Math.ceil(currentTime.m / 30) * 30;
  for (let minute = firstSlot; minute < 1050; minute += 30) {
    const isSelected = (currentFilters.start == minute) ? 'selected' : '';
    startOptions += `<option value="${minute}" ${isSelected}>${formatTime(minute)}</option>`;
  }

  // Create duration options within user limit
  const durationList = [30, 60, 90, 120, 180, 240, 480];
  let durationOptions = '';
  for (let i = 0; i < durationList.length; i++) {
    const durMins = durationList[i];
    if (durMins <= maxAllowed) {
      const isSelected = (currentFilters.dur == durMins) ? 'selected' : '';
      durationOptions += `<option value="${durMins}" ${isSelected}>${formatDuration(durMins)}</option>`;
    }
  }

  // Create purpose options
  const allowedPurposes = getAvailablePurposes();
  let purposeOptions = '';
  for (let i = 0; i < allowedPurposes.length; i++) {
    const purpose = allowedPurposes[i];
    const isSelected = (currentFilters.pur === purpose) ? 'selected' : '';
    purposeOptions += `<option ${isSelected}>${purpose}</option>`;
  }

  const modalHtml = `
    <h2>${getActionLabel()} · Room ${room.id}</h2>
    <p class="mute" style="margin-bottom:14px">Today · ${getBuildingName(room.b)} · Capacity ${room.cap} seats</p>
    <form class="f" id="rf" novalidate>
      <div class="two">
        <label>Start<select id="rS">${startOptions}</select></label>
        <label>Duration<select id="rD">${durationOptions}</select></label>
      </div>
      <label>Group size<input type="number" id="rP" min="1" value="1"></label>
      <label>Purpose<select id="rU">${purposeOptions}</select></label>
      <div class="err" id="rE"></div>
      <button class="btn p" type="submit">Confirm</button>
    </form>
  `;

  openModal(modalHtml);

  // Form submission validation
  const bookingForm = document.getElementById('rf');
  if (bookingForm) {
    bookingForm.onsubmit = (e) => {
      e.preventDefault();
      const startMinute = parseInt(document.getElementById('rS').value, 10);
      const durationMinutes = parseInt(document.getElementById('rD').value, 10);
      const groupSize = parseInt(document.getElementById('rP').value, 10);
      const purpose = document.getElementById('rU').value;
      const errorDisplay = document.getElementById('rE');

      if (!startMinute) {
        errorDisplay.textContent = 'No time slots left today. Try again tomorrow.';
        return;
      }
      if (!groupSize || groupSize < 1) {
        errorDisplay.textContent = 'Enter a group size of at least 1.';
        return;
      }
      if (groupSize > room.cap) {
        errorDisplay.textContent = `This room only seats ${room.cap}. Reduce the group size or pick a bigger room.`;
        return;
      }

      // Check role permissions and facilities
      const validationError = validateRoomBooking(room, purpose, durationMinutes);
      if (validationError) {
        errorDisplay.textContent = validationError;
        return;
      }

      if (startMinute + durationMinutes > 1080) {
        errorDisplay.textContent = 'Campus closes at 6:00 PM. Choose an earlier start or shorter duration.';
        return;
      }

      // Check for overlap with scheduled lectures or reservations
      if (!isRoomVacant(room, startMinute, durationMinutes)) {
        errorDisplay.textContent = 'That slot overlaps a lecture or another booking. Pick a free time from the timeline.';
        return;
      }

      // Save reservation
      const newBooking = {
        id: 'R' + Date.now(),
        room: roomId,
        date: currentTime.dt,
        start: startMinute,
        end: startMinute + durationMinutes,
        people: groupSize,
        purpose: purpose,
        by: state.user.id,
        name: state.user.name,
        role: state.user.role
      };

      state.res.push(newBooking);
      saveState();
      closeModal();
      showToast(`Room ${roomId} confirmed, ${formatTime(startMinute)}–${formatTime(startMinute + durationMinutes)}`);
      renderApp();
    };
  }
}
const reserve = openBookingModal;

// Global click delegation for [data-detail] buttons
document.addEventListener('click', (e) => {
  const detailButton = e.target.closest('[data-detail]');
  if (detailButton) {
    showRoomDetails(detailButton.dataset.detail);
  }
});


// ==========================================================================
// 9. APPLICATION VIEWS (HTML GENERATORS)
// ==========================================================================

const VIEWS = {};
const V = VIEWS; // Alias
const VIEW_AFTER_RENDER = {};
const AFTER = VIEW_AFTER_RENDER; // Alias

// Helper to render view header with clock
function renderViewHeader(title, subtitle) {
  const currentTime = getCurrentTime();
  const clockType = currentTime.sim ? 'Demo time' : 'Live';
  return `
    <div class="top">
      <div>
        <h1>${title}</h1>
        <p class="mute">${subtitle || ''}</p>
      </div>
      <div class="clock">${clockType} · ${DAYS[currentTime.day]} ${formatTime(currentTime.m)}</div>
    </div>
  `;
}
const head = renderViewHeader;

// Gate message shown when no building is selected
function renderBuildingGate(title) {
  return `
    ${renderViewHeader(title)}
    <div class="card empty">
      Select a building to continue.
      <div style="margin-top:12px;display:flex;justify-content:center">
        ${renderBuildingSelect('gb')}
      </div>
    </div>
  `;
}
const gate = renderBuildingGate;

function bindBuildingGate() {
  const gateSelect = document.getElementById('gb');
  if (gateSelect) {
    gateSelect.onchange = (e) => {
      setBuildingFilter(e.target.value);
      renderApp();
    };
  }
}
const gateBind = bindBuildingGate;

// VIEW 1: Find Rooms Dashboard
VIEWS.dashboard = () => {
  const currentTime = getCurrentTime();
  const user = state.user;

  // Reset outdated filters
  if (currentFilters.start !== 'now' && parseInt(currentFilters.start, 10) <= currentTime.m) {
    currentFilters.start = 'now';
  }
  if (parseInt(currentFilters.dur, 10) > getMaxBookingMinutes()) {
    currentFilters.dur = '60';
  }
  if (currentFilters.pur && !getAvailablePurposes().includes(currentFilters.pur)) {
    currentFilters.pur = '';
  }

  // Generate start time dropdown options
  let startOptions = '<option value="now">Now</option>';
  const nextHourSlot = (Math.floor(currentTime.m / 30) + 1) * 30;
  for (let minute = nextHourSlot; minute < 1050; minute += 30) {
    startOptions += `<option value="${minute}">${formatTime(minute)}</option>`;
  }

  // Capacity options
  const capacityOptionsList = [
    [0, 'Any'], [10, '10+'], [20, '20+'], [30, '30+'],
    [50, '50+'], [80, '80+'], [100, '100+']
  ];
  const capacityOptions = capacityOptionsList.map(item => `<option value="${item[0]}">${item[1]}</option>`).join('');

  // Duration options
  const durationOptions = [30, 60, 90, 120, 180, 240, 480]
    .filter(mins => mins <= getMaxBookingMinutes())
    .map(mins => `<option value="${mins}">${formatDuration(mins)}</option>`)
    .join('');

  // Purpose options
  const purposeOptions = getAvailablePurposes().map(p => `<option>${p}</option>`).join('');

  // Facility checkboxes
  const facilityCheckboxes = ALL_FACILITIES.map(fac => {
    const isChecked = currentFilters.fac.includes(fac) ? 'checked' : '';
    return `<label class="ck"><input type="checkbox" data-fac="${fac}" ${isChecked}>${fac}</label>`;
  }).join('');

  return `
    ${renderViewHeader('Find a Vacant Classroom', `${escapeHTML(user.name)} <span class="role">${ROLE_LABELS[user.role]}</span>`)}
    <div class="card fcard">
      <div class="fg">
        <label>Building${renderBuildingSelect('fb')}</label>
        <label>Start<select id="fst">${startOptions}</select></label>
        <label>Capacity<select id="fcap">${capacityOptions}</select></label>
        <label>Duration<select id="fd">${durationOptions}</select></label>
        <label>Purpose<select id="fp"><option value="">Select Purpose</option>${purposeOptions}</select></label>
      </div>
      <div class="fac">Facilities: ${facilityCheckboxes}</div>
      <p class="mute note">${ACCESS_DESCRIPTIONS[getUserLevel()]}</p>
    </div>
    <div id="fsum"></div>
    <div class="grid" id="fres"></div>
  `;
};

// Execute search query and display matching rooms
function runFindRooms() {
  const currentTime = getCurrentTime();
  const resultsContainer = document.getElementById('fres');
  const summaryContainer = document.getElementById('fsum');
  if (!resultsContainer || !summaryContainer) return;

  if (!currentFilters.b) {
    summaryContainer.innerHTML = '';
    resultsContainer.innerHTML = '<div class="card empty" style="grid-column:1/-1">Select a building to see its vacant classrooms.</div>';
    return;
  }

  const startMinute = (currentFilters.start === 'now') ? currentTime.m : parseInt(currentFilters.start, 10);
  const durationMinutes = parseInt(currentFilters.dur, 10);
  const minCapacity = parseInt(currentFilters.cap, 10);

  // Get all rooms in selected building
  const buildingRooms = ROOMS.filter(r => r.b == currentFilters.b);
  const roomStatuses = buildingRooms.map(getRoomStatus);

  // Count active upcoming bookings for current user
  const activeBookingsCount = getVisibleReservations().filter(res => {
    return (res.date > currentTime.dt) || (res.date === currentTime.dt && res.end > currentTime.m);
  }).length;

  // Filter vacant rooms matching user constraints
  const matchingRooms = buildingRooms.filter(room => {
    const isVacant = isRoomVacant(room, startMinute, durationMinutes);
    const hasCapacity = room.cap >= minCapacity;
    const isAllowedForRole = (getUserLevel() > 0) || (room.cap <= 60);
    const hasAllFacilities = currentFilters.fac.every(f => room.fac.includes(f));
    const noPurposeError = (!currentFilters.pur || !validateRoomBooking(room, currentFilters.pur, durationMinutes));

    return isVacant && hasCapacity && isAllowedForRole && hasAllFacilities && noPurposeError;
  });

  // Sort: prioritize rooms matching capacity closest, then longest availability
  matchingRooms.sort((a, b) => {
    if (minCapacity > 0) {
      const diffA = Math.abs(a.cap - minCapacity);
      const diffB = Math.abs(b.cap - minCapacity);
      if (diffA !== diffB) return diffA - diffB;
    }
    return getFreeUntilMinute(b, startMinute) - getFreeUntilMinute(a, startMinute);
  });

  // Render top summary metrics
  const vacantNowCount = roomStatuses.filter(s => s.k === 'free').length;
  const freesSoonCount = roomStatuses.filter(s => s.k === 'soon').length;

  summaryContainer.innerHTML = `
    <div class="sum">
      <div class="card" style="--c:var(--free)"><b>${vacantNowCount}</b><span>Vacant now in ${getBuildingName(currentFilters.b)}</span></div>
      <div class="card" style="--c:var(--soon)"><b>${freesSoonCount}</b><span>Available soon</span></div>
      <div class="card"><b>${matchingRooms.length}</b><span>Match your filters</span></div>
      <div class="card"><b>${activeBookingsCount}</b><span>My reservations</span></div>
    </div>
  `;

  // Render room result cards
  if (matchingRooms.length > 0) {
    resultsContainer.innerHTML = matchingRooms.map((room, index) => {
      const bestFitTag = (index === 0 && minCapacity > 0)
        ? `<div style="grid-column:1/-1"><span class="pill free">Best fit for ${minCapacity}+ people comes first</span></div>`
        : '';
      return bestFitTag + renderRoomCard(room, startMinute);
    }).join('');
  } else {
    resultsContainer.innerHTML = `
      <div class="card empty" style="grid-column:1/-1">
        No vacant rooms in ${getBuildingName(currentFilters.b)} for that window.<br>
        Try a shorter duration, a later start time, or fewer required facilities.
      </div>
    `;
  }
}
const runFind = runFindRooms;

// Post-render binding for Dashboard
VIEW_AFTER_RENDER.dashboard = () => {
  // Sync form inputs with current filter state
  const syncInputs = () => {
    const fb = document.getElementById('fb');
    const fst = document.getElementById('fst');
    const fcap = document.getElementById('fcap');
    const fd = document.getElementById('fd');
    const fp = document.getElementById('fp');

    if (fb) fb.value = currentFilters.b;
    if (fst) fst.value = currentFilters.start;
    if (fcap) fcap.value = currentFilters.cap;
    if (fd) fd.value = currentFilters.dur;
    if (fp) fp.value = currentFilters.pur;
  };
  syncInputs();

  // Listen for filter input changes
  const filterInputs = getAllElements('.fcard select, .fcard input');
  filterInputs.forEach(input => {
    input.addEventListener('input', () => {
      const fb = document.getElementById('fb');
      const fst = document.getElementById('fst');
      const fcap = document.getElementById('fcap');
      const fd = document.getElementById('fd');
      const fp = document.getElementById('fp');

      if (fb) setBuildingFilter(fb.value);
      if (fst) currentFilters.start = fst.value;
      if (fcap) currentFilters.cap = fcap.value;
      if (fd) currentFilters.dur = fd.value;
      if (fp) currentFilters.pur = fp.value;

      // Collect checked facilities
      const checkedBoxes = getAllElements('[data-fac]:checked');
      currentFilters.fac = checkedBoxes.map(c => c.dataset.fac);

      runFindRooms();
    });
  });

  runFindRooms();
};

// VIEW 2: Timetable Explorer
let selectedTimetableRoomId = '';
const TR = selectedTimetableRoomId;

VIEWS.timetable = () => {
  if (!currentFilters.b) {
    return renderBuildingGate('Timetable');
  }

  const buildingRooms = ROOMS.filter(r => r.b == currentFilters.b);
  if (!buildingRooms.some(r => r.id === selectedTimetableRoomId)) {
    selectedTimetableRoomId = buildingRooms[0].id;
  }

  const room = buildingRooms.find(r => r.id === selectedTimetableRoomId);
  const currentTime = getCurrentTime();

  // Build weekly schedule rows (8:00 AM to 5:00 PM)
  let tableRows = '';
  for (let hour = 8; hour < 18; hour++) {
    const hourStartMinute = hour * 60;
    const hourEndMinute = hourStartMinute + 60;

    let dayCells = '';
    for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex++) {
      // Check if user has a booking
      const hasBooking = state.res.some(res => {
        return res.room === room.id &&
               res.date === currentTime.dt &&
               dayIndex === currentTime.day &&
               hourStartMinute >= res.start &&
               hourStartMinute < res.end;
      });

      if (hasBooking) {
        dayCells += '<td class="r">Booked</td>';
      } else if (isHourBusy(room, dayIndex, hour)) {
        dayCells += '<td class="b">Lecture</td>';
      } else {
        dayCells += '<td class="f">Free</td>';
      }
    }

    tableRows += `<tr><th>${formatTime(hourStartMinute)}</th>${dayCells}</tr>`;
  }

  const roomOptions = buildingRooms.map(r => {
    const isSelected = (r.id === selectedTimetableRoomId) ? 'selected' : '';
    return `<option ${isSelected}>${r.id}</option>`;
  }).join('');

  return `
    ${renderViewHeader('Timetable', `${getBuildingName(currentFilters.b)} · Weekly Schedule`)}
    <div class="fbar">
      ${renderBuildingSelect('tb')}
      <select id="tr">${roomOptions}</select>
    </div>
    <div class="card tt">
      <table>
        <tr>
          <th></th>
          ${DAYS.map(day => `<th>${day}</th>`).join('')}
        </tr>
        ${tableRows}
      </table>
    </div>
  `;
};

VIEW_AFTER_RENDER.timetable = () => {
  bindBuildingGate();

  const buildingSelect = document.getElementById('tb');
  if (buildingSelect) {
    buildingSelect.onchange = (e) => {
      setBuildingFilter(e.target.value);
      renderApp();
    };
  }

  const roomSelect = document.getElementById('tr');
  if (roomSelect) {
    roomSelect.onchange = (e) => {
      selectedTimetableRoomId = e.target.value;
      renderApp();
    };
  }
};

// VIEW 3: Reservations
VIEWS.reservations = () => {
  const currentTime = getCurrentTime();
  const reservationsList = [...getVisibleReservations()];

  // Sort by date and start time
  reservationsList.sort((a, b) => {
    return (a.date + padZero(Math.floor(a.start / 60))).localeCompare(b.date + padZero(Math.floor(b.start / 60)));
  });

  const pageTitle = isCurrentUserAdmin() ? 'All Reservations' : 'My Reservations';
  const pageSubtitle = isCurrentUserAdmin() ? 'Admin view of every booking.' : 'Rooms you have booked.';

  let contentHtml = '';
  if (reservationsList.length > 0) {
    const cardsHtml = reservationsList.map(booking => {
      const isPast = (booking.date < currentTime.dt) || (booking.date === currentTime.dt && booking.end <= currentTime.m);
      const room = ROOMS.find(r => r.id === booking.room);
      const buildingName = room ? getBuildingName(room.b) : '';
      const dateLabel = (booking.date === currentTime.dt) ? 'Today' : booking.date;
      const peopleLabel = (booking.people > 1) ? `${booking.people} people` : '1 person';
      const adminDetails = isCurrentUserAdmin() ? ` · ${escapeHTML(booking.name)} (${ROLE_LABELS[booking.role]})` : '';

      return `
        <div class="card li">
          <div>
            <h3>Room ${booking.room} <span class="mute" style="font-weight:400">· ${buildingName}</span></h3>
            <span class="mute">${dateLabel} · ${formatTime(booking.start)}–${formatTime(booking.end)} · ${peopleLabel} · ${booking.purpose}${adminDetails}</span>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="pill ${isPast ? 'closed' : 'free'}">${isPast ? 'Completed' : 'Upcoming'}</span>
            ${isPast ? '' : `<button class="btn sm d" data-cancel="${booking.id}">Cancel</button>`}
          </div>
        </div>
      `;
    }).join('');

    contentHtml = `<div class="list">${cardsHtml}</div>`;
  } else {
    contentHtml = `
      <div class="card empty">
        No reservations yet.<br><br>
        <a class="btn p" href="#/dashboard">Find a vacant classroom</a>
      </div>
    `;
  }

  return `
    ${renderViewHeader(pageTitle, pageSubtitle)}
    ${contentHtml}
  `;
};

VIEW_AFTER_RENDER.reservations = () => {
  const cancelButtons = getAllElements('[data-cancel]');
  cancelButtons.forEach(button => {
    button.onclick = () => {
      const reservationId = button.dataset.cancel;
      state.res = state.res.filter(item => item.id !== reservationId);
      saveState();
      showToast('Reservation cancelled');
      renderApp();
    };
  });
};

// VIEW 4: Report Issue
VIEWS.report = () => {
  const user = state.user;
  const reportsList = isCurrentUserAdmin() ? state.rep : state.rep.filter(r => r.by === user.id);

  let recentReportsHtml = '';
  if (reportsList.length > 0) {
    const itemsHtml = reportsList.slice().reverse().map(item => {
      const adminNote = isCurrentUserAdmin() ? ' · ' + escapeHTML(item.name) : '';
      return `
        <div class="card li">
          <div>
            <h3>Room ${item.room} — ${item.type}</h3>
            <span class="mute">${escapeHTML(item.txt)}${adminNote}</span>
          </div>
          <span class="pill soon">Under review</span>
        </div>
      `;
    }).join('');

    const sectionTitle = isCurrentUserAdmin() ? 'All reports' : 'Your reports';
    recentReportsHtml = `<h2 class="h" style="margin-top:26px">${sectionTitle}</h2><div class="list">${itemsHtml}</div>`;
  }

  return `
    ${renderViewHeader('Report Issue', "Tell us when a room's status is wrong.")}
    <div class="card" style="max-width:520px">
      <form class="f" id="pf" novalidate>
        <label>Building${renderBuildingSelect('rB')}</label>
        <label>Room<select id="rRoom"></select></label>
        <label>What is wrong?
          <select id="rType">
            <option>Shown vacant but in use</option>
            <option>Shown occupied but empty</option>
            <option>Wrong capacity</option>
            <option>Facility not working</option>
          </select>
        </label>
        <label>Details
          <textarea id="rTxt" rows="3" placeholder="What did you see?"></textarea>
        </label>
        <div class="err" id="pE"></div>
        <button class="btn p" type="submit">Submit report</button>
      </form>
    </div>
    ${recentReportsHtml}
  `;
};

VIEW_AFTER_RENDER.report = () => {
  const buildingSelect = document.getElementById('rB');
  const roomSelect = document.getElementById('rRoom');

  // Populate room options dynamically when building is picked
  const populateRooms = () => {
    const selectedBuilding = buildingSelect.value;
    if (selectedBuilding) {
      const roomsInBuilding = ROOMS.filter(r => r.b == selectedBuilding);
      roomSelect.innerHTML = roomsInBuilding.map(r => `<option>${r.id}</option>`).join('');
    } else {
      roomSelect.innerHTML = '<option value="">Select a building first</option>';
    }
  };

  if (buildingSelect) {
    buildingSelect.onchange = populateRooms;
    populateRooms();
  }

  // Handle report form submission
  const reportForm = document.getElementById('pf');
  if (reportForm) {
    reportForm.onsubmit = (e) => {
      e.preventDefault();
      const detailsText = document.getElementById('rTxt').value.trim();
      const errorDisplay = document.getElementById('pE');

      if (!roomSelect.value) {
        errorDisplay.textContent = 'Select a building and a room.';
        return;
      }
      if (detailsText.length < 10) {
        errorDisplay.textContent = 'Add at least 10 characters so we can check it.';
        return;
      }

      const newReport = {
        room: roomSelect.value,
        type: document.getElementById('rType').value,
        txt: detailsText,
        t: Date.now(),
        by: state.user.id,
        name: state.user.name
      };

      state.rep.push(newReport);
      saveState();
      showToast('Report submitted. Thank you!');
      renderApp();
    };
  }
};

// VIEW 5: Settings
VIEWS.settings = () => {
  const user = state.user;
  return `
    ${renderViewHeader('Settings', 'Your account and demo options.')}
    <div class="card" style="max-width:520px">
      <form class="f" id="sf">
        <label>Name<input value="${escapeHTML(user.name)}" disabled></label>
        <label>Registration ID<input value="${user.id}" disabled></label>
        <label>Role<input value="${ROLE_LABELS[user.role]}" disabled></label>
        <label>Demo time <span class="mute">(leave empty to use real clock)</span>
          <input type="time" id="sTime" value="${state.sim}">
        </label>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn p" type="submit">Save settings</button>
          <button class="btn" type="button" id="sOut">Sign out</button>
          <button class="btn d" type="button" id="sReset">Clear reservations and reports</button>
        </div>
      </form>
    </div>
  `;
};

VIEW_AFTER_RENDER.settings = () => {
  const settingsForm = document.getElementById('sf');
  if (settingsForm) {
    settingsForm.onsubmit = (e) => {
      e.preventDefault();
      state.sim = document.getElementById('sTime').value;
      saveState();
      showToast('Settings saved');
      renderApp();
    };
  }

  const signOutButton = document.getElementById('sOut');
  if (signOutButton) {
    signOutButton.onclick = logout;
  }

  const resetButton = document.getElementById('sReset');
  if (resetButton) {
    resetButton.onclick = () => {
      state.res = [];
      state.rep = [];
      saveState();
      showToast('Data cleared');
      renderApp();
    };
  }
};


// ==========================================================================
// 10. LANDING PAGE & METRICS ANIMATION
// ==========================================================================

function renderLanding() {
  const heroClock = document.getElementById('heroClock');
  if (heroClock) {
    const currentTime = getCurrentTime();
    heroClock.textContent = `${DAYS[currentTime.day]} ${formatTime(currentTime.m)}`;
  }

  const heroBuilding = document.getElementById('heroBld');
  if (heroBuilding) {
    heroBuilding.innerHTML = [3, 2, 1].map(floor => {
      const roomsOnFloor = ROOMS.filter(r => r.b === 38 && r.floor === floor);
      const cellsHtml = roomsOnFloor.map(r => renderGridCell(r)).join('');
      return `<div class="floor"><span>F${floor}</span>${cellsHtml}</div>`;
    }).join('');
  }

  // Animate 4 statistics counters
  const statsBox = document.getElementById('stats');
  if (!statsBox) return;
  if (statsBox.dataset.done) return;
  statsBox.dataset.done = '1';

  const observer = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();

    const counterElements = getAllElements('b[data-t]', statsBox);
    counterElements.forEach(counter => {
      const targetValue = parseInt(counter.dataset.t, 10);
      const startTime = performance.now();
      const animationDuration = 1400;

      function updateCounter(currentTimeMs) {
        const progress = Math.min(1, (currentTimeMs - startTime) / animationDuration);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentCount = Math.round(targetValue * easeOut);
        counter.textContent = currentCount.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      }
      requestAnimationFrame(updateCounter);
    });
  });

  observer.observe(statsBox);
}


// ==========================================================================
// 11. USER AUTHENTICATION & LOGIN DIALOG
// ==========================================================================

// Update UI elements showing login state
function updateAuthUI() {
  const user = state.user;
  const signInButton = document.getElementById('signIn');
  if (signInButton) {
    signInButton.textContent = user ? 'Sign out' : 'Sign In';
  }

  const userBadge = document.getElementById('ub');
  if (userBadge) {
    if (user) {
      userBadge.innerHTML = `<b>${escapeHTML(user.name)}</b>${user.id}<span class="role">${ROLE_LABELS[user.role]}</span>`;
    } else {
      userBadge.innerHTML = '';
    }
  }
}
const authUI = updateAuthUI;

// Sign out function
function logout() {
  state.user = null;
  saveState();
  closeModal();
  showToast('Signed out');
  if (location.hash === '#/home') {
    renderApp();
  } else {
    location.hash = '#/home';
  }
}

// Open Sign In dialog
function openSignIn() {
  const demoChips = USERS.map(user => {
    return `<button type="button" class="chip tog" data-fill="${user.id}">${ROLE_LABELS[user.role]} · ${user.id}</button>`;
  }).join('');

  const modalHtml = `
    <h2>Sign in to Vacansee</h2>
    <p class="mute" style="margin-bottom:14px">Enter your 8-digit college Registration ID.</p>
    <form class="f" id="lf" novalidate>
      <label>Registration ID
        <input id="lId" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="23001234">
      </label>
      <div class="err" id="lErr"></div>
      <button class="btn p" type="submit">Sign In</button>
    </form>
    <div class="demo">
      <span class="mute">Demo IDs (tap to fill):</span><br>
      ${demoChips}
    </div>
  `;

  openModal(modalHtml);

  const inputId = document.getElementById('lId');
  const errorDisplay = document.getElementById('lErr');
  if (inputId) inputId.focus();

  // Accept numbers only
  if (inputId) {
    inputId.oninput = () => {
      const numbersOnly = inputId.value.replace(/\D/g, '').slice(0, 8);
      if (numbersOnly !== inputId.value) {
        errorDisplay.textContent = 'Use numbers only, no letters or spaces.';
      } else {
        errorDisplay.textContent = '';
      }
      inputId.value = numbersOnly;
    };
  }

  // Pre-fill when clicking a demo ID
  const demoButtons = getAllElements('[data-fill]');
  demoButtons.forEach(btn => {
    btn.onclick = () => {
      inputId.value = btn.dataset.fill;
      errorDisplay.textContent = '';
    };
  });

  // Handle login submit
  const loginForm = document.getElementById('lf');
  if (loginForm) {
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const enteredId = inputId.value;

      if (!/^\d{8}$/.test(enteredId)) {
        errorDisplay.textContent = 'Please enter your 8-digit Registration ID.';
        return;
      }

      const matchedUser = USERS.find(u => u.id === enteredId);
      if (!matchedUser) {
        errorDisplay.textContent = 'Invalid Registration ID.';
        return;
      }

      state.user = matchedUser;
      saveState();
      closeModal();
      showToast(`Welcome, ${matchedUser.name.split(' ')[0]} (${ROLE_LABELS[matchedUser.role]})`);

      const currentRoute = location.hash.replace('#/', '');
      if (!currentRoute || currentRoute === 'home' || currentRoute === 'about' || currentRoute === 'how') {
        location.hash = '#/dashboard';
      } else {
        renderApp();
      }
    };
  }
}

// Attach navbar sign in/out buttons
const navSignInButton = document.getElementById('signIn');
if (navSignInButton) {
  navSignInButton.onclick = () => (state.user ? logout() : openSignIn());
}

const sidebarSignOutButton = document.getElementById('out');
if (sidebarSignOutButton) {
  sidebarSignOutButton.onclick = logout;
}


// ==========================================================================
// 12. CLIENT-SIDE ROUTER & NAVIGATION
// ==========================================================================

// Main render function that handles hash routing
function renderApp() {
  const currentRoute = location.hash.replace('#/', '') || 'home';
  const isLandingRoute = (currentRoute === 'home' || currentRoute === 'about' || currentRoute === 'how');
  const requiresLogin = !isLandingRoute && !state.user;

  // Toggle landing page vs app shell
  const landingSection = document.getElementById('landing');
  const appSection = document.getElementById('app');

  if (landingSection) {
    landingSection.classList.toggle('hide', !(isLandingRoute || requiresLogin));
  }
  if (appSection) {
    appSection.classList.toggle('hide', (isLandingRoute || requiresLogin));
  }

  updateAuthUI();

  if (isLandingRoute || requiresLogin) {
    renderLanding();
    if (requiresLogin) {
      const overlay = document.getElementById('ov');
      if (overlay && !overlay.classList.contains('on')) {
        openSignIn();
      }
      return;
    }
    window.scrollTo(0, 0);
    return;
  }

  // Render view
  const targetView = VIEWS[currentRoute] ? currentRoute : 'dashboard';

  // Highlight active sidebar menu item
  const sidebarLinks = getAllElements('.side [data-r]');
  sidebarLinks.forEach(link => {
    link.classList.toggle('on', link.dataset.r === targetView);
  });

  const mainView = document.getElementById('view');
  if (mainView) {
    mainView.innerHTML = VIEWS[targetView]();
    if (VIEW_AFTER_RENDER[targetView]) {
      VIEW_AFTER_RENDER[targetView]();
    }
  }
}
const render = renderApp;

// Hash change event listener
window.addEventListener('hashchange', () => {
  closeModal();
  renderApp();
  const hash = location.hash;
  if (hash !== '#/home' && hash !== '#/about' && hash !== '#/how') {
    window.scrollTo(0, 0);
  }
});

// Periodic auto-refresh every 30 seconds to keep live room availability current
setInterval(() => {
  if (!state.user) return;
  const overlay = document.getElementById('ov');
  if (overlay && overlay.classList.contains('on')) return;

  const activeTag = document.activeElement ? document.activeElement.tagName : '';
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(activeTag)) return;

  const currentRoute = location.hash.replace('#/', '');
  if (!['report', 'settings'].includes(currentRoute)) {
    renderApp();
  }
}, 30000);


// ==========================================================================
// 13. FLOATING CAPSULE DOCK NAVIGATION
// ==========================================================================

const dockToggle = document.getElementById('dockToggle');
const dockMenu = document.getElementById('dockMenu');
const dockBackdrop = document.getElementById('dockBackdrop');
const dockClose = document.getElementById('dockClose');
const dockPill = document.getElementById('dockPill');

function toggleDockMenu(shouldOpen) {
  if (!dockMenu) return;
  const openState = (shouldOpen !== undefined) ? shouldOpen : !dockMenu.classList.contains('open');
  dockMenu.classList.toggle('open', openState);
  if (dockBackdrop) dockBackdrop.classList.toggle('open', openState);
  dockMenu.setAttribute('aria-hidden', !openState);
}

if (dockToggle) {
  dockToggle.onclick = (e) => {
    e.stopPropagation();
    toggleDockMenu();
  };
}

if (dockPill) {
  dockPill.onclick = (e) => {
    if (e.target.closest('.dock-theme-btn')) return;
    toggleDockMenu();
  };
}

if (dockClose) {
  dockClose.onclick = (e) => {
    e.stopPropagation();
    toggleDockMenu(false);
  };
}

if (dockBackdrop) {
  dockBackdrop.onclick = () => toggleDockMenu(false);
}

const dockNavLinks = getAllElements('.dock-nav-item, .dock-menu-footer a');
dockNavLinks.forEach(link => {
  link.addEventListener('click', () => {
    toggleDockMenu(false);
  });
});


// ==========================================================================
// 14. INITIALIZE APPLICATION
// ==========================================================================

renderApp();
