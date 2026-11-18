import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ReservationProvider } from './context/ReservationContext.jsx';

// Layout & Route Guards
import AppLayout from './components/layout/AppLayout.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

// Modals & Feedback
import SignInModal from './components/modals/SignInModal.jsx';
import RoomDetailModal from './components/modals/RoomDetailModal.jsx';
import BookingModal from './components/modals/BookingModal.jsx';
import Toast from './components/common/Toast.jsx';

// Application Pages
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Timetable from './pages/Timetable.jsx';
import Reservations from './pages/Reservations.jsx';
import Report from './pages/Report.jsx';
import Settings from './pages/Settings.jsx';

/**
 * VacanSee - Root React Application
 * 
 * Features full client-side HashRouter navigation across all views,
 * persistent Nothing OS layout architecture, institutional RBAC guards,
 * and centralized modal dialog orchestration.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ThemeProvider>
          <AuthProvider>
            <ReservationProvider>
              {/* Application Views Routing */}
              <Routes>
                {/* Public Landing Pages */}
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
                <Route path="/about" element={<Home />} />
                <Route path="/how" element={<Home />} />

                {/* Protected Authenticated Pages */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <AppLayout currentRoute="dashboard">
                        <Dashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/timetable"
                  element={
                    <ProtectedRoute>
                      <AppLayout currentRoute="timetable">
                        <Timetable />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reservations"
                  element={
                    <ProtectedRoute>
                      <AppLayout currentRoute="reservations">
                        <Reservations />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/report"
                  element={
                    <ProtectedRoute>
                      <AppLayout currentRoute="report">
                        <Report />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <AppLayout currentRoute="settings">
                        <Settings />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>

              {/* Global Modal Dialogs Host */}
              <SignInModal />
              <RoomDetailModal />
              <BookingModal />

              {/* Global Floating Toast Alerts */}
              <Toast />
            </ReservationProvider>
          </AuthProvider>
        </ThemeProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
