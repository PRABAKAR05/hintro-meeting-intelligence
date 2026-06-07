const app = require('./src/app');
const connectDB = require('./src/config/db');
const config = require('./src/config/env');
const logger = require('./src/config/logger');
const { startScheduler } = require('./src/services/scheduler.service');

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start the Express server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`📚 API Docs: http://localhost:${config.port}/api-docs`);
      logger.info(`❤️  Health:   http://localhost:${config.port}/health`);
    });

    // Start the reminder scheduler
    startScheduler();

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled rejection', { error: err.message, stack: err.stack });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception', { error: err.message, stack: err.stack });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();
