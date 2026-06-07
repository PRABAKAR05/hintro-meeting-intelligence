/**
 * Application-wide constants and enums.
 */

const ACTION_ITEM_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

const VALID_STATUSES = Object.values(ACTION_ITEM_STATUS);

const REMINDER_STATUS = {
  SENT: 'SENT',
  FAILED: 'FAILED',
};

module.exports = {
  ACTION_ITEM_STATUS,
  VALID_STATUSES,
  REMINDER_STATUS,
};
