const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const traceIdMiddleware = require('./middleware/traceId');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');
const { successResponse } = require('./utils/apiResponse');

// Import routes
const authRoutes = require('./routes/auth.routes');
const meetingRoutes = require('./routes/meeting.routes');
const actionItemRoutes = require('./routes/actionItem.routes');
const evaluationRoutes = require('./routes/evaluation.routes');

const app = express();

// ─── Security & Parsing ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Trace ID (before logging) ─────────────────────────────────────────────
app.use(traceIdMiddleware);

// ─── Request Logging ────────────────────────────────────────────────────────
app.use(
  morgan(
    (tokens, req, res) => {
      return JSON.stringify({
        traceId: req.traceId,
        method: tokens.method(req, res),
        path: tokens.url(req, res),
        status: tokens.status(req, res),
        responseTime: `${tokens['response-time'](req, res)}ms`,
      });
    },
    {
      stream: {
        write: (message) => {
          try {
            const log = JSON.parse(message.trim());
            logger.info('HTTP Request', log);
          } catch {
            logger.info(message.trim());
          }
        },
      },
    }
  )
);

// ─── Swagger / OpenAPI Documentation ────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hintro Meeting Intelligence API',
      version: '1.0.0',
      description:
        'AI-powered Meeting Intelligence Service that helps users manage meetings, ' +
        'extract actionable insights, and stay on top of follow-ups.',
      contact: {
        name: 'Prabakar',
        email: 'ppraba0705@gmail.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? process.env.DEPLOYED_URL || 'https://hintro-meeting-intelligence.onrender.com'
          : `http://localhost:${process.env.PORT || 3000}`,
        description:
          process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', (req, res, next) => {
  if (!req.originalUrl.endsWith('/')) {
    return res.redirect(`${req.originalUrl}/`);
  }
  next();
}, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Hintro Meeting Intelligence API Docs',
}));

// Serve the raw OpenAPI spec as JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── Root Redirect ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});


// ─── Health Check ───────────────────────────────────────────────────────────
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is running
 */
app.get('/health', (req, res) => {
  return successResponse(res, { status: 'UP' });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/action-items', actionItemRoutes);
app.use('/api/evaluation', evaluationRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  return res.status(404).json({
    traceId: req.traceId || 'unknown',
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
