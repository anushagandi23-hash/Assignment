import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShowProvider } from './context/ShowContext';
import { BookingProvider } from './context/BookingContext';
import { HomePage } from './pages/HomePage';
import { BookingPage } from './pages/BookingPage';
import { AdminPage } from './pages/AdminPage';
import { SignInPage } from './pages/SignInPage';
import { LoginPage } from './pages/LoginPage';
import './App.css';

// Protected Route Component for authenticated users
const ProtectedRoute: React.FC<{ element: React.ReactNode; requiredRole?: 'admin' | 'user' }> = ({
  element,
  requiredRole,
}) => {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{element}</>;
};

// Auth Routes Component (shows login/signin only if not authenticated)
const AuthRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { isAuthenticated, userRole } = useAuth();

  if (isAuthenticated) {
    // Redirect to appropriate page based on role
    return <Navigate to={userRole === 'admin' ? '/admin' : '/home'} replace />;
  }

  return <>{element}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Auth Routes - shown only when not authenticated */}
      <Route path="/" element={<AuthRoute element={<LoginPage />} />} />
      <Route path="/signin" element={<AuthRoute element={<SignInPage />} />} />
      <Route path="/login" element={<AuthRoute element={<LoginPage />} />} />

      {/* Protected Routes - shown only when authenticated */}
      <Route path="/home" element={<ProtectedRoute element={<HomePage />} />} />
      <Route path="/booking/:showId" element={<ProtectedRoute element={<BookingPage />} />} />
      <Route path="/admin" element={<ProtectedRoute element={<AdminPage />} requiredRole="admin" />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ShowProvider>
          <BookingProvider>
            <AppRoutes />
          </BookingProvider>
        </ShowProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
