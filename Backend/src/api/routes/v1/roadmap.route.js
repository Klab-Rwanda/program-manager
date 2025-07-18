import { Router } from 'express';
import * as roadmapController from '../../controllers/roadmap.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT, checkRole(['Facilitator']));

// Create a new weekly roadmap
router.route('/').post(roadmapController.createRoadmap);

// Get all roadmaps for a program the facilitator manages
router.route('/program/:programId').get(roadmapController.getRoadmapsForProgram);

export default router;