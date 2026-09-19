const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    businessType: {
      type: String,
      enum: ['shop', 'property', 'car', 'bike'],
      required: true,
    },
    shopName: {
      type: String,
      trim: true,
      required: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
    },
    businessAddress: {
      type: String,
      trim: true,
      required: true,
    },
    businessDescription: {
      type: String,
      trim: true,
      default: null,
    },
    businessImage: {
      type: String,
      trim: true,
      default: null,
    },
    businessCategories: {
      type: [String],
      enum: ['shopping', 'wholesale', 'petrol_diesel', 'motorcycle_scooty', 'car', 'property', 'crop', 'self_service_saving'],
      default: [],
    },
    // city/location are required on new registrations (enforced by the
    // registration validator) but left unset on shops backfilled from
    // legacy user records that never captured a location — those simply
    // won't surface in city/"near me" searches until the owner sets one.
    city: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        // [longitude, latitude]
        type: [Number],
      },
    },
    registrationFee: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

shopSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Shop', shopSchema);
