const express = require('express');
const router = express.Router();
const { getEvaluation } = require('../controllers/evaluation.controller');

/**
 * @swagger
 * /api/evaluation:
 *   get:
 *     summary: Get candidate and project evaluation information
 *     tags: [Evaluation]
 *     responses:
 *       200:
 *         description: Evaluation information
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
 *                     candidateName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     repositoryUrl:
 *                       type: string
 *                     deployedUrl:
 *                       type: string
 *                     externalIntegration:
 *                       type: string
 *                     features:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/', getEvaluation);

module.exports = router;
