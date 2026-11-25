const mongoose = require('mongoose');

const TOKEN_SEQUENCE_ID = 'token_number';
const MAX_TOKEN_NUMBER = 999999;

const tokenNumberSequenceSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: TOKEN_SEQUENCE_ID,
    },
    value: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: MAX_TOKEN_NUMBER,
    },
  },
  { versionKey: false }
);

tokenNumberSequenceSchema.statics.ensureInitialized = async function ensureInitialized() {
  try {
    await this.updateOne(
      { _id: TOKEN_SEQUENCE_ID },
      { $setOnInsert: { value: 0 } },
      { upsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    const sequence = await this.exists({ _id: TOKEN_SEQUENCE_ID });
    if (!sequence) throw error;
  }
};

tokenNumberSequenceSchema.statics.increment = function increment(session) {
  return this.findOneAndUpdate(
    { _id: TOKEN_SEQUENCE_ID, value: { $lt: MAX_TOKEN_NUMBER } },
    { $inc: { value: 1 } },
    { new: true, ...(session ? { session } : {}) }
  );
};

module.exports = mongoose.model('TokenNumberSequence', tokenNumberSequenceSchema);
