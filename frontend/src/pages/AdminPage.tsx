import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Alert } from '../components/Alert';
import { useShows } from '../context/ShowContext';
import { useAuth } from '../context/AuthContext';
import './AdminPage.css';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { userRole, logout } = useAuth();
  const { shows, loading, error, createShow, fetchShows } = useShows();
  
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    totalSeats: 40,
  });
  
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/');
      return;
    }
    fetchShows();
  }, [userRole]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalSeats' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setAlertMessage('Please enter a show name');
      setAlertType('warning');
      return;
    }

    if (!formData.startTime) {
      setAlertMessage('Please select a start time');
      setAlertType('warning');
      return;
    }

    if (formData.totalSeats <= 0 || formData.totalSeats > 1000) {
      setAlertMessage('Total seats must be between 1 and 1000');
      setAlertType('warning');
      return;
    }

    try {
      await createShow(formData.name, formData.startTime, formData.totalSeats);
      setAlertMessage('Show created successfully! 🎉');
      setAlertType('success');
      
      // Reset form
      setFormData({
        name: '',
        startTime: '',
        totalSeats: 40,
      });

      // Refresh shows list
      await fetchShows();
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : 'Failed to create show');
      setAlertType('error');
    }
  };

  return (
    <Layout title="Admin Dashboard">
      <div className="admin-container">
        <div className="admin-header">
          <h2>Create New Show</h2>
          <button className="btn btn-logout" onClick={() => {
            logout();
            navigate('/');
          }}>
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

        {alertMessage && (
          <Alert
            type={alertType as any}
            message={alertMessage}
            onClose={() => setAlertMessage(null)}
          />
        )}

        <div className="admin-grid">
          <div className="form-section">
            <form onSubmit={handleSubmit} className="create-show-form">
              <div className="form-group">
                <label htmlFor="name">Show Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Bus: Mumbai to Delhi"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="startTime">Start Time *</label>
                <input
                  type="datetime-local"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="totalSeats">Total Seats *</label>
                <input
                  type="number"
                  id="totalSeats"
                  name="totalSeats"
                  value={formData.totalSeats}
                  onChange={handleInputChange}
                  min="1"
                  max="1000"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : '+ Create Show'}
              </button>
            </form>
          </div>

          <div className="shows-section">
            <h3>Active Shows ({shows.length})</h3>
            {loading && !shows.length && (
              <div className="loading">Loading shows...</div>
            )}

            {shows.length === 0 && !loading && (
              <div className="empty-state">
                <p>No shows created yet</p>
              </div>
            )}

            <div className="shows-list">
              {shows.map(show => (
                <div key={show.id} className="show-item">
                  <div className="show-details">
                    <h4>{show.name}</h4>
                    <p className="show-meta">
                      📅 {new Date(show.start_time).toLocaleDateString()} at{' '}
                      {new Date(show.start_time).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="show-meta">
                      💺 Total: {show.total_seats} | Available: {show.available_seats || 0} | Booked: {show.booked_seats || 0}
                    </p>
                  </div>
                  <div className="show-stats">
                    <div className="stat">
                      <span className="stat-value">{((((show.booked_seats || 0) / show.total_seats) * 100).toFixed(1))}%</span>
                      <span className="stat-label">Occupancy</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
