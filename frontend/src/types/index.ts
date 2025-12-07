// Define all TypeScript interfaces for type safety

export interface Show {
  id: number;
  name: string;
  from_location: string;
  to_location: string;
  start_time: string;
  total_seats: number;
  available_seats?: number;
  booked_seats?: number;
  created_at: string;
}

export interface Seat {
  id: number;
  seat_number: string;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED';
}

export interface ShowDetails extends Show {
  seats: Seat[];
  availableSeats: number;
  bookedSeats: number;
}

export interface Booking {
  id: number;
  showId: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED';
  seats: string[];
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  userRole: 'admin' | 'user';
  user: UserProfile | null;
  login: (role: 'admin' | 'user', userData?: UserProfile) => void;
  logout: () => void;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: string;
}

export interface ShowContextType {
  shows: Show[];
  selectedShow: ShowDetails | null;
  loading: boolean;
  error: string | null;
  fetchShows: () => Promise<void>;
  fetchShowById: (id: number) => Promise<void>;
  createShow: (name: string, fromLocation: string, toLocation: string, startTime: string, totalSeats: number) => Promise<void>;
  updateShow: (id: number, name: string, fromLocation: string, toLocation: string, startTime: string) => Promise<void>;
  deleteShow: (id: number) => Promise<void>;
}

export interface BookingContextType {
  booking: Booking | null;
  selectedSeats: string[];
  loading: boolean;
  error: string | null;
  bookSeats: (showId: number, seatNumbers: string[]) => Promise<void>;
  fetchBooking: (bookingId: number) => Promise<void>;
  confirmBooking: (bookingId: number) => Promise<void>;
  selectSeat: (seatNumber: string) => void;
  deselectSeat: (seatNumber: string) => void;
  clearSelection: () => void;
  resetBooking: () => void;
}
