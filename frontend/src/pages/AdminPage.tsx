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
  const { shows, loading, error, createShow, updateShow, deleteShow, fetchShows } = useShows();
  
  const [formData, setFormData] = useState({
    name: '',
    fromLocation: '',
    toLocation: '',
    startTime: '',
    totalSeats: 40,
  });
  
  const [editingShowId, setEditingShowId] = useState<number | null>(null);
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

    if (!formData.fromLocation.trim()) {
      setAlertMessage('Please enter from location');
      setAlertType('warning');
      return;
    }

    if (!formData.toLocation.trim()) {
      setAlertMessage('Please enter to location');
      setAlertType('warning');
      return;
    }

    if (!formData.startTime) {
      setAlertMessage('Please select a start time');
      setAlertType('warning');
      return;
    }

    if (editingShowId && (formData.totalSeats <= 0 || formData.totalSeats > 1000)) {
      setAlertMessage('Total seats must be between 1 and 1000');
      setAlertType('warning');
      return;
    }

    try {
      if (editingShowId) {
        // Update existing show
        await updateShow(editingShowId, formData.name, formData.fromLocation, formData.toLocation, formData.startTime);
        setAlertMessage('Show updated successfully! ✏️');
        setEditingShowId(null);
      } else {
        // Create new show
        if (formData.totalSeats <= 0 || formData.totalSeats > 1000) {
          setAlertMessage('Total seats must be between 1 and 1000');
          setAlertType('warning');
          return;
        }
        await createShow(formData.name, formData.fromLocation, formData.toLocation, formData.startTime, formData.totalSeats);
        setAlertMessage('Show created successfully! 🎉');
      }
      setAlertType('success');
      
      // Reset form
      setFormData({
        name: '',
        fromLocation: '',
        toLocation: '',
        startTime: '',
        totalSeats: 40,
      });

      // Refresh shows list
      await fetchShows();
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : 'Failed to save show');
      setAlertType('error');
    }
  };

  const handleEditShow = (show: any) => {
    setEditingShowId(show.id);
    const startDateTime = new Date(show.start_time).toISOString().slice(0, 16);
    setFormData({
      name: show.name,
      fromLocation: show.from_location,
      toLocation: show.to_location,
      startTime: startDateTime,
      totalSeats: show.total_seats,
    });
  };

  const handleDeleteShow = async (showId: number) => {
    if (!confirm('Are you sure you want to delete this show? This cannot be undone.')) {
      return;
    }

    try {
      await deleteShow(showId);
      setAlertMessage('Show deleted successfully! 🗑️');
      setAlertType('success');
      await fetchShows();
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : 'Failed to delete show');
      setAlertType('error');
    }
  };

  const handleCancelEdit = () => {
    setEditingShowId(null);
    setFormData({
      name: '',
      fromLocation: '',
      toLocation: '',
      startTime: '',
      totalSeats: 40,
    });
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
              <h3>{editingShowId ? 'Edit Show' : 'Create New Show'}</h3>
              <div className="form-group">
                <label htmlFor="name">Bus Route Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Premium Express"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="fromLocation">From Location *</label>
                <input
                  type="text"
                  id="fromLocation"
                  name="fromLocation"
                  value={formData.fromLocation}
                  onChange={handleInputChange}
                  placeholder="e.g., Mumbai"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="toLocation">To Location *</label>
                <input
                  type="text"
                  id="toLocation"
                  name="toLocation"
                  value={formData.toLocation}
                  onChange={handleInputChange}
                  placeholder="e.g., Delhi"
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

              {!editingShowId && (
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
              )}

              <div className="form-buttons">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (editingShowId ? 'Updating...' : 'Creating...') : (editingShowId ? '✏️ Update Show' : '+ Create Show')}
                </button>
                {editingShowId && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="shows-section">
            <h3>Active buses ({shows.length})</h3>
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
                    <div className="show-actions">
                      <button
                        className="btn btn-small btn-edit"
                        onClick={() => handleEditShow(show)}
                        disabled={loading}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-small btn-delete"
                        onClick={() => handleDeleteShow(show.id)}
                        disabled={loading}
                      >
                        🗑️ Delete
                      </button>
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
