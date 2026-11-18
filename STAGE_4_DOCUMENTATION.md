# VacanSee - Stage 4 Documentation: Reusable React UI Components & Modals

## 1. Overview & Architectural Goals
In Stage 4 of the VacanSee migration from vanilla JavaScript to React.js, we implemented the complete set of reusable UI components and interactive modal dialogs.

Strict adherence to the following requirements was maintained throughout:
1. **Preserve Nothing OS Design Language**: Obsidian charcoal dark backdrop (`#111315`), Amber/orange accents (`#ea580c`/`#f97316`), Karla, Doto, and Space Mono typography, floating capsule pill dock, frosted glassmorphism, and responsive layouts.
2. **Beginner-Friendly React**: Standard functional components, clear descriptive prop names, standard hooks (`useState`, `useEffect`), and extensive comments without introducing external state managers (e.g., Redux).
3. **Preserve Business Logic & Safety Rules**:
   - 960 deterministic classrooms across 40 buildings.
   - Status indicators: `free`, `soon`, `busy`, and `closed`.
   - 8-digit numeric-only registration ID validation with quick-fill demo chips.
   - 8:00 AM – 6:00 PM classroom occupancy timeline bar with current hour indication.
   - Institutional RBAC duration limits (Student: 120m, Faculty: 180m, HOD/HOS: 240m, Dean/Admin: 480m).
   - Campus 6:00 PM closing cutoff validation.
   - Conflict & double-booking collision prevention against scheduled lectures and active reservations.
4. **Context & Persistence Integration**:
   - `ThemeContext`: Seamless dark/light toggle and `data-theme` HTML attribute synchronization.
   - `AuthContext`: Institutional user login, permissions, and session management.
   - `ReservationContext`: Modal orchestration (`openModal`, `closeModal`), bookings (`addReservation`), and toast alerts (`showToast`).

---

## 2. Directory Structure of Stage 4 Files

```text
src/
├── components/
│   ├── common/
│   │   ├── DockNav.jsx          # Floating capsule navigation with expandable Nothing drawer
│   │   ├── Sidebar.jsx          # Authenticated app shell sidebar with user profile badge
│   │   ├── RoomCard.jsx         # Classroom search result card with status badge & amenities
│   │   ├── Pill.jsx             # Status badge component (free, soon, busy, closed)
│   │   ├── FacilityChips.jsx    # Reusable classroom amenity tag list
│   │   ├── Modal.jsx            # Glassmorphic modal container with Esc & backdrop dismiss
│   │   └── Toast.jsx            # Floating feedback alert notification
│   └── modals/
│       ├── SignInModal.jsx      # 8-digit registration ID login with demo account chips
│       ├── RoomDetailModal.jsx  # Room information with 8 AM - 6 PM occupancy timeline
│       └── BookingModal.jsx     # Reservation form with collision checks & duration capping
├── context/
│   ├── AuthContext.jsx
│   ├── ReservationContext.jsx
│   └── ThemeContext.jsx
├── data/
│   ├── roomsData.js
│   ├── scheduleEngine.js
│   └── usersData.js
├── hooks/
│   ├── useCountUp.js
│   └── useCurrentTime.js
├── styles/
│   └── vacansee.css
├── App.jsx                      # Stage 4 Interactive Verification Showcase
├── index.css
└── main.jsx
```

---

## 3. Component Details & Code Examples

### A. Common Components

#### 1. `Pill.jsx` (`src/components/common/Pill.jsx`)
- **Purpose**: Displays status badges matching Nothing OS visual styles.
- **Props**:
  - `status`: `'free' | 'soon' | 'busy' | 'closed'` (Default: `'free'`)
  - `label`: Status string (e.g., `"Available"`, `"Occupied"`)
  - `className`: Optional custom classes
- **Code Excerpt**:
```jsx
export default function Pill({ status = 'free', label, className = '', children }) {
  const content = label || children;
  return (
    <span className={`pill ${status} ${className}`.trim()}>
      {content}
    </span>
  );
}
```

#### 2. `FacilityChips.jsx` (`src/components/common/FacilityChips.jsx`)
- **Purpose**: Displays classroom amenities as compact tags (Wi-Fi, Projector, AC, Whiteboard, Smart Board, Power Outlets).
- **Props**:
  - `facilities`: Array of facility strings (e.g., `['Wi-Fi', 'Projector']`)
  - `className`: Optional styling classes
- **Code Excerpt**:
```jsx
export default function FacilityChips({ facilities = [], className = '' }) {
  if (!facilities || facilities.length === 0) return null;

  return (
    <div className={`row flex flex-wrap gap-1.5 ${className}`.trim()}>
      {facilities.map((facility) => (
        <span key={facility} className="chip">
          {facility}
        </span>
      ))}
    </div>
  );
}
```

