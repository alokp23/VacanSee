import React, { useEffect } from 'react';

/**
 * VacanSee - Glassmorphic Modal Dialog Container
 * 
 * Provides an accessible centered dialog container with dark blurred backdrop overlay.
 * Handles clicking the background overlay to dismiss, and automatically listens for the
 * Escape key to close cleanly with proper event listener cleanup.
 * 
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   children: React.ReactNode,
 *   className?: string
 * }} props
 */
export default function Modal({ isOpen, onClose, children, className = '' }) {
  // Listen for Escape key press to close dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle click on backdrop overlay (outside the modal box)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="ov on"
      id="ov"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className={`md ${className}`.trim()} id="md">
        <button
          type="button"
          className="x"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

