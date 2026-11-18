/**
 * VacanSee - User Accounts & Role-Based Access Control (RBAC)
 * 
 * Defines authorized demo accounts, permission levels, maximum
 * booking durations, purpose rules, and validation logic.
 */

// Sample user accounts for frontend authentication and demo testing
export const USERS = [
  { id: '23001234', name: 'Student User', role: 'student' },
  { id: '24005678', name: 'Faculty User', role: 'professor' },
  { id: '19000101', name: 'Dr. Meera Nair', role: 'hod' },
  { id: '18000202', name: 'Dr. Rahul Verma', role: 'hos' },
  { id: '17000303', name: 'Prof. Anita Desai', role: 'dean' },
  { id: '10000001', name: 'Campus Admin', role: 'admin' }
];

// Human-readable labels for each institutional role
export const ROLE_LABELS = {
  student: 'Student',
  professor: 'Professor',
  hod: 'HOD',
  hos: 'HOS',
  dean: 'Dean',
  admin: 'Admin'
};

// Numeric permission level:
// Level 0: Student
// Level 1: Professor
// Level 2: HOD (Head of Department), HOS (Head of School)
// Level 3: Dean, Campus Admin
export const ROLE_LEVELS = {
  student: 0,
  professor: 1,
  hod: 2,
  hos: 2,
  dean: 3,
  admin: 3
};

// Maximum reservation time allowed in minutes for each role level:
// Level 0: 120m (2 hours)
// Level 1: 180m (3 hours)
// Level 2: 240m (4 hours)
// Level 3: 480m (8 hours)
export const MAX_BOOKING_MINUTES = [120, 180, 240, 480];

// Human-readable policy descriptions for UI banners
export const ACCESS_DESCRIPTIONS = [
  'Students can search and view vacant classrooms for study purposes. Reservations are restricted to Faculty and Staff.',
  'Faculty can reserve any room for up to 3 hours, including meetings, presentations, interviews and club activities.',
  'You can reserve any room for up to 4 hours, including workshops.',
  'You can reserve any room for up to 8 hours, for every purpose.'
];

/**
 * Checks if a user role possesses classroom reservation privileges.
 * Rules:
 * - Students can search and view classrooms but CANNOT reserve them.
 * - Faculty (Professor), HOD, HOS, Dean, and Admin CAN reserve classrooms.
 * @param {number|Object|string} userOrLevel 
 * @returns {boolean}
 */
export function canRoleReserve(userOrLevel) {
  const level = typeof userOrLevel === 'number' ? userOrLevel : getUserLevel(userOrLevel);
  return level >= 1;
}

// Purpose rules: required minimum level, required facilities, and minimum capacity
export const PURPOSE_RULES = {
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

/**
 * Resolves numeric permission level (0 to 3) from a user object or role string.
 * @param {Object|string|null} userOrRole 
 * @returns {number} 0 (default/student), 1, 2, or 3
 */
export function getUserLevel(userOrRole) {
  if (!userOrRole) return 0;
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole.role;
  return ROLE_LEVELS[role] !== undefined ? ROLE_LEVELS[role] : 0;
}

/**
 * Returns the maximum allowed reservation duration in minutes for a given user or level.
 * @param {number|Object|string} userOrLevel 
 * @returns {number}
 */
export function getMaxBookingMinutes(userOrLevel = 0) {
  const level = typeof userOrLevel === 'number' ? userOrLevel : getUserLevel(userOrLevel);
  return MAX_BOOKING_MINUTES[level] || MAX_BOOKING_MINUTES[0];
}

/**
 * Checks if a user possesses Administrative privileges.
 * @param {Object|string|null} userOrRole 
 * @returns {boolean}
 */
export function isUserAdmin(userOrRole) {
  if (!userOrRole) return false;
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole.role;
  return role === 'admin';
}

/**
 * Returns a list of purpose names available for a given user permission level.
 * @param {number|Object|string} userOrLevel 
 * @returns {string[]}
 */
export function getAvailablePurposes(userOrLevel = 0) {
  const level = typeof userOrLevel === 'number' ? userOrLevel : getUserLevel(userOrLevel);
  const allowed = [];
  for (const purpose in PURPOSE_RULES) {
    if (PURPOSE_RULES[purpose].minLevel <= level) {
      allowed.push(purpose);
    }
  }
  return allowed;
}

/**
 * Looks up a demo user by their 8-digit registration ID.
 * @param {string} id 
 * @returns {Object|undefined}
 */
export function getUserById(id) {
  return USERS.find(u => u.id === id);
}

/**
 * Validates whether a user can book a room for a given purpose and duration.
 * Enforces institutional capacity limits, duration limits, purpose permissions,
 * and facility equipment requirements.
 * 
 * @param {{ id: string, cap: number, fac: string[] }} room 
 * @param {string} purpose 
 * @param {number} durationMinutes 
 * @param {number|Object|string} userOrLevel 
 * @returns {string} Error message string if invalid, or "" if validation passes.
 */
export function validateRoomBooking(room, purpose, durationMinutes, userOrLevel = 0) {
  const level = typeof userOrLevel === 'number' ? userOrLevel : getUserLevel(userOrLevel);
  const maxAllowed = getMaxBookingMinutes(level);

  // Rule 1: Students (Level 0) can only reserve rooms with up to 60 seats
  if (level === 0 && room.cap > 60) {
    return `Students can only use rooms with up to 60 seats. Room ${room.id} has ${room.cap} seats.`;
  }

  // Rule 2: Booking duration limit enforcement
  if (durationMinutes > maxAllowed) {
    return `Your role can only reserve a room for up to ${maxAllowed / 60} hours.`;
  }

  // Rule 3: Purpose authorization check
  const rule = PURPOSE_RULES[purpose];
  if (!rule || rule.minLevel > level) {
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

  return ''; // All rules satisfied
}

