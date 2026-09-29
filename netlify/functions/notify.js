const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  // 1. Header CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // 2. Gestione Preflight (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 3. Verifica metodo HTTP
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo non consentito' }) };
  }

  // 4. Controllo API Key
  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'];
  if (apiKey !== process.env.NOTIFY_SECRET) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorizzato' }) };
  }

  // 5. Validazione Body
  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON non valido' }) };
  }

  const { to, subject, html } = data;
  if (!to || !subject || !html) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Campi mancanti (to, subject, html)' }) };
  }

  // 6. Configurazione Nodemailer ottimizzata per server scolastici
  const isSecure = process.env.SMTP_SECURE === 'true';

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      // Bypassa eventuali problemi di certificati auto-firmati o non riconosciuti dal cloud
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    });
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Errore invio email:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
