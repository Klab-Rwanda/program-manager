import { Router } from 'express';
import * as roadmapController from '../../controllers/roadmap.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

// Shared route for both roles
router.route('/my-roadmaps')
    .get(checkRole(['Facilitator', 'Trainee']), roadmapController.getMyRoadmaps);

// Facilitator-only routes
router.route('/')
    .post(checkRole(['Facilitator']), roadmapController.createOrUpdateRoadmap);

router.route('/:id')
    .delete(checkRole(['Facilitator']), roadmapController.deleteRoadmap);

export default router;