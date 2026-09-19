/* eslint-disable no-console */
// One-off backfill for the multi-shop feature: shops used to live as flat
// fields on the User document (one shop per shopkeeper). This creates a
// matching Shop document for every existing shopkeeper so they keep showing
// up in the directory. City/coordinates were never captured before, so
// those are left unset — owners can fill them in later via
// PATCH /api/shopkeepers/:shopId. Safe to re-run: users who already have a
// Shop document are skipped.
//
// Run with: node src/scripts/migrateShopsFromUsers.js

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/user.model');
const Shop = require('../models/shop.model');

const run = async () => {
  await connectDB();

  const shopkeepers = await User.find({ role: 'shopkeeper' });
  let created = 0;
  let skipped = 0;

  for (const user of shopkeepers) {
    const existing = await Shop.findOne({ owner: user._id });
    if (existing) {
      skipped += 1;
      continue;
    }

    await Shop.create({
      owner: user._id,
      businessType: user.businessType || 'shop',
      shopName: user.shopName || user.name,
      phoneNumber: user.phoneNumber,
      businessAddress: user.businessAddress || 'Not provided',
      businessDescription: user.businessDescription,
      businessImage: user.businessImage,
      businessCategories: user.businessCategories || [],
      registrationFee: user.shopkeeperRegistrationFee || 0,
      createdAt: user.shopkeeperRegisteredAt || user.createdAt,
    });
    created += 1;
  }

  console.log(`Done. Created ${created} shop(s), skipped ${skipped} (already had a shop).`);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
