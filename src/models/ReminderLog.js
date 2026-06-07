const mongoose = require('mongoose');
const { REMINDER_STATUS } = require('../utils/constants');

const reminderLogSchema = new mongoose.Schema(
  {
    actionItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ActionItem',
      required: true,
    },
    channel: {
      type: String,
      required: true,
      default: 'discord',
    },
    status: {
      type: String,
      enum: Object.values(REMINDER_STATUS),
      required: true,
    },
    error: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for checking recent reminders to avoid duplicates
reminderLogSchema.index({ actionItemId: 1, sentAt: -1 });

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
