# VacanSee — Smart Vacant Classroom Finder
> **"Turn Empty Classrooms Into Productive Spaces."**  
> An autonomous campus classroom occupancy, scheduling, and reservation platform inspired by the Nothing OS design aesthetic. Built with React 18, Vite, and Tailwind CSS.

---

## 📌 1. Project Overview & Problem Statement

College campuses face a persistent daily challenge: hundreds of classrooms sit completely empty between scheduled lectures, during canceled classes, and during study blocks, while students, student clubs, and faculty struggle to locate available rooms for quiet study, team collaboration, department meetings, or workshops.

**VacanSee** is a modern, real-time campus room occupancy and reservation system designed to solve campus classroom underutilization without requiring expensive physical IoT sensors or complex cloud bloat.

### 🏫 Campus Scope & Key Metrics
- **40 Academic Buildings** (Building 01 through Building 40)
- **3 Floors per Building** (Ground, 1st, and 2nd Floor)
- **8 Rooms per Floor** = **24 Classrooms per Building**
- **960 Total Monitored Classrooms** campus-wide
- **Campus Operating Hours:** 8:00 AM – 6:00 PM (Monday – Friday)
- **Campus Lunch Break:** 1:00 PM – 2:00 PM (100% of rooms free from lectures)
- **Deterministic Occupancy:** ~48% realistic lecture density across campus

---

## 🏛️ 2. System Architecture & Tech Stack

VacanSee is structured as a modular Single Page Application (SPA) using React 18 and Vite:

- **Frontend Core:** React 18 (Functional Components, Hooks)
- **Build & Dev Tooling:** Vite 5 (Hot Module Replacement, ES modules)
- **Routing:** React Router v6 (`HashRouter` for zero-configuration static deployment)
- **Styling:** Custom CSS with CSS Custom Properties, Flexbox, CSS Grid, and Tailwind CSS
- **State Management:** React Context API (`AuthContext`, `ReservationContext`, `ThemeContext`)
- **Storage:** Browser `localStorage` (`cs_user`, `cs_res`, `cs_rep`, `cs_theme`)
- **Typography:** `Arial Black`, `Karla`, `Space Mono`, `Doto`

### 📁 Directory Layout
```
VacanSee/
├── .github/workflows/deploy.yml   # Automatic GitHub Pages CI/CD workflow
├── index.html                     # Vite single-page application entry point
├── package.json                   # Project scripts and dependencies
├── vite.config.js                 # Vite bundler configuration (base: './')
├── public/                        # Static assets (campus photography)
├── src/
│   ├── main.jsx                   # React root render
│   ├── App.jsx                    # Routing table & context provider wrapper
│   ├── index.css                  # Global Tailwind & base styling
│   ├── assets/                    # Bundled images & media
│   ├── data/                      # Pure JavaScript business logic modules
│   │   ├── roomsData.js           # 960 classroom generator & metadata
│   │   ├── usersData.js           # Demo user accounts & RBAC rules
│   │   └── scheduleEngine.js      # SimpleHash deterministic schedule algorithm
│   ├── context/                   # Shared application state
│   │   ├── AuthContext.jsx        # Login, logout, user session persistence
│   │   ├── ReservationContext.jsx # Room booking, conflict checks, toasts
│   │   └── ThemeContext.jsx       # Dark / Light theme toggle & storage
│   ├── hooks/                     # Custom React hooks
│   │   ├── useCurrentTime.js      # 30-sec campus clock & time simulator
│   │   └── useCountUp.js          # Animated numeric statistics counter
│   ├── components/
│   │   ├── common/                # DockNav, Sidebar, RoomCard, Pill, Modal, Toast
│   │   ├── layout/                # AppLayout shell (Sidebar + Main viewport)
│   │   └── modals/                # SignInModal, RoomDetailModal, BookingModal
│   ├── pages/                     # Full page views
│   │   ├── Home.jsx               # Landing page with Nothing OS hero & stats
│   │   ├── Dashboard.jsx          # Live classroom search with multi-filters
│   │   ├── Timetable.jsx          # Mon–Fri 8 AM–5 PM weekly lecture schedule
│   │   ├── Reservations.jsx       # Personal booking list & cancellation
│   │   ├── Report.jsx             # Maintenance & facility issue ticketing
│   │   └── Settings.jsx           # Time simulator, theme switch, user profile
│   └── styles/
│       └── vacansee.css           # Complete Nothing OS design system stylesheet
```

---

## ⚙️ 3. Algorithmic Schedule Engine & Business Rules

### 3.1 Procedural 960 Classroom Generation (`roomsData.js`)
Classrooms are generated on demand from mathematical indices without storing massive static arrays:
- Room Index: `1` to `960`
- Building Number: `Math.floor((i - 1) / 24) + 1` (1 to 40)
- Floor Number: `Math.floor(((i - 1) % 24) / 8)` (0 to 2)
- Room Number: `Building*100 + Floor*10 + (RoomIndex + 1)` (e.g. Room 101, Room 215, Room 4028)
- Capacities: Evenly distributed between 20 and 120 seats
- Room Types: Lecture Hall, Seminar Room, Computer Lab, Discussion Room, Smart Classroom
- Facilities: Wi-Fi, Projector, Smart Board, AC, Audio System, Power Outlets

