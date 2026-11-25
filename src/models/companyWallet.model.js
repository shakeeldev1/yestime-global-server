const mongoose = require('mongoose');

const companyWalletSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'company',
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

companyWalletSchema.statics.getSingleton = async function getSingleton({ session } = {}) {
  return this.findOneAndUpdate(
    { key: 'company' },
    { $setOnInsert: { balance: 0 } },
    { upsert: true, new: true, ...(session ? { session } : {}) }
  );
};

module.exports = mongoose.model('CompanyWallet', companyWalletSchema);
