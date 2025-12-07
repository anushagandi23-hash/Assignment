import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Show, ShowDetails, ShowContextType } from '../types';
import { apiClient } from '../api/client';

const ShowContext = createContext<ShowContextType | undefined>(undefined);

export const ShowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shows, setShows] = useState<Show[]>([]);
  const [selectedShow, setSelectedShow] = useState<ShowDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAllShows();
      setShows(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch shows';
      setError(errorMessage);
      console.error('Error fetching shows:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchShowById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getShowById(id);
      setSelectedShow(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch show';
      setError(errorMessage);
      console.error('Error fetching show:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createShow = useCallback(async (name: string, fromLocation: string, toLocation: string, startTime: string, totalSeats: number) => {
    setLoading(true);
    setError(null);
    try {
      const newShow = await apiClient.createShow(name, fromLocation, toLocation, startTime, totalSeats);
      setShows(prev => [...prev, newShow]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create show';
      setError(errorMessage);
      console.error('Error creating show:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateShow = useCallback(async (id: number, name: string, fromLocation: string, toLocation: string, startTime: string) => {
    setLoading(true);
    setError(null);
    try {
      const updatedShow = await apiClient.updateShow(id, name, fromLocation, toLocation, startTime);
      setShows(prev => prev.map(show => show.id === id ? updatedShow : show));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update show';
      setError(errorMessage);
      console.error('Error updating show:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteShow = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.deleteShow(id);
      setShows(prev => prev.filter(show => show.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete show';
      setError(errorMessage);
      console.error('Error deleting show:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: ShowContextType = {
    shows,
    selectedShow,
    loading,
    error,
    fetchShows,
    fetchShowById,
    createShow,
    updateShow,
    deleteShow,
  };

  return (
    <ShowContext.Provider value={value}>
      {children}
    </ShowContext.Provider>
  );
};

export const useShows = () => {
  const context = useContext(ShowContext);
  if (!context) {
    throw new Error('useShows must be used within ShowProvider');
  }
  return context;
};
