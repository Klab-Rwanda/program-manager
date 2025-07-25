import { Router } from 'express';
import * as roadmapController from '../../controllers/roadmap.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

/**
 * @openapi
 * /roadmap:
 *   post:
 *     tags: [Roadmap]
 *     summary: Create a new weekly plan
 *     description: (Facilitator only) Creates a new weekly roadmap plan for a program
 *     security: { bearerAuth: [] }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [program, weekNumber, title, startDate]
 *             properties:
 *               program: { type: string, description: 'Program ID' }
 *               weekNumber: { type: number, description: 'Week number' }
 *               title: { type: string, description: 'Week title' }
 *               startDate: { type: string, format: 'date', description: 'Start date' }
 *               objectives: { type: array, items: { type: string }, description: 'Learning objectives' }
 *               topics: { type: array, items: { type: object }, description: 'Daily topics' }
 *     responses:
 *       201: { description: 'Weekly plan created successfully.' }
 *       400: { description: 'Missing required fields.' }
 *       500: { description: 'Failed to create weekly plan.' }
 */
router.route('/').post(
    checkRole(['Facilitator']),
    roadmapController.createWeekPlan
);

/**
 * @openapi
 * /roadmap/{programId}:
 *   get:
 *     tags: [Roadmap]
 *     summary: Get all weekly plans for a specific program
 *     description: (Facilitator only) Retrieves all weekly roadmap plans for a given program
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: programId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Program roadmap fetched successfully.' }
 *       400: { description: 'Program ID is required.' }
 */
router.route('/:programId').get(
    checkRole(['Facilitator']),
    roadmapController.getProgramRoadmap
);

/**
 * @openapi
 * /roadmap/week/{id}:
 *   get:
 *     tags: [Roadmap]
 *     summary: Get a single weekly plan by ID
 *     description: (Facilitator only) Retrieves a specific weekly plan by its ID
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Weekly plan fetched successfully.' }
 *       404: { description: 'Weekly plan not found.' }
 *   put:
 *     tags: [Roadmap]
 *     summary: Update a weekly plan
 *     description: (Facilitator only) Updates an existing weekly plan
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               startDate: { type: string, format: 'date' }
 *               objectives: { type: array, items: { type: string } }
 *               topics: { type: array, items: { type: object } }
 *     responses:
 *       200: { description: 'Weekly plan updated successfully.' }
 *       404: { description: 'Weekly plan not found.' }
 *   delete:
 *     tags: [Roadmap]
 *     summary: Delete a weekly plan
 *     description: (Facilitator only) Deletes a weekly plan
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Weekly plan deleted successfully.' }
 *       404: { description: 'Weekly plan not found.' }
 */
router.route('/week/:id')
    .get(checkRole(['Facilitator']), roadmapController.getWeekPlanById)
    .put(checkRole(['Facilitator']), roadmapController.updateWeekPlan)
    .delete(checkRole(['Facilitator']), roadmapController.deleteWeekPlan);

/**
 * @openapi
 * /roadmap/week/{id}/topic-status:
 *   patch:
 *     tags: [Roadmap]
 *     summary: Update topic completion status
 *     description: (Facilitator only) Updates the completion status of a specific topic
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topicIndex, completed]
 *             properties:
 *               topicIndex: { type: number, description: 'Index of the topic to update' }
 *               completed: { type: boolean, description: 'Completion status' }
 *     responses:
 *       200: { description: 'Topic status updated successfully.' }
 *       400: { description: 'Invalid topic index or missing parameters.' }
 *       404: { description: 'Weekly plan not found.' }
 */
router.route('/week/:id/topic-status').patch(
    checkRole(['Facilitator']),
    roadmapController.updateTopicStatus
);

/**
 * @openapi
 * /roadmap/week/{id}/submit:
 *   post:
 *     tags: [Roadmap]
 *     summary: Submit week plan for approval
 *     description: (Facilitator only) Submits a draft week plan for program manager approval
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: 'Week plan submitted for approval successfully.' }
 *       404: { description: 'Weekly plan not found.' }
 */
router.route('/week/:id/submit').post(
    checkRole(['Facilitator']),
    roadmapController.submitForApproval
);

/**
 * @openapi
 * /roadmap/week/{id}/approve:
 *   post:
 *     tags: [Roadmap]
 *     summary: Approve or reject week plan
 *     description: (Program Manager only) Approves or rejects a pending week plan
 *     security: { bearerAuth: [] }
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: ['approve', 'reject'] }
 *               feedback: { type: string, description: 'Optional feedback for rejection' }
 *     responses:
 *       200: { description: 'Week plan approved/rejected successfully.' }
 *       400: { description: 'Invalid action or week plan not pending approval.' }
 *       404: { description: 'Weekly plan not found.' }
 */
router.route('/week/:id/approve').post(
    checkRole(['Program Manager']),
    roadmapController.approveWeekPlan
);

export default router; 