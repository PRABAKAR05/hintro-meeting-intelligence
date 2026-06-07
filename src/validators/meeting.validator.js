const { body } = require('express-validator');

const createMeetingValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Meeting title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters'),
  body('participants')
    .isArray()
    .withMessage('Participants must be an array'),
  body('participants.*')
    .isEmail()
    .withMessage('Each participant must have a valid email address'),
  body('meetingDate')
    .notEmpty()
    .withMessage('Meeting date is required')
    .isISO8601()
    .withMessage('Meeting date must be a valid ISO 8601 date'),
  body('transcript')
    .isArray({ min: 1 })
    .withMessage('Transcript must be an array with at least one entry'),
  body('transcript.*.timestamp')
    .notEmpty()
    .withMessage('Each transcript entry must have a timestamp'),
  body('transcript.*.speaker')
    .trim()
    .notEmpty()
    .withMessage('Each transcript entry must have a speaker'),
  body('transcript.*.text')
    .trim()
    .notEmpty()
    .withMessage('Each transcript entry must have text content'),
];

module.exports = { createMeetingValidator };
