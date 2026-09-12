const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    shopper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // null for a self-automated purchase (the shopper recorded it themselves,
    // no dealer/shopkeeper involved).
    shopkeeper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Who submitted this purchase: a shop's shopkeeper, a registered
    // property/car/bike dealer, or the shopper themselves (self-automated).
    channel: {
      type: String,
      enum: ['shopkeeper', 'dealer', 'self'],
      required: true,
    },
    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      required: true,
    },
    tokenNumber: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        'shop',
        'shopping',
        'wholesale',
        'petrol_diesel',
        'motorcycle_scooty',
        'crop',
        'self_service_saving',
        'property',
        'car',
        'bike',
      ],
      default: 'shop',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Percentage and amount of `amount` routed to the company wallet.
    taxRate: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      required: true,
    },
    // Informational only for `channel: 'dealer'` — the dealer's own cut,
    // already collected in cash from the buyer; never moved through a wallet.
    dealerCommissionAmount: {
      type: Number,
      default: 0,
    },
    leveledUp: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
