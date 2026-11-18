# VacanSee — Stage 2 Migration Documentation

> **Stage 2: Business Logic Extraction to ES Modules**  
> **Status:** Completed & 100% Verified  
> **Original Code Integrity:** Preserved in `script.js` and `ClassSpace/script.js` without deletion or alteration.

---

## 1. Overview & Objective

In **Stage 2**, all procedural core algorithms, classroom generators, permission gates, and availability calculation functions were extracted from the vanilla `script.js` into clean, beginner-friendly **ECMAScript (ES6) modules** located in `src/data/`.

These modules contain **zero React-specific code** and **zero external library dependencies**, ensuring they can be imported directly into React Contexts, Custom Hooks, UI components, or testing scripts.

---

## 2. Extracted Modules & File Breakdown

```
src/data/
├── scheduleEngine.js   # Time formatting, hash generator, occupancy logic, collision detection
├── roomsData.js        # 960 classroom generator across 40 buildings, capacities, equipment
└── usersData.js        # Demo accounts, RBAC permission levels, booking duration rules & validation
```

---

## 3. Function & Module Specifications

### Module A: `src/data/scheduleEngine.js`

Contains scheduling mathematics, timeline conversions, interval merging, and conflict detection.

| Function | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- |
| `padZero(num)` | `num: number \| string` | `string` | Converts `5` into `"05"` for clean time and building codes. |
| `simpleHash(text)` | `text: string` | `number` | Deterministic pseudo-random string hash `(hash * 31 + charCode) % 10000000`. |
| `formatTime(minutes)` | `minutes: number` | `string` | Converts minutes from midnight into 12-hour AM/PM string (e.g. `540` -> `"9:00 AM"`). |
| `formatDuration(minutes)` | `minutes: number` | `string` | Converts minutes into readable duration (e.g. `90` -> `"1h 30m"`). |
| `getCurrentTime(simulatedTime)` | `simulatedTime?: string` | `Object` | Returns `{ m, day, dt, sim }`. Falls back to `11:15 AM Monday` during weekends/after-hours. |
| `isHourBusy(room, dayIndex, hour)` | `room, dayIndex, hour` | `boolean` | Returns `false` at hour 13 (Lunch break). Returns true if `hash % 100 < 48` (~48% chance). |
| `getBusyIntervals(room, day, dt, reservations)` | `room, day, dt, res[]` | `Array<[start, end]>` | Merges scheduled classes with user reservations into sorted non-overlapping blocks. |
| `getRoomStatus(room, currentTime, reservations)` | `room, time, res[]` | `Object` | Computes live badge: `{ k: 'free' \| 'soon' \| 'busy', until, left, label }`. |
| `isRoomVacant(room, start, duration, time, reservations)` | `room, start, dur, time, res[]` | `boolean` | Strict collision check: ensures window is between 8 AM – 6 PM and does not overlap busy blocks. |
| `getFreeUntilMinute(room, start, time, reservations)` | `room, start, time, res[]` | `number` | Finds minute when the next busy block begins, or `1080` (6:00 PM). |
| `hasRecentReport(room, reports)` | `room, reports[]` | `boolean` | Checks if a room status issue was reported within the last 3 hours. |

#### Actual Code Example: Collision Detection
```javascript
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
```

---

### Module B: `src/data/roomsData.js`

Procedurally generates the full campus database and provides lookup helpers.

| Export | Type | Description |
| :--- | :--- | :--- |
| `TOTAL_BUILDINGS` | `number` (40) | Total buildings across the university campus. |
| `FLOORS_PER_BUILDING`| `number` (3) | Floors per building (Floor 1, 2, 3). |
| `ROOMS_PER_FLOOR` | `number` (8) | Rooms per floor (`01` to `08`). |
| `ALL_FACILITIES` | `string[]` | Standard equipment list (`Projector`, `AC`, `Wi-Fi`, `Whiteboard`, etc.). |
| `CAPACITY_OPTIONS` | `number[]` | Deterministic capacity pool: `[30, 40, 60, 80, 20, 50, 120, 35]`. |
| `ROOMS` | `Array<Room>` | The 960 generated classroom objects. |
| `getBuildingName(num)` | `Function` | Formats building number to `"Building 01"`. |
| `getRoomById(id)` | `Function` | Finds room object by unique ID (e.g. `"B01-101"`). |
| `getRoomsByBuilding(b)` | `Function` | Returns array of 24 rooms belonging to that building. |
| `getBuildingList()` | `Function` | Returns array of 40 building options for dropdowns. |

#### Room Object Structure
```json
{
  "id": "B01-101",
  "b": 1,
  "floor": 1,
  "cap": 40,
  "fac": ["Wi-Fi", "Projector", "Whiteboard"],
  "type": "Classroom"
}
```

