import React from 'react';
import { Show } from '../types';
import './ShowCard.css';

interface ShowCardProps {
  show: Show;
  onSelect: (id: number) => void;
  isSelected?: boolean;
}

export const ShowCard: React.FC<ShowCardProps> = ({ show, onSelect, isSelected = false }) => {
  const startDate = new Date(show.start_time);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const availableSeats = show.available_seats || 0;

  return (
    <div className={`show-card ${isSelected ? 'selected' : ''}`}>
      <div className="show-header">
        <h3 className="show-name">{show.name}</h3>
      </div>

      <div className="show-details">
        <div className="detail-item">
          <span className="label">📅 Date & Time</span>
          <span className="value">
            {formattedDate} at {formattedTime}
          </span>
        </div>

        <div className="detail-item">
          <span className="label">💺 Total Seats</span>
          <span className="value">{show.total_seats}</span>
        </div>

        <div className="detail-item">
          <span className="label">✅ Available</span>
          <span className={`value ${availableSeats === 0 ? 'sold-out' : 'available'}`}>
            {availableSeats} seats
          </span>
        </div>
      </div>

      <button
        className={`btn btn-primary ${availableSeats === 0 ? 'disabled' : ''}`}
        onClick={() => onSelect(show.id)}
        disabled={availableSeats === 0}
      >
        {availableSeats === 0 ? 'Sold Out' : 'Book Now'}
      </button>
    </div>
  );
};
