const Meeting = require('../models/Meeting');
const ApiError = require('../utils/apiError');
const { successResponse } = require('../utils/apiResponse');
const { analyzeMeeting } = require('../services/ai.service');
const logger = require('../config/logger');

/**
 * POST /api/meetings
 * Create a new meeting with transcript.
 */
const createMeeting = async (req, res, next) => {
  try {
    const { title, participants, meetingDate, transcript } = req.body;

    const meeting = await Meeting.create({
      title,
      participants: participants || [],
      meetingDate,
      transcript,
      createdBy: req.user.id,
    });

    logger.info('Meeting created', {
      traceId: req.traceId,
      meetingId: meeting._id,
      title: meeting.title,
    });

    return successResponse(res, meeting, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/meetings
 * List meetings with pagination and optional filtering.
 */
const listMeetings = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { createdBy: req.user.id };

    if (req.query.title) {
      filter.title = { $regex: req.query.title, $options: 'i' };
    }
    if (req.query.startDate || req.query.endDate) {
      filter.meetingDate = {};
      if (req.query.startDate) {
        filter.meetingDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.meetingDate.$lte = new Date(req.query.endDate);
      }
    }
    if (req.query.participant) {
      filter.participants = { $in: [req.query.participant] };
    }

    const [meetings, total] = await Promise.all([
      Meeting.find(filter)
        .sort({ meetingDate: -1 })
        .skip(skip)
        .limit(limit)
        .select('-transcript'), // Exclude transcript from list view for performance
      Meeting.countDocuments(filter),
    ]);

    return successResponse(res, {
      meetings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/meetings/:id
 * Get a single meeting by ID.
 */
const getMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!meeting) {
      throw ApiError.notFound('Meeting not found');
    }

    return successResponse(res, meeting);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/meetings/:id/analyze
 * Trigger AI analysis on a meeting transcript.
 */
const analyzeMeetingEndpoint = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!meeting) {
      throw ApiError.notFound('Meeting not found');
    }

    if (!meeting.transcript || meeting.transcript.length === 0) {
      throw ApiError.badRequest('Meeting has no transcript to analyze');
    }

    logger.info('Starting meeting analysis', {
      traceId: req.traceId,
      meetingId: meeting._id,
    });

    // Run AI analysis
    const analysis = await analyzeMeeting(meeting.transcript, req.traceId);

    // Save analysis to meeting
    meeting.analysis = analysis;
    meeting.analyzedAt = new Date();
    await meeting.save();

    logger.info('Meeting analysis completed', {
      traceId: req.traceId,
      meetingId: meeting._id,
      summaryCount: analysis.summary.length,
      actionItemCount: analysis.actionItems.length,
      decisionCount: analysis.decisions.length,
      followUpCount: analysis.followUps.length,
    });

    return successResponse(res, {
      meetingId: meeting._id,
      analyzedAt: meeting.analyzedAt,
      ...analysis,
    });
  } catch (error) {
    if (error.message?.includes('API key')) {
      return next(ApiError.internal('AI service configuration error. Please check GROQ_API_KEY.'));
    }
    next(error);
  }
};

module.exports = { createMeeting, listMeetings, getMeeting, analyzeMeetingEndpoint };
