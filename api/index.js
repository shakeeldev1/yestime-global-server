const app = require('../src/app');
const connectDB = require('../src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed' });
    return;
  }

  app(req, res);
};
