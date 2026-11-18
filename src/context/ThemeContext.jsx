import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * VacanSee - Theme Context (Dark / Light Mode)
 * 
 * Manages the Nothing OS Obsidian dark and light themes, persists the user's
 * choice in localStorage under 'cs_theme', and updates the HTML data-theme attribute.
 */

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Read saved theme from localStorage, or default to system preference or 'dark'
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('cs_theme');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Could not read cs_theme from localStorage:', error);
    }

    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark'; // VacanSee default is obsidian dark
  });

  // Keep <html data-theme="..."> and localStorage synchronized whenever theme changes
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('cs_theme', JSON.stringify(theme));
    } catch (error) {
      console.error('Failed to save cs_theme to localStorage:', error);
    }
  }, [theme]);

  // Toggle between dark and light
  const toggleTheme = () => {
    setThemeState(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Set explicit theme
  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      isDark: theme === 'dark',
      toggleTheme,
      setTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to easily access theme in any component
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

