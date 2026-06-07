const express = require('express');
const router = express.Router();
const {
  createActionItem,
  listActionItems,
  updateStatus,
  getOverdueItems,
} = require('../controllers/actionItem.controller');
const {
  createActionItemValidator,
  updateStatusValidator,
} = require('../validators/actionItem.validator');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');

// All action item routes require authentication
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     ActionItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         task:
 *           type: string
 *         assignee:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED]
 *         dueDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         meetingId:
 *           type: string
 *           nullable: true
 *         citations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               timestamp:
 *                 type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/action-items:
 *   post:
 *     summary: Create a new action item
 *     tags: [Action Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task, assignee]
 *             properties:
 *               task:
 *                 type: string
 *                 example: Prepare release notes
 *               assignee:
 *                 type: string
 *                 example: Alice
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-25T00:00:00Z"
 *               meetingId:
 *                 type: string
 *                 description: Associated meeting ID
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED]
 *                 default: PENDING
 *     responses:
 *       201:
 *         description: Action item created
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post('/', createActionItemValidator, validate, createActionItem);

/**
 * @swagger
 * /api/action-items:
 *   get:
 *     summary: List action items with filtering
 *     tags: [Action Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED]
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: string
 *       - in: query
 *         name: meetingId
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: List of action items
 *       401:
 *         description: Unauthorized
 */
router.get('/', listActionItems);

/**
 * @swagger
 * /api/action-items/overdue:
 *   get:
 *     summary: Get overdue action items
 *     tags: [Action Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of overdue action items
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
 *                   type: object
 *                   properties:
 *                     overdueItems:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ActionItem'
 *                     count:
 *                       type: integer
 */
router.get('/overdue', getOverdueItems);

/**
 * @swagger
 * /api/action-items/{id}/status:
 *   patch:
 *     summary: Update action item status
 *     tags: [Action Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Action item not found
 */
router.patch('/:id/status', updateStatusValidator, validate, updateStatus);

module.exports = router;
