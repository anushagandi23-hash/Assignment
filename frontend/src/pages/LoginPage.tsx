import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import './AuthPage.css';

// Admin credentials - only one admin account
const ADMIN_CREDENTIALS = {
  username: 'admin',
  email: 'admin@modex.com',
  password: 'Admin@123',
};

export const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    identifier: '', // Can be either username or email
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginAsAdmin, setLoginAsAdmin] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Helper function to check if string is email
  const isEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const identifier = formData.identifier.trim();
    if (!identifier) {
      setError('Username or Email is required');
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      if (loginAsAdmin) {
        // Admin login validation
        const isValidAdmin =
          (identifier === ADMIN_CREDENTIALS.username || identifier === ADMIN_CREDENTIALS.email) &&
          formData.password === ADMIN_CREDENTIALS.password;

        if (!isValidAdmin) {
          setError('Invalid admin credentials. Please check username/email and password.');
          setLoading(false);
          return;
        }

        // Admin login successful
        login('admin', {
          id: 'admin-001',
          name: 'Admin User',
          email: ADMIN_CREDENTIALS.email,
          role: 'admin',
          createdAt: new Date().toISOString(),
        });
        navigate('/admin');
      } else {
        // Regular user login
        // Check if identifier is email or username
        const loginType = isEmail(identifier) ? 'email' : 'username';

        // TODO: Replace with actual API call to authenticate user
        // const response = await fetch('/api/auth/login', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     [loginType]: identifier,
        //     password: formData.password,
        //   }),
        // });

        // For now, simulate successful login for regular users
        console.log('User login attempt:', { [loginType]: identifier, password: formData.password });
        
        // Login with user data
        login('user', {
          id: Math.random().toString(36).substr(2, 9),
          name: identifier,
          email: isEmail(identifier) ? identifier : `${identifier}@example.com`,
          role: 'user',
          createdAt: new Date().toISOString(),
        });
        navigate('/home');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'user') => {
    login(role, {
      id: Math.random().toString(36).substr(2, 9),
      name: role === 'admin' ? 'Admin User' : 'Demo User',
      email: role === 'admin' ? 'admin@example.com' : 'user@example.com',
      role: role,
      createdAt: new Date().toISOString(),
    });
    navigate(role === 'admin' ? '/admin' : '/home');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Welcome back! Sign in to your account</p>

        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleLogin} className="auth-form">
          {/* Admin Toggle */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '16px' }}>
              <input
                type="checkbox"
                checked={loginAsAdmin}
                onChange={(e) => {
                  setLoginAsAdmin(e.target.checked);
                  setError('');
                  setFormData({ identifier: '', password: '' });
                }}
                style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Login as Admin
              </span>
            </label>
            {loginAsAdmin && (
              <small style={{ color: '#f39c12', fontSize: '12px', marginBottom: '12px', display: 'block', backgroundColor: '#fef5e7', padding: '8px 12px', borderRadius: '4px' }}>
                ⚠️ Admin Login - Use admin credentials only
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="identifier">
              {loginAsAdmin ? 'Admin Username or Email' : 'Username or Email'}
            </label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleInputChange}
              placeholder={loginAsAdmin ? 'admin or admin@modex.com' : 'johndoe or your@email.com'}
              required
            />
            <small style={{ color: '#999', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {loginAsAdmin 
                ? 'Enter admin username or email' 
                : 'Enter either your username or email address'}
            </small>
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
            {loading ? 'Logging in...' : `Login${loginAsAdmin ? ' as Admin' : ''}`}
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
