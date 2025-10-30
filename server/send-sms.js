// Minimal Express server that forwards SMS to Twilio REST API.
// WARNING: Keep these credentials secret and do NOT ship them in a client app. This example is for development only.

const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM || process.env.TWILIO_PHONE;

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
