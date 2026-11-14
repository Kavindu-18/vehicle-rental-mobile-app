// Creates a pending booking with a server-computed price and returns a PayHere checkout URL.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { cors, json } from '../_shared/http.ts';
import { isAllowedReturnUrl } from '../_shared/payhere.ts';

const HOLD_MINUTES = 15;
const DAY = 86_400_000;

type Body = {
  vehicleId: string;
  start: string;
  end: string;
  delivery?: boolean;
  addonIds?: string[];
  promo?: string | null;
  color?: string;
  returnUrl: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // ── who is booking ──
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const { data: auth } = await admin.auth.getUser(jwt);
  if (!auth.user) return json({ error: 'Please sign in to book' }, 401);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!isAllowedReturnUrl(body.returnUrl)) return json({ error: 'Invalid return URL' }, 400);

  const start = new Date(body.start);
  const end = new Date(body.end);
  if (isNaN(+start) || isNaN(+end) || end <= start) return json({ error: 'Invalid dates' }, 400);
  if (start.getTime() < Date.now() - 60 * 60_000) return json({ error: 'Pick-up must be in the future' }, 400);
  const days = Math.ceil((end.getTime() - start.getTime()) / DAY);
  if (days > 90) return json({ error: 'Maximum rental is 90 days' }, 400);

  const { data: profile } = await admin.from('profiles').select('blacklisted').eq('id', auth.user.id).single();
  if (profile?.blacklisted) return json({ error: 'Your account cannot make bookings. Contact support.' }, 403);

  // ── vehicle must be live on an approved host ──
  const { data: vehicle } = await admin
    .from('vehicles')
    .select('id, host_id, daily_rate, deposit, status, hosts!inner(status), locations(name)')
    .eq('id', body.vehicleId)
    .single();
  // deno-lint-ignore no-explicit-any
  const v = vehicle as any;
  if (!v || v.status !== 'available' || v.hosts.status !== 'approved') return json({ error: 'This car is not available' }, 404);

  // ── price: daily rate × per-day multiplier from the host's pricing rules ──
  const { data: rules } = await admin
    .from('pricing_rules')
    .select('vehicle_id, valid_from, valid_to, weekdays, multiplier, min_days')
    .eq('host_id', v.host_id);
  let subtotal = 0;
  for (let i = 0; i < days; i++) {
    const day = new Date(start.getTime() + i * DAY);
    const iso = day.toISOString().slice(0, 10);
    const applicable = (rules ?? []).filter(
      (r) =>
        (!r.vehicle_id || r.vehicle_id === v.id) &&
        (!r.valid_from || iso >= r.valid_from) &&
        (!r.valid_to || iso <= r.valid_to) &&
        (!r.weekdays || r.weekdays.includes(day.getUTCDay())) &&
        (!r.min_days || days >= r.min_days),
    );
    const multiplier = applicable.length ? Math.max(...applicable.map((r) => Number(r.multiplier))) : 1;
    subtotal += Number(v.daily_rate) * multiplier;
  }

  const addonIds = [...new Set(body.addonIds ?? [])];
  const { data: addons } = addonIds.length
    ? await admin.from('addons').select('id, price_per_day').eq('host_id', v.host_id).in('id', addonIds)
    : { data: [] as { id: string; price_per_day: number }[] };
  const extras = (addons ?? []).reduce((s, a) => s + Number(a.price_per_day) * days, 0);

  let discount = 0;
  let promoCode: string | null = null;
  if (body.promo) {
    const { data: promo } = await admin
      .from('promo_codes')
      .select('id, host_id, percent_off, min_days, valid_until, max_uses, uses')
      .eq('code', body.promo.toUpperCase())
      .maybeSingle();
    const ok =
      promo &&
      (!promo.host_id || promo.host_id === v.host_id) &&
      days >= promo.min_days &&
      (!promo.valid_until || new Date(promo.valid_until) > new Date()) &&
      (promo.max_uses == null || promo.uses < promo.max_uses);
    if (!ok) return json({ error: 'Promo code is not valid for this booking' }, 400);
    discount = Math.round(subtotal * Number(promo.percent_off)) / 100;
    promoCode = body.promo.toUpperCase();
  }

  const total = Math.round((subtotal + extras - discount) * 100) / 100;

  // release this car's expired unpaid holds so they don't block the exclusion constraint
  await admin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('vehicle_id', v.id)
    .eq('status', 'pending')
    .lt('hold_expires_at', new Date().toISOString());

  const { data: booking, error: bookingErr } = await admin
    .from('bookings')
    .insert({
      host_id: v.host_id,
      customer_id: auth.user.id,
      vehicle_id: v.id,
      period: `[${start.toISOString()},${end.toISOString()})`,
      status: 'pending',
      hold_expires_at: new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString(),
      delivery: !!body.delivery,
      pickup_address: body.delivery ? null : v.locations?.name ?? null,
      color: body.color ?? null,
      promo_code: promoCode,
      subtotal,
      extras,
      discount,
      total,
      deposit: v.deposit,
    })
    .select('id, reference')
    .single();

  if (bookingErr) {
    if (bookingErr.code === '23P01') return json({ error: 'Sorry, this car was just booked for those dates' }, 409);
    console.error(bookingErr);
    return json({ error: 'Could not create booking' }, 500);
  }

  if (addons?.length) {
    await admin.from('booking_addons').insert(
      addons.map((a) => ({ booking_id: booking.id, addon_id: a.id, price_per_day: a.price_per_day })),
    );
  }
  await admin.from('payments').insert({ booking_id: booking.id, host_id: v.host_id, amount: total, currency: 'LKR' });

  const checkoutUrl =
    `${url}/functions/v1/payhere-checkout?booking=${booking.id}&return=${encodeURIComponent(body.returnUrl)}`;
  return json({ bookingId: booking.id, reference: booking.reference, total, checkoutUrl });
});
