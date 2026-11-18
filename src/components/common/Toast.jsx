import React from 'react';
import { useReservation } from '../../context/ReservationContext.jsx';

/**
 * VacanSee - Floating Notification Toast Component
 * 
 * Subscribes to the ReservationContext toast state and renders a smooth
 * popup notification banner that automatically transitions into view when active.
 */
export default function Toast() {
  const { toast } = useReservation();

  if (!toast || !toast.message) return null;

  return (
    <div
      className={`toast ${toast.visible ? 'on' : ''}`}
      id="toast"
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  );
}

