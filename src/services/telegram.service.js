const axios = require('axios');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Telegram Bot API service for sending reminder notifications.
 * Uses the Telegram Bot sendMessage API endpoint.
 */

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

/**
 * Send a reminder notification via Telegram Bot API.
 * @param {object} actionItem - The overdue action item
 * @returns {boolean} Whether the notification was sent successfully
 */
const sendReminder = async (actionItem) => {
  const { botToken, chatId } = config.telegram;

  if (!botToken || !chatId) {
    logger.warn('Telegram bot token or chat ID not configured, skipping notification');
    return false;
  }

  const dueDate = actionItem.dueDate
    ? new Date(actionItem.dueDate).toISOString().split('T')[0]
    : 'Not specified';

  const overdueSince = actionItem.dueDate
    ? _getOverdueDuration(new Date(actionItem.dueDate))
    : 'Unknown';

  const message =
    `⚠️ *Overdue Action Item Reminder*\n\n` +
    `📋 *Task:* ${_escapeMarkdown(actionItem.task)}\n` +
    `👤 *Assigned To:* ${_escapeMarkdown(actionItem.assignee)}\n` +
    `📅 *Due Date:* ${dueDate}\n` +
    `⏰ *Overdue By:* ${overdueSince}\n` +
    `📊 *Status:* ${actionItem.status}\n\n` +
    `_Sent by Hintro Meeting Intelligence Service_`;

  try {
    const url = `${TELEGRAM_API_BASE}${botToken}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'MarkdownV2',
    });

    logger.info('Telegram reminder sent successfully', {
      actionItemId: actionItem._id?.toString(),
      assignee: actionItem.assignee,
    });

    return true;
  } catch (error) {
    // Retry with plain text if MarkdownV2 parsing fails
    try {
      const plainMessage =
        `⚠️ Overdue Action Item Reminder\n\n` +
        `Task: ${actionItem.task}\n` +
        `Assigned To: ${actionItem.assignee}\n` +
        `Due Date: ${dueDate}\n` +
        `Overdue By: ${overdueSince}\n` +
        `Status: ${actionItem.status}\n\n` +
        `Sent by Hintro Meeting Intelligence Service`;

      const url = `${TELEGRAM_API_BASE}${botToken}/sendMessage`;
      await axios.post(url, {
        chat_id: chatId,
        text: plainMessage,
      });

      logger.info('Telegram reminder sent successfully (plain text fallback)', {
        actionItemId: actionItem._id?.toString(),
        assignee: actionItem.assignee,
      });

      return true;
    } catch (fallbackError) {
      logger.error('Failed to send Telegram reminder', {
        actionItemId: actionItem._id?.toString(),
        error: fallbackError.message,
        status: fallbackError.response?.status,
        responseData: fallbackError.response?.data,
      });
      return false;
    }
  }
};

/**
 * Escape special characters for Telegram MarkdownV2.
 */
const _escapeMarkdown = (text) => {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
};

/**
 * Calculate human-readable overdue duration.
 */
const _getOverdueDuration = (dueDate) => {
  const now = new Date();
  const diffMs = now - dueDate;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }
  return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
};

module.exports = { sendReminder };
