const mongoose = require('mongoose');
const { ACTION_ITEM_STATUS, VALID_STATUSES } = require('../utils/constants');

const citationSchema = new mongoose.Schema(
  {
    timestamp: { type: String, required: true },
  },
  { _id: false }
);

const actionItemSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
      maxlength: [500, 'Task must be at most 500 characters'],
    },
    assignee: {
      type: String,
      required: [true, 'Assignee is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: VALID_STATUSES,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      },
      default: ACTION_ITEM_STATUS.PENDING,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      default: null,
    },
    citations: [citationSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient querying
actionItemSchema.index({ status: 1, dueDate: 1 });
actionItemSchema.index({ assignee: 1 });
actionItemSchema.index({ meetingId: 1 });
actionItemSchema.index({ createdBy: 1 });

module.exports = mongoose.model('ActionItem', actionItemSchema);
