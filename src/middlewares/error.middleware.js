const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found - ${req.originalUrl}`));
};

const errorHandler = (err, _req, res, _next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    error = new ApiError(statusCode, error.message || 'Internal Server Error', error.errors || []);
  }

  if (err.name === 'CastError') {
    error = new ApiError(400, `Invalid value for field ${err.path}`);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    error = new ApiError(409, `${field} already exists`);
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ApiError(400, messages.join(', '));
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };
