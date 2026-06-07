const mongoose = require('mongoose');

const citationSchema = new mongoose.Schema(
  {
    timestamp: { type: String, required: true },
  },
  { _id: false }
);

const transcriptEntrySchema = new mongoose.Schema(
  {
    timestamp: {
      type: String,
      required: [true, 'Transcript timestamp is required'],
    },
    speaker: {
      type: String,
      required: [true, 'Speaker name is required'],
      trim: true,
    },
    text: {
      type: String,
      required: [true, 'Transcript text is required'],
      trim: true,
    },
  },
  { _id: false }
);

const summaryItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    citations: [citationSchema],
  },
  { _id: false }
);

const actionItemInsightSchema = new mongoose.Schema(
  {
    task: { type: String, required: true },
    assignee: { type: String, default: null },
    dueDate: { type: String, default: null },
    citations: [citationSchema],
  },
  { _id: false }
);

const decisionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    citations: [citationSchema],
  },
  { _id: false }
);

const followUpSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    citations: [citationSchema],
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    summary: [summaryItemSchema],
    actionItems: [actionItemInsightSchema],
    decisions: [decisionSchema],
    followUps: [followUpSchema],
  },
  { _id: false }
);

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [200, 'Title must be at most 200 characters'],
    },
    participants: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.every((email) => /^\S+@\S+\.\S+$/.test(email));
        },
        message: 'All participants must have valid email addresses',
      },
    },
    meetingDate: {
      type: Date,
      required: [true, 'Meeting date is required'],
    },
    transcript: {
      type: [transcriptEntrySchema],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: 'Transcript must have at least one entry',
      },
    },
    analysis: {
      type: analysisSchema,
      default: null,
    },
    analyzedAt: {
      type: Date,
      default: null,
    },
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

// Index for efficient querying
meetingSchema.index({ createdBy: 1, meetingDate: -1 });
meetingSchema.index({ title: 'text' });

module.exports = mongoose.model('Meeting', meetingSchema);
