Hikonulit — Minimal React Native + Supabase Demo

What this repo contains

- A minimal Expo-friendly React Native app (`App.js`, `src/`) that connects to Supabase, reads/inserts rows into a `measurements` table, subscribes to realtime updates, and triggers a local notification and an SMS call when a value meets/exceeds a threshold.
- `server/send-sms.js`: small Express example that forwards SMS requests to Twilio (for dev only).
- `.env.example` shows variables you should set.

Important security note

This sample intentionally keeps things simple. Do NOT put secret keys (Twilio auth token or Supabase service_role key) into your mobile client for production. Use a server, Supabase Edge Function, or other secure backend to send SMS or perform privileged actions.

Quick start (development)

1) Install the Expo CLI or use `npx`:

   npm install -g expo-cli

2) Initialize an Expo project in this folder or copy files into a fresh Expo app. The easiest is to create a new project and replace App.js + src/ files:

   npx create-expo-app .

3) Install dependencies

   npm install
   npm install @supabase/supabase-js expo-notifications

4) Configure environment values

   - Copy `.env.example` to `.env` and fill values.
   - Edit `src/supabaseClient.js` and replace placeholders with your Supabase URL and ANON key, or configure build-time env variables as you prefer.

5) Prepare Supabase DB

   - Create a table named `measurements` with columns:
     - `id` (bigint or serial primary key)
     - `value` (numeric / integer)
     - `created_at` (timestamp with time zone, default: now())

   Example SQL:

   CREATE TABLE public.measurements (
     id bigserial primary key,
     value numeric,
     created_at timestamptz DEFAULT now()
   );

   Make sure your Supabase Realtime is enabled for the table.

6) (Optional) Run SMS dev server

   - Install server deps (Express + node-fetch already in package.json)
   - Set environment variables for Twilio in your shell or a .env file (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM)
   - Run: `npm run server` (or `node server/send-sms.js`).

   By default the app expects SMS_API_URL in the client to be `http://localhost:3000/send` — edit in `src/screens/Dashboard.js` or set it as directed.

7) Start the Expo app

   npm run start

   Open on a device or emulator with the Expo Go app. The app will request notification permissions; allow them to see local alerts.

How it works (summary)

- The app queries the `measurements` table to show latest and recent values.
- It subscribes to realtime changes using supabase channels. When a new row arrives, it checks if `value >= threshold`.
- If threshold is met, the app schedules a local notification (Expo) and attempts to POST to `SMS_API_URL` (optional) to trigger an SMS from your server.

Next steps / production hardening

- Move SMS sending to a secure backend or a Supabase Edge Function; never embed private keys in the client.
- Use push notifications (remote) rather than local ones for notifications when the app is in the background.
- Add authentication to protect write operations and server endpoints.

If you want I can:
- Implement a Supabase Edge Function example for sending SMS with Twilio.
- Wire up push notifications with Expo push tokens and a small backend.
- Add a minimal UI polish or navigation.

