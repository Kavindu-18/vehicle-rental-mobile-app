import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import type { Booking, Vehicle } from './types';

type NewBooking = {
  vehicle: Vehicle;
  color: string;
  start: Date;
  end: Date;
  delivery: boolean;
  addonIds: string[];
  promo: string | null;
  /** Display total only — the server recomputes the real price. */
  total: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Creates a booking and takes payment.
 * - Demo mode (no Supabase): simulates a successful PayHere payment.
 * - Live: the `create-booking` edge function validates availability, prices the booking
 *   server-side and returns a signed PayHere checkout URL; PayHere then calls our
 *   `payhere-notify` webhook which confirms the booking.
 */
export async function createBooking(input: NewBooking): Promise<Booking> {
  const base = {
    vehicle: input.vehicle,
    start: input.start.toISOString(),
    end: input.end.toISOString(),
    pickup: input.delivery ? 'Doorstep delivery' : input.vehicle.location,
    color: input.color,
  };

  if (!supabase) {
    await sleep(1400);
    return { ...base, id: `BK-${Date.now().toString(36).toUpperCase()}`, total: input.total, status: 'confirmed' };
  }

  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error('Please sign in to book');

  const { data, error } = await supabase.functions.invoke<{
    bookingId: string;
    reference: string;
    total: number;
    checkoutUrl: string;
  }>('create-booking', {
    body: {
      vehicleId: input.vehicle.id,
      start: base.start,
      end: base.end,
      delivery: input.delivery,
      addonIds: input.addonIds,
      promo: input.promo,
      color: input.color,
      returnUrl: Linking.createURL('payment-complete'),
    },
  });
  if (error || !data) throw new Error(error?.message ?? 'Could not create booking');

  const result = await WebBrowser.openAuthSessionAsync(data.checkoutUrl, Linking.createURL('payment-complete'));
  if (result.type !== 'success' || !result.url.includes('result=done')) throw new Error('Payment was cancelled');

  // PayHere's server callback (payhere-notify) confirms the booking; it can land a moment after the redirect.
  for (let i = 0; i < 10; i++) {
    const { data: row, error: statusErr } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', data.bookingId)
      .single();
    if (statusErr) throw statusErr;
    if (row.status !== 'pending') {
      if (row.status === 'cancelled') throw new Error('Payment failed — you have not been charged');
      return { ...base, id: data.reference, total: data.total, status: row.status };
    }
    await sleep(1500);
  }
  return { ...base, id: data.reference, total: data.total, status: 'pending' };
}