### 3.2 Deterministic Timetable (`scheduleEngine.js`)
To produce realistic, persistent lecture timetables that remain identical on page reloads without a database, the system uses an integer hash function:
```javascript
// Integer hash based on room number, day of week, and time slot
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
```
- A lecture is scheduled if `(simpleHash(...) % 100) < 48` (~48% campus occupancy).
- The 1:00 PM – 2:00 PM lunch slot is unconditionally vacant across all 960 rooms.
- Before 8:00 AM, after 6:00 PM, and on weekends, rooms report `Closed`.

### 3.3 Collision Detection & Reservation Validation
When booking a classroom, the system checks:
1. **Closing Hour:** Start time + duration cannot exceed 6:00 PM (1080 minutes).
2. **Timetable Collision:** Cannot overlap with an existing deterministic lecture.
3. **Reservation Collision:** Cannot overlap with another active user reservation.
4. **Capacity Limit:** Group size cannot exceed the room's maximum capacity.
5. **Purpose Privilege:** Booking purpose requires the user's role authorization.

---

## 🛡️ 4. Role-Based Access Control (RBAC) & Demo Accounts

The system implements multi-tier institutional authorization:

| Registration ID | Name | Institutional Role | Level | Booking Permissions | Max Booking |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **`24005678`** | Faculty User | **Professor** | 1 | Meetings, Presentations, Interviews, Clubs | **3 Hours** (180 min) |
| **`23001234`** | Student User | **Student** | 0 | Search & view vacant rooms *(Cannot reserve)* | — |
| **`19000101`** | Dr. Meera Nair | **HOD** | 2 | All above + Department Workshops | **4 Hours** (240 min) |
| **`18000202`** | Dr. Rahul Verma | **HOS** | 2 | All above + School Workshops | **4 Hours** (240 min) |
| **`17000303`** | Prof. Anita Desai | **Dean** | 3 | All institutional purposes across campus | **8 Hours** (480 min) |
| **`10000001`** | Campus Admin | **Admin** | 3 | Full administrative booking & blocking | **8 Hours** (480 min) |

*Quick-Fill:* In the Sign-In modal dialog, users can click on the role chips at the bottom to autofill the ID instantly.

---

## 🎨 5. Nothing OS Visual Design System

VacanSee's user interface is crafted to evoke the Nothing OS hardware and software identity:
- **Obsidian Dark Surface (`#111315`)** with subtle atmospheric ambient orange glow blooms.
- **Warm Sand Light Mode (`#f8f4ec`)** with dark obsidian text for crisp daylight reading.
- **Signal Amber Accents (`#ea580c` / `#f97316`)** for active buttons, focus outlines, and badges.
- **Display Typography:** Heavy display typography (`Arial Black` / `Karla 900`) with tight leading (`0.94`) and negative letter tracking (`-0.04em`).
- **Technical Monospace:** `Space Mono` and `Doto` for room numbers, IDs, and timestamps.
- **Pill & Capsule Geometry:** Fully rounded pill navigation dock, badges, and status pills.
- **Zero-Scroll Viewport Lock:** The landing page dynamically scales within `100vh` to eliminate vertical scrolling while filling all screen space.

---

## 🚦 6. Application Routes

| Route | View | Protected | Description |
| :--- | :--- | :---: | :--- |
| `/#/home` | `Home.jsx` | No | Landing page with floating capsule dock, hero typography, and animated counters |
| `/#/dashboard` | `Dashboard.jsx` | Yes | Real-time classroom finder with multi-filter search and room cards |
| `/#/timetable` | `Timetable.jsx` | Yes | 5-day Mon–Fri 8 AM–5 PM weekly schedule table with building switcher |
| `/#/reservations` | `Reservations.jsx`| Yes | Personal reservation manager with status pills and cancellation button |
| `/#/report` | `Report.jsx` | Yes | Facility issue submission form (projector, AC, cleanliness, electrical) |
| `/#/settings` | `Settings.jsx` | Yes | Simulated campus time tester, theme switcher, and user profile |

---

## 🚀 7. Quick Start & Local Commands

```bash
# 1. Clone the repository
git clone https://github.com/alokp23/VacanSee.git
cd VacanSee

# 2. Install dependencies
npm install

# 3. Start local development server (Vite)
npm run dev

# 4. Open in browser:
# http://localhost:5173/#/home

# 5. Build for production
npm run build
```

---

## 🌐 8. Deployed Link

- **Live Web Application:** [https://alokp23.github.io/VacanSee/](https://alokp23.github.io/VacanSee/)
- **GitHub Repository:** [https://github.com/alokp23/VacanSee](https://github.com/alokp23/VacanSee)

---

## 👤 Author
- **Alok Patel** ([@alokp23](https://github.com/alokp23))
- 3rd Semester Web Development Project
