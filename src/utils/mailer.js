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

const otpEmailTemplate = ({ name, otp, purposeText }) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
    <h2>Hi ${name},</h2>
    <p>${purposeText}</p>
    <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
    <p>This code expires in ${env.OTP_EXPIRES_IN_MINUTES} minutes. If you did not request this, you can safely ignore this email.</p>
  </div>
`;

const sendOtpEmail = async ({ to, name, otp, purpose }) => {
  const purposeText =
    purpose === 'reset-password'
      ? 'Use the code below to reset your password.'
      : 'Use the code below to verify your email address.';

  const subject = purpose === 'reset-password' ? 'Your password reset code' : 'Verify your email address';

  await sendMail({
    to,
    subject,
    html: otpEmailTemplate({ name, otp, purposeText }),
  });
};

const notifyAdmin = async ({ subject, html }) => {
  await sendMail({ to: env.ADMIN_EMAIL, subject, html });
};

const notifyUser = async ({ to, subject, html }) => {
  await sendMail({ to, subject, html });
};

module.exports = { sendMail, sendOtpEmail, notifyAdmin, notifyUser };
