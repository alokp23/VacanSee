import React from 'react';

/**
 * VacanSee - Facility Chips Component
 * 
 * Renders a horizontal flex row of tags indicating classroom amenities
 * (e.g. Wi-Fi, Projector, AC, Whiteboard, Power Outlets, Smart Board).
 * 
 * @param {{
 *   facilities?: string[],
 *   className?: string
 * }} props
 */
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

