import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useReservation } from '../../context/ReservationContext.jsx';

/**
 * VacanSee - Protected Route Guard
 * 
 * Guards authenticated views:
 * - If user is signed in: renders children components normally.
 * - If user is not signed in: redirects to '/home', opens the sign-in modal,
 *   and provides a clear toast notification.
 * 
 * @param {{
 *   children: React.ReactNode
 * }} props
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const { openModal, showToast } = useReservation();

  useEffect(() => {
    if (!isAuthenticated) {
      showToast('Please sign in with your 8-digit Registration ID.');
      openModal('signin');
    }
  }, [isAuthenticated, openModal, showToast]);

  if (!isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

