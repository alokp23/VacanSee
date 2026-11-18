import React from 'react';

/**
 * VacanSee - Status Badge Pill Component
 * 
 * Renders status badges matching Nothing OS aesthetic:
 * - 'free': Available (green)
 * - 'soon': Frees up soon within <= 30 min (amber/orange)
 * - 'busy': Occupied by scheduled lecture (red/coral)
 * - 'closed': Completed or after hours (slate/gray)
 * 
 * @param {{
 *   status?: 'free' | 'soon' | 'busy' | 'closed',
 *   label?: string,
 *   className?: string,
 *   children?: React.ReactNode
 * }} props
 */
export default function Pill({ status = 'free', label, className = '', children }) {
  const content = label || children;
  return (
    <span className={`pill ${status} ${className}`.trim()}>
      {content}
    </span>
  );
}

