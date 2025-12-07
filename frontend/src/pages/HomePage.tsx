import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ShowCard } from '../components/ShowCard';
import { Alert } from '../components/Alert';
import { useShows } from '../context/ShowContext';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { shows, loading, error, fetchShows } = useShows();
  const { isAuthenticated, userRole, login, logout } = useAuth();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    fetchShows();
  }, []);

  // Debug: Log auth state
  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, userRole });
  }, [isAuthenticated, userRole]);

  const handleSelectShow = (showId: number) => {
    navigate(`/booking/${showId}`);
  };

  return (
    <Layout title="Browse Available Shows">
      {!isAuthenticated && (
        <div className="auth-prompt">
          <Alert type="info" message="Please select a role to continue" />
          <div className="role-selector">
            <button
              className="btn btn-secondary"
              onClick={() => login('user')}
            >
              👤 Continue as User
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                login('admin');
                navigate('/admin');
              }}
            >
              🔐 Continue as Admin
            </button>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <>
          <div className="actions">
            {userRole === 'admin' && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/admin')}
              >
                ⚙️ Admin Dashboard
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => logout()}
            >
              🚪 Logout
            </button>
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setAlertMessage(null)}
            />
          )}

          {loading && <div className="loading">Loading shows...</div>}

          {!loading && shows.length === 0 && (
            <div className="empty-state">
              <p>📭 No shows available at the moment</p>
              {userRole === 'admin' && (
                <p>Create one from the admin dashboard</p>
              )}
            </div>
          )}

          <div className="shows-grid">
            {shows.map(show => (
              <ShowCard
                key={show.id}
                show={show}
                onSelect={handleSelectShow}
              />
            ))}
          </div>
        </>
      )}
    </Layout>
  );
};
