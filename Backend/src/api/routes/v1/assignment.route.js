import { Router } from 'express';
import * as assignmentController from '../../controllers/assignment.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);
router.route('/program/:programId').get(checkRole(['Trainee']), assignmentController.getAssignmentsForProgram);
// Facilitator routes
router.route('/')
    .post(checkRole(['Facilitator']), assignmentController.createAssignment);

router.route('/my-assignments')
    .get(checkRole(['Facilitator']), assignmentController.getMyCreatedAssignments);

router.route('/:id')
    .patch(checkRole(['Facilitator']), assignmentController.updateAssignment)
    .delete(checkRole(['Facilitator']), assignmentController.deleteAssignment);

router.route('/:id/resend-notifications')
    .post(checkRole(['Facilitator']), assignmentController.resendAssignmentNotifications);

// Shared route for Trainees and Facilitators
router.route('/course/:courseId')
    .get(checkRole(['Facilitator', 'Trainee']), assignmentController.getAssignmentsForCourse);

    router.route('/my-available')
    .get(checkRole(['Trainee']), assignmentController.getMyAvailableAssignments);

export default router;