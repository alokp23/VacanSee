import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from '../common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useReservation } from '../../context/ReservationContext.jsx';
import { USERS, ROLE_LABELS } from '../../data/usersData.js';

/**
 * VacanSee - Sign In Modal Dialog
 * 
 * Allows users to authenticate using an 8-digit college Registration ID.
 * Features strict numeric input filtering, quick-fill demo ID chips,
 * and seamless integration with AuthContext and ReservationContext.
 * 
 * @param {{
 *   isOpen?: boolean,
 *   onClose?: () => void
 * }} props
 */
export default function SignInModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { activeModal, closeModal, showToast } = useReservation();

  // If props are passed, use them; otherwise pull from ReservationContext
  const isModalOpen = isOpen !== undefined ? isOpen : (activeModal?.type === 'signin');
  const handleClose = onClose || closeModal;

  // Local state for the 8-digit registration ID input and validation error message
  const [registrationId, setRegistrationId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset input and error whenever the modal opens
  useEffect(() => {
    if (isModalOpen) {
      setRegistrationId('');
      setErrorMessage('');
    }
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  // Handles input typing: filters out non-digits and caps length at 8
  const handleInputChange = (e) => {
    const rawValue = e.target.value;
    const numbersOnly = rawValue.replace(/\D/g, '').slice(0, 8);

    if (numbersOnly !== rawValue) {
      setErrorMessage('Use numbers only, no letters or spaces.');
    } else {
      setErrorMessage('');
    }

    setRegistrationId(numbersOnly);
  };

  // Handles quick-fill when clicking any demo user chip
  const handleDemoFill = (id) => {
    setRegistrationId(id);
    setErrorMessage('');
  };

  // Handles sign-in form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Check for complete 8-digit ID
    if (!/^\d{8}$/.test(registrationId)) {
      setErrorMessage('Please enter your 8-digit Registration ID.');
      return;
    }

    // Call login from AuthContext
    const result = login(registrationId);

    if (!result.success) {
      setErrorMessage(result.error || 'Invalid Registration ID.');
      return;
    }

    // On successful login:
    const firstName = result.user.name.split(' ')[0];
    const roleName = ROLE_LABELS[result.user.role] || result.user.role;
    showToast(`Welcome, ${firstName} (${roleName})`);

    // Close modal
    handleClose();

    // If on landing or public page, transition to dashboard
    const currentPath = location.pathname;
    if (!currentPath || currentPath === '/' || currentPath === '/home' || currentPath === '/about' || currentPath === '/how') {
      navigate('/dashboard');
    }
  };

  return (
    <Modal isOpen={isModalOpen} onClose={handleClose}>
      <h2>Sign in to Vacansee</h2>
      <p className="mute" style={{ marginBottom: '14px' }}>
        Enter your 8-digit college Registration ID.
      </p>

      <form className="f" id="lf" noValidate onSubmit={handleSubmit}>
        <label>
          Registration ID
          <input
            id="lId"
            inputMode="numeric"
            maxLength={8}
            autoComplete="off"
            placeholder="23001234"
            value={registrationId}
            onChange={handleInputChange}
            autoFocus
          />
        </label>

        <div className="err" id="lErr">
          {errorMessage}
        </div>

        <button className="btn p" type="submit">
          Sign In
        </button>
      </form>

      <div className="demo">
        <span className="mute">Demo IDs (tap to fill):</span>
        <br />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {USERS.map((user) => (
            <button
              key={user.id}
              type="button"
              className="chip tog cursor-pointer"
              onClick={() => handleDemoFill(user.id)}
            >
              {ROLE_LABELS[user.role]} · {user.id}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
