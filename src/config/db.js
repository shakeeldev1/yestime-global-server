const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('bufferTimeoutMS', 30000);

let connectionPromise = null;

const connectDB = () => {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.MONGO_URI, { serverSelectionTimeoutMS: 30000 })
      .then((conn) => {
        console.log(`MongoDB connected: ${mongoose.connection.host}`);
        return conn;
      })
      .catch((error) => {
        connectionPromise = null;
        console.error(`MongoDB connection error: ${error.message}`);
        throw error;
      });
  }

  return connectionPromise;
};

module.exports = connectDB;