---

### Module C: `src/data/usersData.js`

Defines demo accounts, Role-Based Access Control (RBAC), and booking validation.

| Export | Type | Description |
| :--- | :--- | :--- |
| `USERS` | `Array<User>` | 6 Institutional Demo Accounts (Student, Professor, HOD, HOS, Dean, Admin). |
| `ROLE_LABELS` | `Object` | Role display names (`Student`, `Professor`, `HOD`, `HOS`, `Dean`, `Admin`). |
| `ROLE_LEVELS` | `Object` | Numeric permission hierarchy: `student: 0`, `professor: 1`, `hod: 2`, `hos: 2`, `dean: 3`, `admin: 3`. |
| `MAX_BOOKING_MINUTES`| `number[]` | Maximum duration limit: `Level 0: 120m`, `Level 1: 180m`, `Level 2: 240m`, `Level 3: 480m`. |
| `PURPOSE_RULES` | `Object` | Rules for 9 booking purposes (minimum level, minimum capacity, required facilities). |
| `getUserLevel(user)` | `Function` | Resolves numeric level (0 to 3) from user or role. |
| `getMaxBookingMinutes(level)` | `Function` | Returns allowed duration cap in minutes. |
| `getAvailablePurposes(level)` | `Function` | Returns array of allowed purpose strings for a role level. |
| `validateRoomBooking(...)` | `Function` | Enforces all 5 validation rules before confirming any booking. |

#### Actual Code Example: Multi-tier Validation Rule
```javascript
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
```

---

## 4. Verification & Automated Test Results

An automated Node.js test script was executed against the newly extracted ES modules. All 11 rigorous verification assertions passed:

```
=== STAGE 2 VERIFICATION TEST ===
✓ Room count: Exactly 960 rooms generated (40 buildings x 3 floors x 8 rooms)
✓ Building 1 rooms count: 24 (3 floors x 8 rooms)
✓ Capacities found: 20, 30, 35, 40, 50, 60, 80, 120
✓ Lunch hour (1:00 PM / Hour 13): 100% free across all tested rooms & days
✓ Overall lecture occupancy (excl. lunch): 48.0% (target ~48%)
✓ RBAC duration limits: Student (120m), Faculty (180m), HOD/HOS (240m), Admin (480m)
✓ Student restricted to <= 60 seats: Students can only use rooms with up to 60 seats. Room B01-104 has 120 seats.
✓ Faculty allowed on > 60 seats room: Allowed (no error)
✓ Duration limit validation: Your role can only reserve a room for up to 2 hours.
✓ Purpose min capacity validation: Club activity requires a room with at least 30 seats.
✓ Collision detection (overlapping reservation): Blocked (false)
✓ Campus close validation (extends past 6:00 PM): Blocked (false)
=== ALL STAGE 2 TESTS PASSED PERFECTLY ===
```

---

## 5. Production Build Verification

`npm run build` was run with the extracted modules in place:
```bash
> vite build
vite v5.4.21 building for production...
✓ 31 modules transformed.
dist/index.html                   0.82 kB │ gzip:  0.48 kB
dist/assets/index-BCwd_8hI.css   30.10 kB │ gzip:  7.43 kB
dist/assets/index-C2VYMTZb.js   145.43 kB │ gzip: 46.92 kB
✓ built in 3.65s
```
**Result:** Clean build with 0 errors and 0 warnings.

---

## 6. Current State & Incomplete Functionality (Intentionally Deferred)

As strictly requested, the following features remain to be implemented in subsequent stages:
- **Stage 3**: React Context Providers (`AuthContext`, `ReservationContext`, `ThemeContext`) and custom hooks (`useCurrentTime`, `useCountUp`).
- **Stage 4**: Reusable React UI Components (`DockNav`, `Sidebar`, `RoomCard`, `Modal`, `Toast`, `SignInModal`, `BookingModal`).
- **Stage 5**: Full Page Views (`LandingPage`, `DashboardPage`, `TimetablePage`, `ReservationsPage`, `ReportPage`, `SettingsPage`) and `HashRouter` integration.
- **Stage 6**: End-to-end user verification and Git push.

---

## 7. Next Step: Stage 3

In **Stage 3**, we will connect these data modules to React state management:
1. `ThemeContext.jsx`: Dark / light mode state using `data-theme` attribute and `localStorage`.
2. `AuthContext.jsx`: User login, demo quick-fill, logout, and role helpers.
3. `ReservationContext.jsx`: Bookings array, cancellation, report issues, filter state, and modal management.
4. `useCurrentTime.js`: 30-second interval auto-refresh and demo clock simulator hook.
5. `useCountUp.js`: Smooth number counter hook for landing page metrics.

> **Execution paused:** Awaiting your review and approval before starting Stage 3.

