# VacanSee — Stage 3 Migration Documentation

> **Stage 3: Context Providers & Custom Hooks**  
> **Status:** Completed & 100% Verified  
> **Original Code Integrity:** Preserved in `script.js` and `ClassSpace/` without modification.

---

## 1. Overview & Architecture

In **Stage 3**, global state management and reactive browser capabilities were implemented using standard **React Context API** and **Custom React Hooks**.

### Provider Hierarchy
The application wraps components in an acyclic, modular provider tree:

```jsx
<ThemeProvider>
  <AuthProvider>
    <ReservationProvider>
      <App />
    </ReservationProvider>
  </AuthProvider>
</ThemeProvider>
```

Each provider isolates its own concerns without circular dependencies:
1. **`ThemeProvider`**: Manages Obsidian Dark / Light mode, localStorage persistence (`cs_theme`), and `<html data-theme="...">` synchronisation.
2. **`AuthProvider`**: Manages current user session (`cs_user`), 8-digit registration ID validation, institutional role levels (0–3), and access limits.
3. **`ReservationProvider`**: Manages room reservations (`cs_res`), issue reports (`cs_rep`), search filter criteria (`cs_b`), active modal state, and toast feedback.
4. **`useCurrentTime`**: Tracks university operating hours (8:00 AM – 6:00 PM) with 30-second interval updates and simulated demo time.
5. **`useCountUp`**: Smooth cubic ease-out numerical animations for landing page statistics.

---

## 2. File-by-File Breakdown & Code Examples

### 1. `src/context/ThemeContext.jsx`

- **Purpose**: Controls visual theme switching between Obsidian charcoal (`#111315`) and warm light (`#f8f4ec`).
- **LocalStorage Key**: `'cs_theme'`
- **DOM Integration**: Sets `document.documentElement.dataset.theme = theme`.

