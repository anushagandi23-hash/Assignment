import React from 'react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">🎫 Modex</h1>
          <p className="tagline">Ticket Booking System</p>
        </div>
      </header>

      {title && (
        <div className="page-title">
          <h2>{title}</h2>
        </div>
      )}

      <main className="main-content">
        {children}
      </main>

      <footer className="footer">
        <p>&copy; 2024 Modex. All rights reserved.</p>
      </footer>
    </div>
  );
};
