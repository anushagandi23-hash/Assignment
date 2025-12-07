import React from 'react';
import { Seat } from '../types';
import './SeatGrid.css';

interface SeatGridProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatSelect: (seatNumber: string) => void;
  onSeatDeselect: (seatNumber: string) => void;
  maxSelectable?: number;
}

export const SeatGrid: React.FC<SeatGridProps> = ({
  seats,
  selectedSeats,
  onSeatSelect,
  onSeatDeselect,
  maxSelectable = 10,
}) => {
  const handleSeatClick = (seatNumber: string, status: string) => {
    if (status !== 'AVAILABLE') {
      return;
    }

    if (selectedSeats.includes(seatNumber)) {
      onSeatDeselect(seatNumber);
    } else {
      if (selectedSeats.length < maxSelectable) {
        onSeatSelect(seatNumber);
      }
    }
  };

  // Group seats by row for better layout
  const seatsByRow: { [key: string]: Seat[] } = {};
  seats.forEach(seat => {
    const row = seat.seat_number.charAt(0);
    if (!seatsByRow[row]) {
      seatsByRow[row] = [];
    }
    seatsByRow[row].push(seat);
  });

  return (
    <div className="seat-grid-container">
      <div className="legend">
        <div className="legend-item">
          <div className="seat available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="seat booked"></div>
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <div className="seat selected"></div>
          <span>Selected</span>
        </div>
      </div>

      <div className="seat-grid">
        {Object.entries(seatsByRow).map(([row, rowSeats]) => (
          <div key={row} className="seat-row">
            <span className="row-label">{row}</span>
            <div className="seats">
              {rowSeats.map(seat => (
                <button
                  key={seat.id}
                  className={`seat-btn ${seat.status.toLowerCase()} ${
                    selectedSeats.includes(seat.seat_number) ? 'selected' : ''
                  }`}
                  onClick={() => handleSeatClick(seat.seat_number, seat.status)}
                  disabled={seat.status !== 'AVAILABLE'}
                  title={`${seat.seat_number} - ${seat.status}`}
                >
                  {seat.seat_number.slice(1)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="seat-info">
        <p>Selected Seats: {selectedSeats.length}/{maxSelectable}</p>
        {selectedSeats.length > 0 && (
          <p className="selected-list">
            {selectedSeats.sort().join(', ')}
          </p>
        )}
      </div>
    </div>
  );
};
