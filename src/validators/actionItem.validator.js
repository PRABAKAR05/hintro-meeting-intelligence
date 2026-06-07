const { body } = require('express-validator');
const { VALID_STATUSES } = require('../utils/constants');

const createActionItemValidator = [
  body('task')
    .trim()
    .notEmpty()
    .withMessage('Task description is required')
    .isLength({ max: 500 })
    .withMessage('Task must be at most 500 characters'),
  body('assignee')
    .trim()
    .notEmpty()
    .withMessage('Assignee is required'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),
  body('meetingId')
    .optional()
    .isMongoId()
    .withMessage('Meeting ID must be a valid MongoDB ObjectId'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
];

const updateStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
];

module.exports = { createActionItemValidator, updateStatusValidator };
