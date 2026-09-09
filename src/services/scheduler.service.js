const { runDraw } = require('./draw.service');

// NOTE: this is a single-process, in-memory scheduler (setInterval). It's the
// right shape for one Node instance. If this app is ever run as multiple
// replicas behind a load balancer, each replica would run its own scheduler
// and draws would happen N times too often — at that point this needs to
// move to a single dedicated worker process (or a distributed lock).

const state = {
  timer: null,
  intervalSeconds: null,
  lastRunAt: null,
  lastError: null,
  totalRuns: 0,
};

const tick = async () => {
  try {
    await runDraw();
    state.lastRunAt = new Date();
    state.lastError = null;
    state.totalRuns += 1;
  } catch (error) {
    state.lastError = error.message;
  }
};

const start = (intervalSeconds) => {
  if (state.timer) return getStatus();

  state.intervalSeconds = intervalSeconds;
  state.timer = setInterval(tick, intervalSeconds * 1000);
  state.timer.unref?.();

  return getStatus();
};

const stop = () => {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  return getStatus();
};

const getStatus = () => ({
  enabled: Boolean(state.timer),
  intervalSeconds: state.intervalSeconds,
  lastRunAt: state.lastRunAt,
  lastError: state.lastError,
  totalRuns: state.totalRuns,
});

module.exports = { start, stop, getStatus };
