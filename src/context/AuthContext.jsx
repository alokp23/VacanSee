import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  USERS,
  ROLE_LABELS,
  ROLE_LEVELS,
  ACCESS_DESCRIPTIONS,
  getUserLevel,
  getMaxBookingMinutes,
  isUserAdmin,
  getAvailablePurposes
} from '../data/usersData.js';

/**
 * VacanSee - Authentication Context & RBAC State
 * 
 * Manages the current logged-in user, 8-digit registration ID validation,
 * institutional permissions, and localStorage persistence under 'cs_user'.
 */

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Read saved user from localStorage
  const [user, setUserState] = useState(() => {
    try {
      const saved = localStorage.getItem('cs_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure user exists in authorized demo accounts list
        if (parsed && USERS.some(u => u.id === parsed.id)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Could not read cs_user from localStorage:', error);
    }
    return null;
  });

  // Sync user changes to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('cs_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('cs_user');
      }
    } catch (error) {
      console.error('Failed to save cs_user to localStorage:', error);
    }
  }, [user]);

  /**
   * Validates and signs in a user via their 8-digit registration ID.
   * @param {string} registrationId 
   * @returns {{ success: boolean, error?: string, user?: Object }}
   */
  const login = (registrationId) => {
    const cleanId = String(registrationId || '').trim();

    // Validation Rule 1: Exactly 8 digits
    if (!/^\d{8}$/.test(cleanId)) {
      return {
        success: false,
        error: 'Please enter your 8-digit Registration ID.'
      };
    }

    // Validation Rule 2: Exists in authorized accounts
    const matchedUser = USERS.find(u => u.id === cleanId);
    if (!matchedUser) {
      return {
        success: false,
        error: 'Invalid Registration ID. Please select one of the demo IDs.'
      };
    }

    setUserState(matchedUser);
    return {
      success: true,
      user: matchedUser
    };
  };

  /**
   * Signs out the current user.
   */
  const logout = () => {
    setUserState(null);
  };

  // Derived role properties
  const userLevel = getUserLevel(user);
  const isAdmin = isUserAdmin(user);
  const maxBookingMinutes = getMaxBookingMinutes(userLevel);
  const allowedPurposes = getAvailablePurposes(userLevel);
  const accessDescription = ACCESS_DESCRIPTIONS[userLevel] || ACCESS_DESCRIPTIONS[0];
  const roleLabel = user ? (ROLE_LABELS[user.role] || user.role) : '';

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      userLevel,
      isAdmin,
      maxBookingMinutes,
      allowedPurposes,
      accessDescription,
      roleLabel,
      ROLE_LABELS,
      USERS,
      demoUsers: USERS,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to easily access auth state and methods in any component
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

