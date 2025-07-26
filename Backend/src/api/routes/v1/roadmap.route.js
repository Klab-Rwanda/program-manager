import { Router } from 'express';
import * as roadmapController from '../../controllers/roadmap.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

// Shared route for both roles
router.route('/my-roadmaps')
    .get(checkRole(['Facilitator', 'Trainee']), roadmapController.getMyRoadmaps);

// Program Manager routes - put these BEFORE the generic :id routes
router.route('/pending-approval').get(
    checkRole(['Program Manager']),
    roadmapController.getPendingApprovalRoadmaps
);

router.route('/course/:courseId').get(
    checkRole(['Program Manager']),
    roadmapController.getRoadmapsByCourse
);

router.route('/:roadmapId/assignments-with-marks').get(
    checkRole(['Program Manager']),
    roadmapController.getRoadmapAssignmentsWithMarks
);

router.route('/:roadmapId/approve').patch(
    checkRole(['Program Manager']),
    roadmapController.approveRoadmap
);

router.route('/:roadmapId/reject').patch(
    checkRole(['Program Manager']),
    roadmapController.rejectRoadmap
);

// Get all roadmaps for Program Manager
router.route('/all').get(
    checkRole(['Program Manager']),
    roadmapController.getAllRoadmaps
);

// Facilitator-only routes
router.route('/')
    .post(checkRole(['Facilitator']), roadmapController.createOrUpdateRoadmap);

router.route('/:id')
    .delete(checkRole(['Facilitator']), roadmapController.deleteRoadmap);

export default router;