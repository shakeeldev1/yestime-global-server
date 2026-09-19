/* eslint-disable no-console */
// One-time bootstrap for the very first admin account, since signup blocks
// role: "admin" and the admin user-management API itself requires being an
// admin already. Run with:
//   node src/scripts/createAdmin.js "Name" "email@example.com" "password"

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/user.model');

const [, , name, email, password] = process.argv;

if (!name || !email || !password) {
  console.error('Usage: node src/scripts/createAdmin.js "Name" "email@example.com" "password"');
  process.exit(1);
}

const run = async () => {
  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (existing.role === 'admin') {
      console.log(`${email} is already an admin.`);
    } else {
      existing.role = 'admin';
      existing.businessType = null;
      existing.isVerified = true;
      await existing.save();
      console.log(`${email} already existed and has been promoted to admin.`);
    }
  } else {
    await User.create({ name, email, password, role: 'admin', isVerified: true });
    console.log(`Admin account created for ${email}.`);
  }

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
