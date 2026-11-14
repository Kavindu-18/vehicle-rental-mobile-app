# Rentora — car rental marketplace

An Airbnb-style marketplace for Sri Lanka. Customers rent cars from **rental companies** and **private owners** ("hosts") in one app, which has a 3D car viewer and animated UI.

> "Rentora" is a placeholder name. To rename or recolor the whole app, edit [brand/brand.json](brand/brand.json).

## Structure

```
apps/customer/      Expo (React Native) app for iOS + Android
  src/app/          screens (Expo Router)
  src/components/   UI kit, 3D car viewer (three/), cards
  src/data/         API hooks, booking + host services, demo data
supabase/
  migrations/       Postgres schema + Row-Level Security
  functions/        create-booking, payhere-checkout, payhere-notify
  seed.sql          demo hosts and listings
brand/brand.json    app name, bundle id, colors
```

## Run the app

```bash
npm install
npm run customer          # starts Expo; scan the QR code with Expo Go on your phone
```

With no `.env`, the app runs on **demo data**, so it works without a backend.

## Run the backend locally (needs Docker Desktop running)

```bash
npx supabase start        # applies migrations + seed
npx supabase status       # copy the API URL and anon key
cp apps/customer/.env.example apps/customer/.env   # paste them in
cp supabase/functions/.env.example supabase/functions/.env   # PayHere sandbox keys
npx supabase functions serve
```

## How booking and payment work

1. The app calls `create-booking`. The server recalculates the price (host pricing rules, add-ons, promo code) and holds the car for 15 minutes. A Postgres exclusion constraint makes double-booking impossible.
2. The app opens `payhere-checkout` in an in-app browser, which shows PayHere's signed payment form.
3. PayHere calls `payhere-notify`. That function checks the signature and amount, then marks the booking **confirmed**.

## Roles and security

| Who | Can see / do |
|---|---|
| Anyone | approved hosts and their live listings |
| Customer | their own bookings, payments, documents, favorites |
| Host member (owner/manager/staff) | their host's fleet, bookings, inspections. Owners/managers edit listings |
| Marketplace admin | everything: approve hosts and listings, verify documents |

New hosts start as `pending`, and new or edited listings go to `pending_review`. Database triggers stop hosts from approving themselves, changing ratings, or escalating their roles.

## Next phases

- **Host billing:** registration fee, plus a subscription (by category or fleet size) or a commission, and host payouts.
- Sign-in (phone OTP / Google / Apple) and KYC upload in the app.
- Host dashboard (web) and in-app host mode: listings, calendar, booking requests.
- Admin panel: host and listing approval, disputes, analytics.
- Staff app: handover inspections, delivery tracking.
