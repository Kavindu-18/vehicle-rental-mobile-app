// PayHere server-to-server callback. The only place a booking becomes "confirmed".
import { createClient } from 'npm:@supabase/supabase-js@2';
import { formatAmount, notifySignature, payhere } from '../_shared/payhere.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const form = await req.formData();
  const get = (k: string) => String(form.get(k) ?? '');

  const orderId = get('order_id');
  const statusCode = get('status_code');
  const amount = get('payhere_amount');
  const currency = get('payhere_currency');

  const expected = await notifySignature({ orderId, amount, currency, statusCode });
  if (get('merchant_id') !== payhere.merchantId || get('md5sig') !== expected) {
    console.warn('PayHere notify: bad signature for', orderId);
    return new Response('invalid signature', { status: 400 });
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: booking } = await admin.from('bookings').select('id, total, status').eq('id', orderId).maybeSingle();
  if (!booking) return new Response('unknown order', { status: 404 });

  const raw = Object.fromEntries(form.entries());
  if (statusCode === '2') {
    // amount must match what we charged
    if (formatAmount(Number(booking.total)) !== amount || currency !== 'LKR') {
      console.error('PayHere notify: amount mismatch', orderId, amount);
      await admin.from('payments').update({ status: 'failed', raw }).eq('booking_id', orderId);
      return new Response('amount mismatch', { status: 400 });
    }
    await admin.from('payments').update({ status: 'paid', provider_ref: get('payment_id'), raw }).eq('booking_id', orderId);
    if (booking.status === 'pending') {
      await admin.from('bookings').update({ status: 'confirmed', hold_expires_at: null }).eq('id', orderId);
    }
  } else if (statusCode === '-1' || statusCode === '-2' || statusCode === '-3') {
    await admin.from('payments').update({ status: 'failed', raw }).eq('booking_id', orderId);
    if (booking.status === 'pending') await admin.from('bookings').update({ status: 'cancelled' }).eq('id', orderId);
  }
  // status 0 = pending: leave as is
  return new Response('ok');
});
