const { successResponse } = require('../utils/apiResponse');

/**
 * GET /api/evaluation
 * Returns candidate and project information for evaluation.
 */
const getEvaluation = (req, res) => {
  return successResponse(res, {
    candidateName: 'Prabakar',
    email: 'ppraba0705@gmail.com',
    repositoryUrl: 'https://github.com/prabakar/hintro-meeting-intelligence',
    deployedUrl: 'https://hintro-meeting-intelligence.onrender.com',
    externalIntegration: 'Telegram Bot API',
    features: [
      'JWT Authentication',
      'Meeting CRUD with Transcript Storage',
      'AI-Powered Meeting Analysis (Groq)',
      'Grounded Citations from Transcript',
      'Action Item Management',
      'Overdue Action Item Detection',
      'Scheduled Reminder Job (node-cron)',
      'Telegram Bot Notifications',
      'Swagger/OpenAPI Documentation',
      'Structured Logging with Trace IDs',
      'Input Validation',
      'Global Error Handling',
      'Unified API Response Format',
      'Docker Support',
    ],
  });
};

module.exports = { getEvaluation };
