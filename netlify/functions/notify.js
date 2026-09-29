const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Metodo non consentito' }) };
  }

  if (event.headers['x-api-key'] !== process.env.NOTIFY_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Non autorizzato' }) };
  }

  let data;
  try { data = JSON.parse(event.body || '{}'); }
  catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'JSON non valido' }) }; }

  const { to, subject, html } = data;
  if (!to || !subject || !html) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Campi mancanti (to, subject, html)' }) };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Errore invio email:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
