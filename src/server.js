const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const drawScheduler = require('./services/scheduler.service');

const startServer = async () => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  if (env.ENABLE_DRAW_SCHEDULER) {
    drawScheduler.start(env.DRAW_INTERVAL_SECONDS);
    console.log(`Draw scheduler running every ${env.DRAW_INTERVAL_SECONDS}s`);
  }

  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    drawScheduler.stop();
    server.close(() => process.exit(0));
  });
};


startServer();
