const logger = require('../config/logger');
const { errorResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Global error handler middleware.
 * Catches all errors and returns a unified error response.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  const traceId = req.traceId || 'unknown';

  // Log the error with trace context
  logger.error(err.message, {
    traceId,
    method: req.method,
    path: req.originalUrl,
    statusCode: err.statusCode || 500,
    stack: err.stack,
  });

  // Handle known operational errors
  if (err instanceof ApiError) {
    return errorResponse(res, err.code, err.message, err.statusCode);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message).join(', ');
    return errorResponse(res, 'VALIDATION_ERROR', messages, 422);
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    return errorResponse(res, 'CONFLICT', `Duplicate value for: ${field}`, 409);
  }

  // Handle Mongoose cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return errorResponse(res, 'BAD_REQUEST', `Invalid ${err.path}: ${err.value}`, 400);
  }

  // Handle JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return errorResponse(res, 'BAD_REQUEST', 'Invalid JSON in request body', 400);
  }

  // Default: internal server error
  return errorResponse(
    res,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    500
  );
};

module.exports = errorHandler;
