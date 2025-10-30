// Minimal Express server that forwards SMS to Twilio REST API.
// WARNING: Keep these credentials secret and do NOT ship them in a client app. This example is for development only.

import { createClient } from '@supabase/supabase-js';
import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM || process.env.TWILIO_PHONE;

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ogapdrgcwmzecbwwrmre.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nYXBkcmdjd216ZWNid3dybXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDIxNzAsImV4cCI6MjA3MzkxODE3MH0.5ondVqwEc09dcuO9DsFcOqVl8lctcrI4CIjmhKsua10';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
  console.warn('Twilio credentials not set. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM in env to enable sending SMS.');
}

app.post('/send', async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'to and message required' });
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) return res.status(500).json({ error: 'Twilio not configured' });

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    const form = new URLSearchParams();
    form.append('To', to);
    form.append('From', TWILIO_FROM);
    form.append('Body', message);

    const resp = await fetch(url, {
      method: 'POST',
      body: form,
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')
      }
    });
    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json(data);
    return res.json(data);
  } catch (e) {
    console.error('send-sms error', e.message);
    return res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`SMS demo server listening on port ${PORT}`));
