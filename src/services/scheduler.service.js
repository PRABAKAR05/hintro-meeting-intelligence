const cron = require('node-cron');
const config = require('../config/env');
const logger = require('../config/logger');
const ActionItem = require('../models/ActionItem');
const ReminderLog = require('../models/ReminderLog');
const { sendReminder } = require('./telegram.service');
const { ACTION_ITEM_STATUS, REMINDER_STATUS } = require('../utils/constants');

/**
 * Scheduler service for detecting overdue action items
 * and sending reminder notifications via Telegram.
 */

let scheduledTask = null;

/**
 * Check for overdue action items and send reminders.
 * Avoids duplicate reminders by checking if one was sent in the last 24 hours.
 */
const processOverdueItems = async () => {
  const traceId = `scheduler-${Date.now()}`;
  logger.info('Scheduler: checking for overdue action items', { traceId });

  try {
    // Find overdue items: not completed AND past due date
    const overdueItems = await ActionItem.find({
      status: { $ne: ACTION_ITEM_STATUS.COMPLETED },
      dueDate: { $lt: new Date(), $ne: null },
    });

    logger.info(`Scheduler: found ${overdueItems.length} overdue items`, { traceId });

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of overdueItems) {
      // Check if reminder was already sent in the last 24 hours
      const recentReminder = await ReminderLog.findOne({
        actionItemId: item._id,
        status: REMINDER_STATUS.SENT,
        sentAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      if (recentReminder) {
        logger.debug(`Scheduler: skipping item ${item._id}, reminder sent recently`, { traceId });
        skipped++;
        continue;
      }

      // Send reminder via Telegram
      const success = await sendReminder(item);

      // Record reminder attempt
      await ReminderLog.create({
        actionItemId: item._id,
        channel: 'telegram',
        status: success ? REMINDER_STATUS.SENT : REMINDER_STATUS.FAILED,
        error: success ? null : 'Telegram message delivery failed',
        sentAt: new Date(),
      });

      if (success) sent++;
      else failed++;
    }

    logger.info('Scheduler: reminder cycle complete', {
      traceId,
      total: overdueItems.length,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    logger.error('Scheduler: error processing overdue items', {
      traceId,
      error: error.message,
    });
  }
};

/**
 * Start the scheduled reminder job.
 */
const startScheduler = () => {
  const cronExpression = config.scheduler.reminderCron;

  if (!cron.validate(cronExpression)) {
    logger.error(`Invalid cron expression: ${cronExpression}`);
    return;
  }

  scheduledTask = cron.schedule(cronExpression, processOverdueItems);

  logger.info(`Reminder scheduler started with cron: ${cronExpression}`);
};

/**
 * Stop the scheduled reminder job.
 */
const stopScheduler = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    logger.info('Reminder scheduler stopped');
  }
};

module.exports = { startScheduler, stopScheduler, processOverdueItems };