#### 3. `Modal.jsx` (`src/components/common/Modal.jsx`)
- **Purpose**: Accessible dialog overlay. Handles backdrop click dismissal and `Escape` key listeners with automatic event cleanup.
- **Props**:
  - `isOpen`: Boolean
  - `onClose`: Function called when clicking `×`, clicking backdrop, or pressing `Escape`
  - `children`: Modal dialog content
- **Code Excerpt**:
```jsx
export default function Modal({ isOpen, onClose, children, className = '' }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="ov on" id="ov" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      <div className={`md ${className}`.trim()} id="md">
        <button type="button" className="x" aria-label="Close dialog" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
```

#### 4. `Toast.jsx` (`src/components/common/Toast.jsx`)
- **Purpose**: Subscribes to `useReservation().toast` state to render notification popups that automatically fade in and dismiss after 2600ms.
- **Code Excerpt**:
```jsx
export default function Toast() {
  const { toast } = useReservation();
  if (!toast || !toast.message) return null;

  return (
    <div className={`toast ${toast.visible ? 'on' : ''}`} id="toast" role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}
```

#### 5. `RoomCard.jsx` (`src/components/common/RoomCard.jsx`)
- **Purpose**: Renders classroom summary card with real-time status pill, capacity, building details, free-until duration, facility chips, and a "View Details" button.
- **Props**:
  - `room`: Classroom data object (`{ id, b, floor, cap, fac, type }`)
  - `startMinute`: Optional start time minute
  - `onViewDetails`: Callback invoked when clicking "View Details"
- **Code Excerpt**:
```jsx
export default function RoomCard({ room, startMinute, onViewDetails }) {
  const { reservations, reports, simTime } = useReservation();
  const currentTime = getCurrentTime(simTime);

  const activeStartMinute = startMinute !== undefined ? startMinute : currentTime.m;
  const freeUntil = getFreeUntilMinute(room, activeStartMinute, currentTime, reservations);
  const statusBadge = (activeStartMinute === currentTime.m)
    ? 'Available'
    : `Free at ${formatTime(activeStartMinute)}`;

  return (
    <article className="card room">
      <div className="hd">
        <h3>Room {room.id}</h3>
        <Pill status="free" label={statusBadge} />
      </div>
      <div className="info">{getBuildingName(room.b)} · Floor {room.floor} · {room.type}</div>
      <div className="info">Capacity: <b>{room.cap}</b> seats</div>
      <div className="info">
        Available until: <b>{formatTime(freeUntil)}</b> ({formatDuration(freeUntil - activeStartMinute)})
      </div>
      <FacilityChips facilities={room.fac} className="my-2" />
      <button type="button" className="btn p sm mt-2" onClick={() => onViewDetails(room.id)}>
        View Details
      </button>
    </article>
  );
}
```

#### 6. `DockNav.jsx` (`src/components/common/DockNav.jsx`)
- **Purpose**: Floating capsule navigation bar with expanding Nothing OS-style drawer, theme toggle, route switching, and dynamic sign in/out button.
- **Props**:
  - `currentRoute`: Active route identifier (e.g. `'dashboard'`, `'home'`)
  - `onNavigate`: Route selection callback

#### 7. `Sidebar.jsx` (`src/components/common/Sidebar.jsx`)
- **Purpose**: Internal app shell sidebar providing navigation across Find Room, Timetable, Reservations, Report, and Settings, plus active user profile card and sign out.
- **Props**:
  - `currentRoute`: Active route string
  - `onNavigate`: Route change handler

---

### B. Modal Dialogs

#### 8. `SignInModal.jsx` (`src/components/modals/SignInModal.jsx`)
- **Purpose**: College Registration ID sign-in modal.
- **Key Features**:
  - Filters out non-numeric characters automatically (`replace(/\D/g, '').slice(0, 8)`).
  - Shows `'Use numbers only, no letters or spaces.'` when invalid characters are typed.
  - Quick-fill demo account chips (`Student`, `Professor`, `HOD`, `HOS`, `Dean`, `Admin`).
  - Calls `login(registrationId)` from `AuthContext`.
  - Dispatches welcome toast and closes dialog on success.

#### 9. `RoomDetailModal.jsx` (`src/components/modals/RoomDetailModal.jsx`)
- **Purpose**: Displays in-depth classroom schedule, live status, and occupancy timeline.
- **Key Features**:
  - Generates an 8:00 AM to 6:00 PM timeline bar (10 hours, from 8 to 17).
  - Highlights busy slots (`.b`) based on deterministic lectures and bookings.
  - Highlights current hour (`.now`).
  - Role-adaptive action label (`"Use this room"` for Student, `"Reserve"` for Faculty/Admin).
  - Transitions to `BookingModal` on reservation button click.
  - Navigates to `#/report` with pre-selected building on report button click.

