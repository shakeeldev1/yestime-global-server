const mongoose = require('mongoose');
const dns = require('dns');
const env = require('./env');

mongoose.set('bufferTimeoutMS', 30000);

let connectionPromise = null;

// Some local setups (VPN clients / antivirus DNS filters) redirect Node's
// resolver to a loopback DNS proxy that never responds, which breaks the
// mongodb+srv:// lookup with ECONNREFUSED even though the OS itself resolves
// fine. If that happens, retry once against public DNS before giving up.
const isDnsError = (error) =>
  ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ESERVFAIL'].includes(error?.code) &&
  /query(Srv|Txt)/.test(error?.syscall || '');

const connectWithDnsFallback = async () => {
  try {
    return await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 30000 });
  } catch (error) {
    if (!isDnsError(error)) throw error;
    console.warn('MongoDB SRV lookup failed via system DNS, retrying with public DNS servers...');
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    return mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 30000 });
  }
};

const connectDB = () => {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (!connectionPromise) {
    connectionPromise = connectWithDnsFallback()
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
