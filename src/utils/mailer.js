const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const sendMail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    html,
  });
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

const otpEmailTemplate = ({ name, otp, purposeText, actionUrl, footerText }) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
    <h2>Hi ${escapeHtml(name)},</h2>
    <p>${purposeText}</p>
    <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
    ${actionUrl ? `<p><a href="${escapeHtml(actionUrl)}">Set your password</a></p>` : ''}
    <p>This code expires in ${env.OTP_EXPIRES_IN_MINUTES} minutes. ${footerText}</p>
  </div>
`;

const sendOtpEmail = async ({ to, name, otp, purpose, isStaffInvite = false }) => {
  const purposeText = isStaffInvite
    ? 'An administrator created a staff account for you. Use the code below to set your password.'
    : purpose === 'reset-password'
      ? 'Use the code below to reset your password.'
      : 'Use the code below to verify your email address.';

  const subject = isStaffInvite
    ? 'Set up your Yes Time Global staff account'
    : purpose === 'reset-password'
      ? 'Your password reset code'
      : 'Verify your email address';
  const actionUrl = purpose === 'reset-password'
    ? `${env.CLIENT_URL.replace(/\/+$/, '')}/set-password`
    : null;
  const footerText = isStaffInvite
    ? 'If you were not expecting a staff account, contact your administrator.'
    : 'If you did not request this, you can safely ignore this email.';

  await sendMail({
    to,
    subject,
    html: otpEmailTemplate({ name, otp, purposeText, actionUrl, footerText }),
  });
};

const notifyAdmin = async ({ subject, html }) => {
  await sendMail({ to: env.ADMIN_EMAIL, subject, html });
};

const notifyUser = async ({ to, subject, html }) => {
  await sendMail({ to, subject, html });
};

module.exports = { sendMail, sendOtpEmail, notifyAdmin, notifyUser };
