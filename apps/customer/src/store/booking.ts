import { create } from 'zustand';
import type { Booking } from '@/data/types';

type BookingStore = {
  trips: Booking[];
  favorites: string[];
  addTrip: (b: Booking) => void;
  toggleFavorite: (vehicleId: string) => void;
};

/** Local trip/favorite state; replaced by Supabase `bookings` once auth is wired. */
export const useBookingStore = create<BookingStore>((set) => ({
  trips: [],
  favorites: [],
  addTrip: (b) => set((s) => ({ trips: [b, ...s.trips] })),
  toggleFavorite: (id) =>
    set((s) => ({
      favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
    })),
}));