#### Actual Implementation
```jsx
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('cs_theme');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark'; // VacanSee default
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('cs_theme', JSON.stringify(theme));
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => setThemeState(t => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

### 2. `src/context/AuthContext.jsx`

- **Purpose**: Validates 8-digit institutional registration IDs, authenticates against authorized demo accounts, computes RBAC permission levels (0–3), and manages sign-in/sign-out sessions.
- **LocalStorage Key**: `'cs_user'`

| Property / Method | Type | Description |
| :--- | :--- | :--- |
| `user` | `Object \| null` | Authenticated user object `{ id, name, role }`. |
| `isAuthenticated` | `boolean` | `true` if a user is logged in. |
| `userLevel` | `number` (0–3) | Student: `0`, Faculty: `1`, HOD/HOS: `2`, Dean/Admin: `3`. |
| `isAdmin` | `boolean` | `true` if `user.role === 'admin'`. |
| `maxBookingMinutes` | `number` | Allowed reservation duration cap: `120m`, `180m`, `240m`, or `480m`. |
| `allowedPurposes` | `string[]` | List of purpose categories the current role is authorized to book. |
| `login(regId)` | `Function` | Validates format `/^\d{8}$/` and matches demo user. Returns `{ success, error? }`. |
| `logout()` | `Function` | Clears user state and removes `'cs_user'` from localStorage. |

#### Actual Implementation: Login Validation
```jsx
const login = (registrationId) => {
  const cleanId = String(registrationId || '').trim();

  // Rule 1: Exactly 8 numeric digits
  if (!/^\d{8}$/.test(cleanId)) {
    return { success: false, error: 'Please enter your 8-digit Registration ID.' };
  }

  // Rule 2: Exists in authorized accounts
  const matchedUser = USERS.find(u => u.id === cleanId);
  if (!matchedUser) {
    return { success: false, error: 'Invalid Registration ID. Please select one of the demo IDs.' };
  }

  setUserState(matchedUser);
  return { success: true, user: matchedUser };
};
```

---

### 3. `src/context/ReservationContext.jsx`

- **Purpose**: Manages reservations, status reports, room filters, modal dialogs, and toast messages.
- **LocalStorage Keys**: `'cs_res'`, `'cs_rep'`, `'cs_b'`, and `'cs_sim'`.

| Property / Method | Description |
| :--- | :--- |
| `reservations` | Array of confirmed booking objects. |
| `reports` | Array of submitted classroom issue reports. |
| `filters` | Search filter state: `{ b, start, cap, dur, pur, fac }`. |
| `addReservation(details, room)` | Validates campus hours (≤ 6 PM) & runs collision detection before booking. |
| `cancelReservation(id)` | Cancels booking and shows notification toast. |
| `addReport(details)` | Submits issue report with timestamp and user ID. |
| `clearAllData()` | Empties reservations and reports (demo reset in Settings). |
| `openModal(type, data)` | Opens `'signin'`, `'detail'`, or `'booking'` modal. |
| `closeModal()` | Closes currently active modal. |
| `showToast(message)` | Displays temporary toast banner and auto-dismisses after 2600ms. |

#### Actual Implementation: Collision-Safe Reservation Creation
```jsx
const addReservation = (bookingDetails, room) => {
  const { startMinute, durationMinutes, groupSize, purpose, user } = bookingDetails;
  const currentTime = getCurrentTime(simTime);

  // 1. Campus closing time check (6:00 PM / 1080 min)
  if (startMinute + durationMinutes > CAMPUS_CLOSE_MINUTE) {
    return {
      success: false,
      error: 'Campus closes at 6:00 PM. Choose an earlier start or shorter duration.'
    };
  }

  // 2. Conflict & double-booking prevention check
  const isVacant = isRoomVacant(room, startMinute, durationMinutes, currentTime, reservations);
  if (!isVacant) {
    return {
      success: false,
      error: 'That slot overlaps a lecture or another booking. Pick a free time from the timeline.'
    };
  }

  // 3. Create booking record
  const newBooking = {
    id: 'R' + Date.now(),
    room: room.id,
    date: currentTime.dt,
    start: startMinute,
    end: startMinute + durationMinutes,
    people: groupSize,
    purpose: purpose,
    by: user.id,
    name: user.name,
    role: user.role
  };

  setReservations(prev => [...prev, newBooking]);
  showToast(`Room ${room.id} confirmed, ${formatTime(startMinute)}–${formatTime(startMinute + durationMinutes)}`);

  return { success: true, reservation: newBooking };
};
```

---

### 4. `src/hooks/useCurrentTime.js`

- **Purpose**: Keeps the campus clock updated every 30 seconds so room statuses naturally progress throughout the day.
- **Off-Hours Simulation**: Automatically simulates Monday 11:15 AM if evaluated on weekends or after 6:00 PM. Supports simulated demo time configured in Settings.
- **Cleanup**: Calls `clearInterval` on unmount to prevent background memory leaks.

#### Actual Implementation
```jsx
export function useCurrentTime(simulatedTime = '') {
  const [time, setTime] = useState(() => getCurrentTime(simulatedTime));

  useEffect(() => {
    setTime(getCurrentTime(simulatedTime));

    const intervalId = setInterval(() => {
      setTime(getCurrentTime(simulatedTime));
    }, 30000);

    return () => clearInterval(intervalId);
  }, [simulatedTime]);

  const formattedTime = formatTime(time.m);
  const dayName = DAYS[time.day] || 'Mon';
  const clockLabel = `${time.sim ? 'Demo time' : 'Live'} · ${dayName} ${formattedTime}`;

  return { ...time, formattedTime, dayName, clockLabel };
}
```

---

### 5. `src/hooks/useCountUp.js`

- **Purpose**: Reusable ease-out counter hook matching the landing page numerical animation.
- **Formula**: Cubic ease-out: $1 - (1 - \text{progress})^3$ over 1400ms.
- **Cleanup**: Automatically cancels `cancelAnimationFrame` on unmount.

#### Actual Implementation
```jsx
export function useCountUp(targetValue, duration = 1400, start = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    const target = parseInt(targetValue, 10) || 0;
    if (target === 0) { setCount(0); return; }

    let animationFrameId;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setCount(Math.round(target * easeOut));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    }

    animationFrameId = requestAnimationFrame(step);
    return () => animationFrameId && cancelAnimationFrame(animationFrameId);
  }, [targetValue, duration, start]);

  return { count, formattedCount: count.toLocaleString() };
}
```

---

## 3. Automated Verification Test Suite

A standalone Node.js verification script executed all unit tests covering authentication, collision handling, and hooks:

```
=== STAGE 3 CONTEXT & HOOK UNIT TESTS ===
✓ Auth logic & RBAC checks passed
✓ Reservation double-booking collision prevention verified
✓ Reservation cancellation verified
✓ Time calculation and formatting verified
✓ Ease-out cubic animation formula mathematically verified
=== ALL STAGE 3 TESTS PASSED ===
```

---

## 4. Production Build Verification

`npm run build` was run to verify module resolution and TypeScript/JSX compatibility:
```bash
> vite build
vite v5.4.21 building for production...
✓ 38 modules transformed.
dist/index.html                   0.82 kB │ gzip:  0.47 kB
dist/assets/index-CuA2Ghrl.css   31.86 kB │ gzip:  7.72 kB
dist/assets/index-Dx91nHGb.js   157.74 kB │ gzip: 50.94 kB
✓ built in 4.54s
```
**Result:** Clean compilation with 0 errors and 0 warnings.

---

## 5. Next Step: Stage 4 (Reusable UI Components & Modals)

In **Stage 4**, we will convert the DOM HTML templates into reusable, beginner-friendly React functional components:
1. `src/components/common/DockNav.jsx`: Floating capsule pill dock, dropdown menu drawer, and theme button.
2. `src/components/common/Sidebar.jsx`: App navigation sidebar, logo, active route highlighting, user profile badge, and sign-out button.
3. `src/components/common/RoomCard.jsx`: Classroom card with status badge, capacity, free-until timer, facility chips, and "View Details" trigger.
4. `src/components/common/Modal.jsx` & `Toast.jsx`: Glass dialog wrapper with Escape / backdrop-click listeners.
5. `src/components/modals/SignInModal.jsx`: 8-digit ID login dialog with quick-fill demo chips.
6. `src/components/modals/RoomDetailModal.jsx`: 8:00 AM – 6:00 PM timeline occupancy bar.
7. `src/components/modals/BookingModal.jsx`: Slot reservation form with duration dropdown and validation errors.

> **Execution paused:** Awaiting your confirmation before beginning Stage 4.

