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
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');

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

  // Get unique locations from all shows
  const fromLocations = Array.from(new Set(shows.map(s => s.from_location))).sort();
  const toLocations = Array.from(new Set(shows.map(s => s.to_location))).sort();

  // Filter shows based on selected locations
  const filteredShows = shows.filter(show => {
    const matchesFrom = !fromLocation || show.from_location === fromLocation;
    const matchesTo = !toLocation || show.to_location === toLocation;
    return matchesFrom && matchesTo;
  });

  return (
    <Layout title="Bus Tickets">
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

      <div className="search-section">
        <div className="search-group">
          <label htmlFor="from">From:</label>
          <select
            id="from"
            value={fromLocation}
            onChange={(e) => setFromLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {fromLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="search-group">
          <label htmlFor="to">To:</label>
          <select
            id="to"
            value={toLocation}
            onChange={(e) => setToLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {toLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-search"
          onClick={() => {
            // Filter is already applied via filteredShows
          }}
        >
          🔍 Search
        </button>
      </div>

      {loading && <div className="loading">Loading shows...</div>}

      {!loading && filteredShows.length === 0 && (
        <div className="empty-state">
          <p>📭 No buses available for this route</p>
          {userRole === 'admin' && (
            <p>Create one from the admin dashboard</p>
          )}
        </div>
      )}

      <div className="shows-grid">
        {filteredShows.map(show => (
          <ShowCard
            key={show.id}
            show={show}
            onSelect={handleSelectShow}
          />
        ))}
      </div>
    </Layout>
  );
};
