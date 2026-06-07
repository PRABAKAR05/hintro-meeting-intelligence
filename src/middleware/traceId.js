const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to generate or extract a trace ID for every request.
 * Attaches it to req.traceId and sets it in the response header.
 */
const traceIdMiddleware = (req, res, next) => {
  const traceId = req.headers['x-trace-id'] || uuidv4();
  req.traceId = traceId;
  res.setHeader('x-trace-id', traceId);
  next();
};

module.exports = traceIdMiddleware;
