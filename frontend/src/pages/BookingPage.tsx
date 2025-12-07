import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SeatGrid } from '../components/SeatGrid';
import { Alert } from '../components/Alert';
import { useShows } from '../context/ShowContext';
import { useBooking } from '../context/BookingContext';
import './BookingPage.css';

export const BookingPage: React.FC = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { selectedShow, loading: showLoading, fetchShowById } = useShows();
  const { selectedSeats, booking, loading, error, bookSeats, confirmBooking, selectSeat, deselectSeat, clearSelection, resetBooking } = useBooking();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');
  const [confirmingBooking, setConfirmingBooking] = useState(false);

  useEffect(() => {
    if (showId) {
      // Reset booking when switching to a different show
      resetBooking();
      fetchShowById(parseInt(showId));
    }
  }, [showId, resetBooking, fetchShowById]);

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setAlertMessage('Please select at least one seat');
      setAlertType('warning');
      return;
    }

    try {
      await bookSeats(parseInt(showId!), selectedSeats);
      setAlertMessage('Seats locked! Please confirm your booking.');
      setAlertType('success');
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : 'Failed to complete booking');
      setAlertType('error');
    }
  };

  const handleConfirmBooking = async () => {
    if (!booking || !booking.id) {
      setAlertMessage('No booking found');
      setAlertType('error');
      return;
    }

    setConfirmingBooking(true);
    try {
      await confirmBooking(booking.id);
      setAlertMessage('Booking confirmed! 🎉');
      setAlertType('success');
      // The booking context will update and trigger re-render showing confirmation page
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : 'Failed to confirm booking');
      setAlertType('error');
    } finally {
      setConfirmingBooking(false);
    }
  };

  if (showLoading) {
    return (
      <Layout title="Loading...">
        <div className="loading">Fetching show details...</div>
      </Layout>
    );
  }

  if (!selectedShow) {
    return (
      <Layout title="Error">
        <Alert
          type="error"
          message="Show not found. Please go back and select a show."
        />
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          ← Back to Shows
        </button>
      </Layout>
    );
  }

  return (
    <Layout title={`Book Seats - ${selectedShow.name}`}>
      <div className="booking-container">
        {booking && booking.status === 'CONFIRMED' ? (
          <>
            <div className="booking-header">
              <button className="btn btn-link" onClick={() => navigate('/')}>
                ← Back to Shows
              </button>
            </div>
            <div className="booking-success">
              <div className="success-icon">✓</div>
              <h3>Booking Confirmed!</h3>
              <div className="booking-details">
                <div className="detail-row">
                  <span>Booking ID:</span>
                  <strong>{booking.id ? `#${booking.id}` : 'N/A'}</strong>
                </div>
                <div className="detail-row">
                  <span>Seats:</span>
                  <strong>{booking.seats && booking.seats.length > 0 ? booking.seats.join(', ') : 'N/A'}</strong>
                </div>
                <div className="detail-row">
                  <span>Show:</span>
                  <strong>{selectedShow.name}</strong>
                </div>
                <div className="detail-row">
                  <span>Date & Time:</span>
                  <strong>{new Date(selectedShow.start_time).toLocaleString()}</strong>
                </div>
                <div className="detail-row">
                  <span>Expires At:</span>
                  <strong>{booking.expiresAt ? new Date(booking.expiresAt).toLocaleString() : 'N/A'}</strong>
                </div>
              </div>
              <p className="booking-note">
                🔔 This booking will expire in 2 minutes if not confirmed at the counter.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                ← Back to Shows
              </button>
            </div>
          </>
        ) : booking && booking.status === 'PENDING' ? (
          <>
            <div className="booking-header">
              <button className="btn btn-link" onClick={() => navigate('/')}>
                ← Back to Shows
              </button>
            </div>
            <div className="booking-pending">
              <div className="pending-icon">⏳</div>
              <h3>Seats Locked!</h3>
              <p className="pending-message">Your seats have been reserved temporarily.</p>
              <div className="booking-details">
                <div className="detail-row">
                  <span>Booking ID:</span>
                  <strong>{booking.id ? `#${booking.id}` : 'N/A'}</strong>
                </div>
                <div className="detail-row">
                  <span>Seats:</span>
                  <strong>{booking.seats && booking.seats.length > 0 ? booking.seats.join(', ') : 'N/A'}</strong>
                </div>
                <div className="detail-row">
                  <span>Show:</span>
                  <strong>{selectedShow.name}</strong>
                </div>
                <div className="detail-row">
                  <span>Date & Time:</span>
                  <strong>{new Date(selectedShow.start_time).toLocaleString()}</strong>
                </div>
                <div className="detail-row">
                  <span>Expires At:</span>
                  <strong>{booking.expiresAt ? new Date(booking.expiresAt).toLocaleString() : 'N/A'}</strong>
                </div>
              </div>
              <p className="booking-warning">
                ⚠️ Your booking expires in 2 minutes. Please confirm now to complete your purchase.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleConfirmBooking}
                disabled={confirmingBooking}
              >
                {confirmingBooking ? 'Confirming...' : 'Confirm Booking'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  clearSelection();
                  window.location.reload();
                }}
              >
                Cancel & Select Different Seats
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="booking-header">
              <button className="btn btn-link" onClick={() => navigate('/')}>
                ← Back to Shows
              </button>
              <h2>{selectedShow.name}</h2>
              <p className="show-info">
                {new Date(selectedShow.start_time).toLocaleDateString()} at{' '}
                {new Date(selectedShow.start_time).toLocaleTimeString()}
              </p>
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

            <SeatGrid
              seats={selectedShow.seats}
              selectedSeats={selectedSeats}
              onSeatSelect={selectSeat}
              onSeatDeselect={deselectSeat}
            />

            <div className="booking-summary">
              <div className="summary-item">
                <span>Seats Selected:</span>
                <strong>{selectedSeats.length}</strong>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleBooking}
                disabled={selectedSeats.length === 0 || loading}
              >
                {loading ? 'Processing...' : `Confirm Booking (${selectedSeats.length} seats)`}
              </button>
              {selectedSeats.length > 0 && (
                <button className="btn btn-link" onClick={clearSelection}>
                  Clear Selection
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};