#### 10. `BookingModal.jsx` (`src/components/modals/BookingModal.jsx`)
- **Purpose**: Form to reserve a classroom today.
- **Key Features**:
  - Earliest start time is rounded up to next 30-minute block (`Math.ceil(currentTime.m / 30) * 30`).
  - Duration dropdown filters options to those permitted by user's role:
    - Student: up to 120 minutes (2 hrs)
    - Faculty: up to 180 minutes (3 hrs)
    - HOD/HOS: up to 240 minutes (4 hrs)
    - Dean/Admin: up to 480 minutes (8 hrs)
  - Purpose dropdown populated with user-authorized purposes via `getAvailablePurposes(userLevel)`.
  - Validations enforced:
    - Group size must be at least 1 and cannot exceed room capacity (`room.cap`).
    - Student max room capacity limit (max 60 seats).
    - Campus closing time validation: cannot exceed 6:00 PM (1080 min).
    - Conflict collision check: rejects slots overlapping deterministic lectures or existing bookings.
  - Saves booking via `addReservation` in `ReservationContext`, persisting to localStorage (`cs_res`).

---

## 4. Verification and Automated Test Results

An automated test suite (`test-stage4.js`) was executed to verify all 10 components and their business rules.

### Test Output (`node test-stage4.js`):
```text
--- Starting Stage 4 Automated Component & Logic Verification ---
[PASS] Component exists: src/components/common/DockNav.jsx
[PASS] Component exists: src/components/common/Sidebar.jsx
[PASS] Component exists: src/components/common/RoomCard.jsx
[PASS] Component exists: src/components/common/Pill.jsx
[PASS] Component exists: src/components/common/FacilityChips.jsx
[PASS] Component exists: src/components/common/Modal.jsx
[PASS] Component exists: src/components/common/Toast.jsx
[PASS] Component exists: src/components/modals/SignInModal.jsx
[PASS] Component exists: src/components/modals/RoomDetailModal.jsx
[PASS] Component exists: src/components/modals/BookingModal.jsx
[PASS] SignIn: valid 8 digits accepted
[PASS] SignIn: letters and symbols stripped, capped at 8
[PASS] SignIn: non-numeric yields empty string
[PASS] SignIn: 6 demo user accounts available for quick-fill
[PASS] RoomDetail: Room B01-101 exists
[PASS] RoomDetail: timeline generates exactly 10 slots (8 AM to 5 PM)
[PASS] RoomDetail: timeline bounds are 8 to 17
[PASS] RoomDetail: hour 10 marked as current (now)
[PASS] Action label: Student (level 0) is "Use this room"
[PASS] Action label: Faculty (level 1) is "Reserve"
[PASS] Action label: Admin (level 3) is "Reserve"
[PASS] Booking: earliest start slot is rounded to next 30-min block (600 = 10:00 AM)
[PASS] Booking: Student durations capped at 120m
[PASS] Booking: Admin durations allowed up to 480m
[PASS] Booking: Found small room with cap 20
[PASS] Booking: Student group size <= cap allowed
[PASS] Booking: Student rejected for 120-seat Lecture Hall
[PASS] Booking: 5:30 PM + 60m exceeds campus close minute (1080)
[PASS] Booking: Vacancy check before reservation executes cleanly
[PASS] Booking: Collision check rejects overlapping booking at minute 600

==================================================
Stage 4 Verification: 30 / 30 assertions passed.
==================================================
```

### Production Build Verification (`npm run build`):
```text
> vacansee@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 48 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.82 kB │ gzip:  0.47 kB
dist/assets/index-B-COeeK5.css   31.64 kB │ gzip:  7.72 kB
dist/assets/index-Cfivj-3w.js   171.29 kB │ gzip: 55.10 kB
✓ built in 4.51s
```
Zero errors, zero warnings.

---

## 5. How to Run the Stage 4 Application
To start the React development server:
```bash
npm run dev
```
To build and preview the production bundle:
```bash
npm run build
npm run preview
```

---

## 6. Current Status & Next Steps
- **Stage 1 (Scaffolding & Assets)**: Completed & verified.
- **Stage 2 (Business Logic & Scheduling Engine)**: Completed & verified.
- **Stage 3 (Context Providers & Custom Hooks)**: Completed & verified.
- **Stage 4 (Reusable UI Components & Modals)**: **Completed & verified.**
- **Stage 5 (Pages & Route Views)**: Awaiting user confirmation to proceed.

