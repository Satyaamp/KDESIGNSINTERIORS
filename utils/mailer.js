const nodemailer = require('nodemailer');

const isMailConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.FROM_EMAIL
);

let transporter = null;

if (isMailConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  console.log('Nodemailer SMTP Transporter configured.');
} else {
  console.log('SMTP credentials missing. Emails will be logged to console in development mode.');
}

const sendMail = async (to, subject, text, html) => {
  try {
    if (isMailConfigured && transporter) {
      const info = await transporter.sendMail({
        from: `"${process.env.siteName || 'K.DESIGNS & INTERIORS'}" <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        text,
        html
      });
      console.log('Message sent: %s', info.messageId);
      return true;
    } else {
      console.log(`[MOCK EMAIL SENT]
To: ${to}
Subject: ${subject}
Content: ${text}`);
      return true;
    }
  } catch (error) {
    console.error('Email Dispatch Error:', error);
    try {
      const { recordLog } = require('./logger');
      await recordLog({
        type: 'Error',
        action: 'MAIL_DELIVERY_FAILED',
        description: `Failed to dispatch email to '${to}' with subject '${subject}'`,
        metadata: {
          error: error.message,
          stack: error.stack,
          recipient: to,
          subject
        }
      });
    } catch (logErr) {
      console.error('Failed to log mail dispatch error:', logErr);
    }
    return false; // don't crash the server, return false
  }
};

module.exports = { sendMail, isMailConfigured };
