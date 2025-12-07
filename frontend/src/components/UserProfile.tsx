import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './UserProfile.css';

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="user-profile-container">
      <button
        className="user-profile-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={`${user.name} (${user.role})`}
      >
        <span className="user-avatar">👤</span>
        <span className="user-name">{user.name}</span>
        <span className="dropdown-icon">▼</span>
      </button>

      {isOpen && (
        <div className="user-profile-menu">
          <div className="profile-header">
            <div className="profile-avatar">👤</div>
            <div className="profile-info">
              <h3>{user.name}</h3>
              <p className="profile-role">{user.role.toUpperCase()}</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{user.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">User ID:</span>
              <span className="detail-value">{user.id}</span>
            </div>
            {user.createdAt && (
              <div className="detail-item">
                <span className="detail-label">Member Since:</span>
                <span className="detail-value">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div className="profile-actions">
            <button
              className="btn btn-secondary logout-btn"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
