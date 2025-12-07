import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Booking, BookingContextType } from '../types';
import { apiClient } from '../api/client';

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectSeat = useCallback((seatNumber: string) => {
    setSelectedSeats(prev => 
      prev.includes(seatNumber) ? prev : [...prev, seatNumber]
    );
  }, []);

  const deselectSeat = useCallback((seatNumber: string) => {
    setSelectedSeats(prev => prev.filter(s => s !== seatNumber));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSeats([]);
  }, []);

  const bookSeats = useCallback(async (showId: number, seatNumbers: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const newBooking = await apiClient.bookSeats(showId, seatNumbers);
      setBooking(newBooking);
      setSelectedSeats([]);
      return newBooking;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to book seats';
      setError(errorMessage);
      console.error('Error booking seats:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBooking = useCallback(async (bookingId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getBooking(bookingId);
      setBooking(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch booking';
      setError(errorMessage);
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const value: BookingContextType = {
    booking,
    selectedSeats,
    loading,
    error,
    bookSeats,
    fetchBooking,
    selectSeat,
    deselectSeat,
    clearSelection,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};
