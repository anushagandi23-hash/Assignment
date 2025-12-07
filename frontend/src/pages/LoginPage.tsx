import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import './AuthPage.css';

export const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API call to authenticate user
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     email: formData.email,
      //     password: formData.password,
      //   }),
      // });

      // For now, simulate successful login
      console.log('Login attempt:', formData);
      
      // Login as user
      login('user');
      navigate('/');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'user') => {
    login(role);
    navigate(role === 'admin' ? '/admin' : '/');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Welcome back! Sign in to your account</p>

        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-divider">OR</div>

        <div className="quick-login">
          <p className="quick-login-text">Quick Login (Demo)</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleQuickLogin('user')}
          >
            👤 Login as User
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleQuickLogin('admin')}
          >
            👨‍💼 Login as Admin
          </button>
        </div>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signin" className="auth-link">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
};
