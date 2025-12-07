// API client for communicating with backend
import axios, { AxiosInstance, AxiosError } from 'axios';
import { Show, ShowDetails, Booking } from '../types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        const message = (error.response?.data as any)?.error || error.message;
        console.error('API Error:', message);
        return Promise.reject(new Error(message));
      }
    );
  }

  // ============ SHOW ENDPOINTS ============

  async getAllShows(): Promise<Show[]> {
    const { data } = await this.client.get<{ shows: Show[] }>('/shows');
    return data.shows;
  }

  async getShowById(id: number): Promise<ShowDetails> {
    const { data } = await this.client.get<{ show: ShowDetails }>(`/shows/${id}`);
    return data.show;
  }

  async createShow(name: string, startTime: string, totalSeats: number): Promise<Show> {
    const { data } = await this.client.post<{ show: Show }>('/admin/shows', {
      name,
      startTime,
      totalSeats,
    });
    return data.show;
  }

  // ============ BOOKING ENDPOINTS ============

  async bookSeats(showId: number, seatNumbers: string[]): Promise<Booking> {
    const { data } = await this.client.post<{ booking: Booking }>(
      `/shows/${showId}/book`,
      { seatNumbers }
    );
    return data.booking;
  }

  async getBooking(bookingId: number): Promise<Booking> {
    const { data } = await this.client.get<{ booking: Booking }>(
      `/bookings/${bookingId}`
    );
    return data.booking;
  }

  async expireBookings(): Promise<void> {
    await this.client.post('/admin/bookings/expire');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
