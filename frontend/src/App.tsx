import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ShowProvider } from './context/ShowContext';
import { BookingProvider } from './context/BookingContext';
import { HomePage } from './pages/HomePage';
import { BookingPage } from './pages/BookingPage';
import { AdminPage } from './pages/AdminPage';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ShowProvider>
          <BookingProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/booking/:showId" element={<BookingPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BookingProvider>
        </ShowProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
