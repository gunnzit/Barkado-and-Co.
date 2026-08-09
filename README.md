# PawConnect

A marketplace connecting pet walkers & sitters with owners, plus vaccine due-date tracking.

## Stack
Next.js (App Router) · Prisma · Neon Postgres · Clerk auth · Razorpay payments — same stack as BuddyBooks.

## What's built (MVP v1)
- Owner: pet profiles, vaccination tracking with due-date reminders shown on dashboard, browse providers, request bookings
- Provider: onboarding form, accept/decline/progress bookings
- Booking lifecycle: REQUESTED → ACCEPTED → IN_PROGRESS → COMPLETED (or DECLINED/CANCELLED)
- Razorpay order creation + webhook (payment triggers after provider accepts, same pattern as BuddyBooks' project flow)

## Setup

1. Install dependencies
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` / `DIRECT_URL` from a new Neon project
   - Clerk keys from a new Clerk application (enable Email + Phone if you want)
   - Razorpay test keys

3. Push the schema to your database
   ```
   npm run db:push
   ```

4. Run locally
   ```
   npm run dev
   ```

## Not built yet (next priorities)
- Admin panel to verify/approve providers (right now `verified` defaults to `false` in the DB — flip manually via Prisma Studio until the panel exists)
- Live GPS tracking during walks
- Walk report cards (photos, distance, notes) — `WalkReport` model exists, no UI yet
- Reviews/ratings UI — `Review` model exists, no UI yet
- Push/email notifications for booking updates and vaccine reminders (currently just shown on dashboard load)
- In-app chat

## Deploy
Same flow as BuddyBooks — push to GitHub, connect the repo on Vercel, add the env vars there, and set `DATABASE_URL`/`DIRECT_URL` to the Neon pooled + direct connection strings.
