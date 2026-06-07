const ActionItem = require('../models/ActionItem');
const ApiError = require('../utils/apiError');
const { successResponse } = require('../utils/apiResponse');
const { ACTION_ITEM_STATUS } = require('../utils/constants');
const logger = require('../config/logger');

/**
 * POST /api/action-items
 * Create a new action item.
 */
const createActionItem = async (req, res, next) => {
  try {
    const { task, assignee, dueDate, meetingId, status, citations } = req.body;

    const actionItem = await ActionItem.create({
      task,
      assignee,
      dueDate: dueDate || null,
      meetingId: meetingId || null,
      status: status || ACTION_ITEM_STATUS.PENDING,
      citations: citations || [],
      createdBy: req.user.id,
    });

    logger.info('Action item created', {
      traceId: req.traceId,
      actionItemId: actionItem._id,
      task: actionItem.task,
    });

    return successResponse(res, actionItem, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/action-items
 * List action items with filtering.
 */
const listActionItems = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { createdBy: req.user.id };

    // Apply filters
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.assignee) {
      filter.assignee = { $regex: req.query.assignee, $options: 'i' };
    }
    if (req.query.meetingId) {
      filter.meetingId = req.query.meetingId;
    }

    const [actionItems, total] = await Promise.all([
      ActionItem.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('meetingId', 'title meetingDate'),
      ActionItem.countDocuments(filter),
    ]);

    return successResponse(res, {
      actionItems,
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
 * PATCH /api/action-items/:id/status
 * Update action item status.
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const actionItem = await ActionItem.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!actionItem) {
      throw ApiError.notFound('Action item not found');
    }

    actionItem.status = status;
    await actionItem.save();

    logger.info('Action item status updated', {
      traceId: req.traceId,
      actionItemId: actionItem._id,
      newStatus: status,
    });

    return successResponse(res, actionItem);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/action-items/overdue
 * Get overdue action items.
 */
const getOverdueItems = async (req, res, next) => {
  try {
    const overdueItems = await ActionItem.find({
      createdBy: req.user.id,
      status: { $ne: ACTION_ITEM_STATUS.COMPLETED },
      dueDate: { $lt: new Date(), $ne: null },
    })
      .sort({ dueDate: 1 })
      .populate('meetingId', 'title meetingDate');

    return successResponse(res, {
      overdueItems,
      count: overdueItems.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createActionItem, listActionItems, updateStatus, getOverdueItems };
