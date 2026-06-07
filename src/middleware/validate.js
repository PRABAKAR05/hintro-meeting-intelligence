const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware to process express-validator results.
 * Returns a 422 response with all validation errors if any exist.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join('; ');
    return errorResponse(res, 'VALIDATION_ERROR', messages, 422);
  }

  next();
};

module.exports = validate;
