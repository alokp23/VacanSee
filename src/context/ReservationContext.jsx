import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { isRoomVacant, getCurrentTime, CAMPUS_CLOSE_MINUTE, formatTime } from '../data/scheduleEngine.js';

/**
 * VacanSee - Reservation & Application State Context
 * 
 * Manages confirmed room reservations, campus issue reports, search filter state,
 * modal dialog controls, and toast feedback notifications.
 * Preserves localStorage keys: 'cs_res', 'cs_rep', 'cs_b', and 'cs_sim'.
 */

const ReservationContext = createContext();

export function ReservationProvider({ children }) {
  // 1. Reservations State (cs_res)
  const [reservations, setReservations] = useState(() => {
    try {
      const saved = localStorage.getItem('cs_res');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Could not read cs_res from localStorage:', e);
      return [];
    }
  });

  // 2. Issue Reports State (cs_rep)
  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem('cs_rep');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Could not read cs_rep from localStorage:', e);
      return [];
    }
  });

  // 3. Simulated Demo Time (cs_sim)
  const [simTime, setSimTimeState] = useState(() => {
    try {
      const saved = localStorage.getItem('cs_sim');
      return saved ? JSON.parse(saved) : '';
    } catch (e) {
      return '';
    }
  });

  // 4. Room Finder Filter State
  const [filters, setFiltersState] = useState(() => {
    let savedBuilding = '';
    try {
      const saved = localStorage.getItem('cs_b');
      if (saved) savedBuilding = JSON.parse(saved);
    } catch (e) {}

    return {
      b: savedBuilding,
      start: 'now',
      cap: '0',
      dur: '60',
      pur: '',
      fac: []
    };
  });

  // 5. Active Modal State ({ type: 'signin' | 'detail' | 'booking', data?: any } | null)
  const [activeModal, setActiveModal] = useState(null);

  // 6. Toast Notification State ({ message: string, visible: boolean })
  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimerRef = useRef(null);

  // Persist reservations
  useEffect(() => {
    try {
      localStorage.setItem('cs_res', JSON.stringify(reservations));
    } catch (e) {
      console.error('Failed to save cs_res to localStorage:', e);
    }
  }, [reservations]);

  // Persist reports
  useEffect(() => {
    try {
      localStorage.setItem('cs_rep', JSON.stringify(reports));
    } catch (e) {
      console.error('Failed to save cs_rep to localStorage:', e);
    }
  }, [reports]);

  // Persist simTime
  useEffect(() => {
    try {
      localStorage.setItem('cs_sim', JSON.stringify(simTime));
    } catch (e) {
      console.error('Failed to save cs_sim to localStorage:', e);
    }
  }, [simTime]);

  // Persist building selection
  useEffect(() => {
    try {
      localStorage.setItem('cs_b', JSON.stringify(filters.b));
    } catch (e) {
      console.error('Failed to save cs_b to localStorage:', e);
    }
  }, [filters.b]);

  /**
   * Display a temporary floating toast notification
   * @param {string} message 
   */
  const showToast = (message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2600);
  };

  /**
   * Modal dialog helpers
   */
  const openModal = (type, data = null) => {
    setActiveModal({ type, data });
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  /**
   * Updates filter state and persists building selection
   */
  const updateFilters = (newValuesOrUpdater) => {
    setFiltersState(prev => {
      const updated = typeof newValuesOrUpdater === 'function'
        ? newValuesOrUpdater(prev)
        : { ...prev, ...newValuesOrUpdater };
      return updated;
    });
  };

  /**
   * Sets simulated demo time
   */
  const setSimTime = (time) => {
    setSimTimeState(time || '');
  };

  /**
   * Adds a new reservation after checking collision detection and campus hours.
   * @param {Object} bookingDetails 
   * @param {Object} room 
   * @returns {{ success: boolean, error?: string, reservation?: Object }}
   */
  const addReservation = (bookingDetails, room) => {
    const { startMinute, durationMinutes, groupSize, purpose, user } = bookingDetails;
    const currentTime = getCurrentTime(simTime);

    // Rule 1: Campus closing time check (6:00 PM / 1080 min)
    if (startMinute + durationMinutes > CAMPUS_CLOSE_MINUTE) {
      return {
        success: false,
        error: 'Campus closes at 6:00 PM. Choose an earlier start or shorter duration.'
      };
    }

    // Rule 2: Conflict & double-booking prevention check
    const isVacant = isRoomVacant(room, startMinute, durationMinutes, currentTime, reservations);
    if (!isVacant) {
      return {
        success: false,
        error: 'That slot overlaps a lecture or another booking. Pick a free time from the timeline.'
      };
    }

    // Create reservation record matching original format
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

    return {
      success: true,
      reservation: newBooking
    };
  };

  /**
   * Cancels an existing reservation by ID.
   * @param {string} reservationId 
   */
  const cancelReservation = (reservationId) => {
    setReservations(prev => prev.filter(r => r.id !== reservationId));
    showToast('Reservation cancelled');
  };

  /**
   * Submits a classroom status issue report.
   * @param {Object} reportDetails 
   */
  const addReport = (reportDetails) => {
    const { room, type, txt, user } = reportDetails;
    const newReport = {
      room,
      type,
      txt,
      t: Date.now(),
      by: user.id,
      name: user.name
    };

    setReports(prev => [...prev, newReport]);
    showToast('Report submitted. Thank you!');
    return { success: true };
  };

  /**
   * Clears all reservations and reports (used in Settings demo reset).
   */
  const clearAllData = () => {
    setReservations([]);
    setReports([]);
    showToast('Data cleared');
  };

  return (
    <ReservationContext.Provider value={{
      reservations,
      reports,
      simTime,
      filters,
      activeModal,
      toast,
      openModal,
      closeModal,
      showToast,
      updateFilters,
      setSimTime,
      addReservation,
      cancelReservation,
      addReport,
      clearAllData
    }}>
      {children}
    </ReservationContext.Provider>
  );
}

/**
 * Custom hook to easily access reservations, reports, and modal state
 */
export function useReservation() {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
}

