import { useState, useEffect } from 'react';
import { getCurrentTime, formatTime, DAYS } from '../data/scheduleEngine.js';

/**
 * VacanSee - Current Campus Time Custom Hook
 * 
 * Tracks real-time campus clock with automatic 30-second interval updates.
 * Supports simulated demo time from Settings, and smoothly falls back to
 * 11:15 AM Monday during weekends or off-campus hours.
 * Cleans up interval timers on unmount to prevent memory leaks.
 * 
 * @param {string} [simulatedTime=""] Optional demo time (e.g. "14:30")
 * @returns {{
 *   m: number,
 *   day: number,
 *   dt: string,
 *   sim: boolean,
 *   formattedTime: string,
 *   dayName: string,
 *   clockLabel: string
 * }}
 */
export function useCurrentTime(simulatedTime = '') {
  const [time, setTime] = useState(() => getCurrentTime(simulatedTime));

  useEffect(() => {
    // Immediately synchronize when simulated time changes
    setTime(getCurrentTime(simulatedTime));

    // Update time every 30 seconds to keep live availability current
    const intervalId = setInterval(() => {
      setTime(getCurrentTime(simulatedTime));
    }, 30000);

    return () => clearInterval(intervalId);
  }, [simulatedTime]);

  const formattedTime = formatTime(time.m);
  const dayName = DAYS[time.day] || 'Mon';
  const clockLabel = `${time.sim ? 'Demo time' : 'Live'} · ${dayName} ${formattedTime}`;

  return {
    ...time,
    formattedTime,
    dayName,
    clockLabel
  };
}

