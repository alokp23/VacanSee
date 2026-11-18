# VacanSee — Smart Vacant Classroom Finder

> **Turn Empty Classrooms Into Productive Spaces.**  
> A lightweight, autonomous campus room occupancy and scheduling system with a Nothing-inspired aesthetic.

---

## 📌 Overview

**VacanSee** is a responsive web application designed for universities and colleges to solve campus classroom underutilization. Instead of wandering through corridors looking for an empty room between lectures, students and faculty can instantly discover free classrooms, inspect real-time weekly timetables, and reserve spaces for study sessions, meetings, or group collaboration in under a minute.

Developed as a **3rd-Semester Web Development Project**, the codebase is crafted with clear, explainable, and dependency-free Vanilla HTML, CSS, and JavaScript.

---

## ✨ Key Features

- **⚡ Real-Time Classroom Telemetry**:
  - Live vacancy calculation across 50 classrooms in 5 campus academic blocks.
  - Smart status tags: `Vacant`, `Frees up soon` (< 30 min), `In Lecture` (Busy), or `After Hours`.
- **📅 Conflict-Free Room Reservations**:
  - Instant booking modal with customizable durations (15m, 30m, 45m, 60m, 90m, 120m, 180m).
  - Validation engine preventing double-booking during active lectures or existing reservations.
- **▥ Campus Timetable Explorer**:
  - Full weekly timetable matrix filtered by building, room, and day of the week (Monday – Saturday, 08:00 to 18:00).
- **🌓 Nothing OS Inspired Obsidian & Amber UI**:
  - Deep charcoal `#111315` and vibrant amber `#f97316` design.
  - Floating capsule dock navbar with smooth drawer overlay.
  - Ambient orange corner glows and bold Karla typography.
  - One-click Light / Dark mode toggle with persistent preferences.
- **🛡️ Role-Based Access Control (RBAC)**:
  - Multi-tier authentication supporting **Student**, **Faculty**, and **Admin** permissions.
  - Purpose validation (Faculty/Admin can reserve for *Lectures* & *Exams*; Students for *Self Study* & *Group Work*).
- **🚩 Campus Issue Reporting & Quick Contact**:
  - Built-in form to report classroom maintenance problems (e.g., projector malfunction, AC issues).

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Semantic Elements, CSS3 (Custom Properties, CSS Grid, Flexbox, Fluid Clamps)
- **Scripting**: Vanilla JavaScript (ES6+, DOM API, LocalStorage state management)
- **Typography**: Google Fonts (*Karla*, *Doto*, *Silkscreen*, *Space Mono*)
- **Icons**: Inline scalable SVGs (Lucide / Feather inspired)
- **External Dependencies**: **Zero** (no npm packages, no heavy frontend frameworks required)

---

## 🚀 Getting Started

### Option 1: Direct File Open
Simply clone or download this repository and double-click `index.html` in your browser:
```bash
git clone https://github.com/alokp23/VacanSee.git
cd VacanSee
start index.html
```

### Option 2: Local HTTP Server (Recommended)
Run a local Python server for accurate origin routing and live testing:
```bash
# Python 3.x
python -m http.server 8000

# Open in browser:
# http://localhost:8000/
```

Or using Node.js:
```bash
npx serve .
```

---

## 📁 Repository Structure

```
VacanSee/
├── index.html                 # Main single-page application & landing page
├── style.css                  # Complete responsive styling & Nothing theme
├── script.js                  # Core business logic, routing & storage
├── classroom.jpg              # High-resolution campus hero image
├── PROJECT_REPORT.md          # Comprehensive academic project report (ER diagrams, SQL, Viva notes)
├── README.md                  # Project overview & documentation
└── .gitignore                 # Git ignore rules for clean repository
```

---

## 📄 Academic Project Report

- 📘 **[PROJECT_REPORT.md](./PROJECT_REPORT.md)**: Full academic project report designed for faculty evaluation, covering system requirements, relational database design (PostgreSQL ER diagram), concurrency control, WCAG accessibility, and full-stack architecture.

---

## 👤 Author

- **Alok Patel** ([@alokp23](https://github.com/alokp23))
- 3rd Semester Web Development Project

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
