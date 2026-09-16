const dotenv = require('dotenv');

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,

  MONGO_URI: process.env.MONGO_URI,

  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',

  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  MAIL_FROM: process.env.MAIL_FROM || 'No Reply <no-reply@example.com>',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'info@yestimeglobal.com',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  OTP_EXPIRES_IN_MINUTES: Number(process.env.OTP_EXPIRES_IN_MINUTES) || 10,

  ENABLE_DRAW_SCHEDULER: process.env.ENABLE_DRAW_SCHEDULER !== 'false',
  // ~1,400 draws/day by default (86400s / 1400 ≈ 62s between draws).
  DRAW_INTERVAL_SECONDS: Number(process.env.DRAW_INTERVAL_SECONDS) || 62,
};

const requiredKeys = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
];

for (const key of requiredKeys) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = env;
