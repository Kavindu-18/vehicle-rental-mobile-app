// Opened in the in-app browser. Renders an auto-submitting PayHere form for a pending booking,
// and handles PayHere's return/cancel redirect back into the app.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { checkoutEndpoint, checkoutHash, formatAmount, isAllowedReturnUrl, payhere } from '../_shared/payhere.ts';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

Deno.serve(async (req) => {
  const params = new URL(req.url).searchParams;
  const bookingId = params.get('booking') ?? '';
  const returnUrl = params.get('return') ?? '';
  if (!isAllowedReturnUrl(returnUrl)) return new Response('Invalid return URL', { status: 400 });

  // PayHere sends the user back here; bounce into the app.
  if (params.has('done') || params.has('cancelled')) {
    const target = new URL(returnUrl);
    target.searchParams.set('booking', bookingId);
    target.searchParams.set('result', params.has('done') ? 'done' : 'cancelled');
    return Response.redirect(target.toString(), 302);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: b } = await admin
    .from('bookings')
    .select('id, reference, total, status, hold_expires_at, vehicles(make, model), profiles(full_name, phone)')
    .eq('id', bookingId)
    .maybeSingle();
  // deno-lint-ignore no-explicit-any
  const booking = b as any;
  if (!booking || booking.status !== 'pending' || new Date(booking.hold_expires_at) < new Date()) {
    return new Response('This booking has expired. Please start again in the app.', { status: 410 });
  }
  if (!payhere.merchantId || !payhere.merchantSecret) {
    return new Response('Payments are not configured (set PAYHERE_MERCHANT_ID / PAYHERE_MERCHANT_SECRET).', { status: 503 });
  }

  const self = `${supabaseUrl}/functions/v1/payhere-checkout?booking=${booking.id}&return=${encodeURIComponent(returnUrl)}`;
  const [first, ...rest] = (booking.profiles?.full_name ?? 'Guest').split(' ');
  const fields: Record<string, string> = {
    merchant_id: payhere.merchantId,
    return_url: `${self}&done=1`,
    cancel_url: `${self}&cancelled=1`,
    notify_url: `${supabaseUrl}/functions/v1/payhere-notify`,
    order_id: booking.id,
    items: `${booking.vehicles.make} ${booking.vehicles.model} (${booking.reference})`,
    currency: 'LKR',
    amount: formatAmount(Number(booking.total)),
    first_name: first,
    last_name: rest.join(' ') || '-',
    email: '',
    phone: booking.profiles?.phone ?? '',
    address: '-',
    city: '-',
    country: 'Sri Lanka',
    hash: await checkoutHash(booking.id, Number(booking.total), 'LKR'),
  };

  const inputs = Object.entries(fields)
    .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
    .join('');
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{background:#07070B;color:#F5F5FA;font-family:-apple-system,sans-serif;display:grid;place-items:center;height:100vh;margin:0}</style>
</head><body><p>Redirecting to secure payment…</p>
<form id="f" method="post" action="${checkoutEndpoint()}">${inputs}</form>
<script>document.getElementById('f').submit()</script></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
});
