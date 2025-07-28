import { Router } from 'express';
import * as submissionController from '../../controllers/submission.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router();
router.use(verifyJWT);

/**
 * @openapi
 * /submissions:
 *   post:
 *     tags: [Submissions]
 *     summary: Submit a project file for an assignment
 *     description: (Trainee only) Uploads a project file for a specific assignment. Replaces existing submission if status is not 'Reviewed'/'Graded'.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               assignmentId: { type: string, description: "ID of the assignment this submission is for." }
 *               projectFile:
 *                 type: string
 *                 format: binary
 *                 description: The project file (e.g., .zip, .pdf, .txt).
 *     responses:
 *       201: { description: 'Project submitted successfully.' }
 *       200: { description: 'Project re-submitted successfully.' }
 *       400: { description: 'Bad request (missing fields, already reviewed).' }
 *       403: { description: 'Forbidden (not enrolled in program).' }
 *       404: { description: 'Assignment not found.' }
 */
router.route('/').post(
    checkRole(['Trainee']), 
    upload.single('projectFile'), 
    submissionController.createSubmission
);

/**
 * @openapi
 * /submissions/facilitator:
 *   get:
 *     tags: [Submissions]
 *     summary: Get all submissions for a facilitator's programs/courses
 *     description: (Facilitator only) Retrieves all project submissions related to programs/courses managed by the logged-in facilitator.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'A list of submissions relevant to the facilitator.' }
 */
router.route('/facilitator').get(
    checkRole(['Facilitator']), 
    submissionController.getSubmissionsForFacilitator
);

/**
 * @openapi
 * /submissions/{submissionId}/review:
 *   patch:
 *     tags: [Submissions]
 *     summary: Review a submission (grade and feedback)
 *     description: (Facilitator only) Adds a status, grade, and feedback to a trainee's submission. Requires the facilitator to be assigned to the corresponding assignment.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: submissionId, in: path, required: true, schema: { type: string }, description: "ID of the submission to review." }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [Reviewed, NeedsRevision], example: "Reviewed" }
 *               feedback: { type: string, example: "Excellent work, but please add more comments." }
 *               grade: { type: number, example: 95, description: "Numeric grade (0-100). Required if status is 'Reviewed'." }
 *     responses:
 *       200: { description: 'Submission reviewed successfully.' }
 *       400: { description: 'Bad request (invalid status, missing grade).' }
 *       403: { description: 'Forbidden (not the facilitator for this submission).' }
 *       404: { description: 'Submission not found.' }
 */
router.route('/:submissionId/review').patch(
    checkRole(['Facilitator']), 
    submissionController.reviewSubmission
);

/**
 * @openapi
 * /submissions/my-submissions:
 *   get:
 *     tags: [Submissions]
 *     summary: Get all submissions by the logged-in trainee
 *     description: (Trainee only) Retrieves all project submissions made by the currently logged-in trainee.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: 'A list of the trainee\'s submissions.' }
 */
router.route('/my-submissions').get(
    checkRole(['Trainee']), 
    submissionController.getMySubmissions
);

export default router;