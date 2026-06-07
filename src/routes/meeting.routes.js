const express = require('express');
const router = express.Router();
const {
  createMeeting,
  listMeetings,
  getMeeting,
  analyzeMeetingEndpoint,
} = require('../controllers/meeting.controller');
const { createMeetingValidator } = require('../validators/meeting.validator');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');

// All meeting routes require authentication
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     TranscriptEntry:
 *       type: object
 *       properties:
 *         timestamp:
 *           type: string
 *           example: "00:10"
 *         speaker:
 *           type: string
 *           example: John
 *         text:
 *           type: string
 *           example: We should launch next Friday.
 *     Citation:
 *       type: object
 *       properties:
 *         timestamp:
 *           type: string
 *           example: "00:10"
 *     Meeting:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *         meetingDate:
 *           type: string
 *           format: date-time
 *         transcript:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TranscriptEntry'
 *         analysis:
 *           type: object
 *           nullable: true
 *         analyzedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     AnalysisResponse:
 *       type: object
 *       properties:
 *         summary:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               citations:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Citation'
 *         actionItems:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               task:
 *                 type: string
 *               assignee:
 *                 type: string
 *               citations:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Citation'
 *         decisions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               citations:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Citation'
 *         followUps:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               citations:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Citation'
 */

/**
 * @swagger
 * /api/meetings:
 *   post:
 *     summary: Create a new meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, meetingDate, transcript]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Sprint Planning
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["alice@example.com", "bob@example.com"]
 *               meetingDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-20T10:00:00Z"
 *               transcript:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TranscriptEntry'
 *     responses:
 *       201:
 *         description: Meeting created
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post('/', createMeetingValidator, validate, createMeeting);

/**
 * @swagger
 * /api/meetings:
 *   get:
 *     summary: List meetings with pagination
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by title (case-insensitive)
 *       - in: query
 *         name: participant
 *         schema:
 *           type: string
 *         description: Filter by participant email
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter meetings from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter meetings until this date
 *     responses:
 *       200:
 *         description: List of meetings with pagination
 *       401:
 *         description: Unauthorized
 */
router.get('/', listMeetings);

/**
 * @swagger
 * /api/meetings/{id}:
 *   get:
 *     summary: Get a single meeting by ID
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *     responses:
 *       200:
 *         description: Meeting details
 *       404:
 *         description: Meeting not found
 */
router.get('/:id', getMeeting);

/**
 * @swagger
 * /api/meetings/{id}/analyze:
 *   post:
 *     summary: Trigger AI analysis on a meeting transcript
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *     responses:
 *       200:
 *         description: Analysis results with citations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 traceId:
 *                   type: string
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AnalysisResponse'
 *       404:
 *         description: Meeting not found
 */
router.post('/:id/analyze', analyzeMeetingEndpoint);

module.exports = router;
