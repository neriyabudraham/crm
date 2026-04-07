const nodemailer = require('nodemailer');

let transporter = null;

const initTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[mail] SMTP not configured — emails will be logged only');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

/**
 * Send a transactional email.
 * If SMTP isn't configured the call falls back to console.log so the system
 * keeps working in dev environments without credentials.
 */
const sendMail = async (to, subject, html) => {
  const transport = initTransporter();
  if (!transport) {
    console.log(`[mail:dev] to=${to} subject="${subject}" — SMTP not configured, skipping send`);
    return { skipped: true };
  }
  const fromName = process.env.SMTP_FROM_NAME || 'Botomat CRM';
  const info = await transport.sendMail({
    from: `"${fromName}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  return { messageId: info.messageId };
};

const testConnection = async () => {
  try {
    const transport = initTransporter();
    if (!transport) return false;
    await transport.verify();
    return true;
  } catch (err) {
    console.error('[mail] SMTP verify failed:', err.message);
    return false;
  }
};

module.exports = { initTransporter, sendMail, testConnection };
