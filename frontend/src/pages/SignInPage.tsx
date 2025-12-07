import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import './AuthPage.css';

export const SignInPage: React.FC = () => {
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  // Generate a 6-digit verification code
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Simulate sending email with verification code
  const sendVerificationEmail = async (email: string) => {
    const code = generateVerificationCode();
    setGeneratedCode(code);
    
    // Simulate email sending
    console.log(`Verification code sent to ${email}: ${code}`);
    
    // In production, this would call your backend API:
    // const response = await fetch('/api/auth/send-verification', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, code }),
    // });
    
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }
    if (!formData.name.trim()) {
      setError('Full name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email format');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Send verification email
      const emailSent = await sendVerificationEmail(formData.email);
      
      if (emailSent) {
        setSuccess('Verification code sent to your email. Please check your inbox.');
        setStep('verification');
      } else {
        setError('Failed to send verification email. Please try again.');
      }
    } catch (err) {
      setError('Error during signup. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      // Verify the code
      if (verificationCode.trim() === generatedCode) {
        setSuccess('Email verified successfully! Logging you in...');
        
        // Complete registration and auto-login
        setTimeout(() => {
          login('user', {
            id: Math.random().toString(36).substr(2, 9),
            name: formData.username,
            email: formData.email,
            role: 'user',
            createdAt: new Date().toISOString(),
          });
          navigate('/home');
        }, 1500);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    try {
      const emailSent = await sendVerificationEmail(formData.email);
      if (emailSent) {
        setSuccess('New verification code sent to your email!');
        setVerificationCode('');
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {step === 'form' ? (
          <>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join us to book your bus tickets</p>

            {error && <Alert type="error" message={error} />}
            {success && <Alert type="success" message={success} />}

            <form onSubmit={handleSignIn} className="auth-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="johndoe"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>

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

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                {loading ? 'Sending verification...' : 'Continue'}
              </button>
            </form>

            <p className="auth-footer">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Login here
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="auth-title">Verify Email</h1>
            <p className="auth-subtitle">Enter the verification code sent to {formData.email}</p>

            {error && <Alert type="error" message={error} />}
            {success && <Alert type="success" message={success} />}

            <form onSubmit={handleVerifyEmail} className="auth-form">
              <div className="form-group">
                <label htmlFor="verificationCode">Verification Code</label>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  style={{ fontSize: '18px', letterSpacing: '4px', textAlign: 'center' }}
                />
                <small style={{ color: '#999', fontSize: '12px', marginTop: '8px', display: 'block', textAlign: 'center' }}>
                  Check your email for the 6-digit code
                </small>
              </div>

              <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <p style={{ fontSize: '14px', color: '#666', margin: '8px 0' }}>
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textDecoration: 'underline',
                  }}
                >
                  Resend Code
                </button>
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setStep('form');
                setVerificationCode('');
                setError('');
                setSuccess('');
              }}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '10px 16px',
                background: '#f5f5f5',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
              }}
            >
              ← Back to Sign Up
            </button>
          </>
        )}
      </div>
    </div>
  );
};
