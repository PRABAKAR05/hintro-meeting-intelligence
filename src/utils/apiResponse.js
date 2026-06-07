/**
 * Unified API response helpers.
 * Ensures all responses follow a consistent structure.
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {object} data - Response payload
 * @param {number} statusCode - HTTP status code (default 200)
 */
const successResponse = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    traceId: res.req.traceId || 'unknown',
    success: true,
    data,
  });
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} code - Machine-readable error code
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default 500)
 */
const errorResponse = (res, code, message, statusCode = 500) => {
  return res.status(statusCode).json({
    traceId: res.req.traceId || 'unknown',
    success: false,
    error: {
      code,
      message,
    },
  });
};

module.exports = { successResponse, errorResponse };
