import React from 'react';
import Sidebar from '../common/Sidebar.jsx';

/**
 * VacanSee - Authenticated App Shell Layout
 * 
 * Provides the persistent 2-column Nothing OS layout with
 * the sticky left sidebar and scrollable main content viewport.
 * On mobile devices, vacansee.css automatically transitions the
 * sidebar into a fixed bottom navigation bar.
 * 
 * @param {{
 *   currentRoute: string,
 *   children: React.ReactNode
 * }} props
 */
export default function AppLayout({ currentRoute, children }) {
  return (
    <div className="shell" id="app">
      <Sidebar currentRoute={currentRoute} />
      <main className="main" id="view">
        {children}
      </main>
    </div>
  );
}

