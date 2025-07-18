import { Router } from 'express';
import { 
    getDashboardStats, 
    getProgramManagerStats, 
    getFacilitatorDashboard 
} from '../../controllers/dashboard.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();

// Apply JWT verification to all dashboard routes
router.use(verifyJWT);

/**
 * @openapi
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary statistics (for Admins/Managers)
 *     description: Retrieves key statistics for the dashboard homepage.
 *     security: { bearerAuth: [] }
 *     responses:
 *       200: { description: 'An object containing dashboard statistics.' }
 */
// FIX: Apply middleware specifically to this route
router.route('/stats').get(checkRole(['SuperAdmin', 'Program Manager']), getDashboardStats);

/**
 * @openapi
 * /dashboard/pm/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get Program Manager specific stats
 *     security: { bearerAuth: [] }
 *     responses:
 *       200: { description: 'An object containing Program Manager statistics.' }
 */
// FIX: Apply middleware specifically to this route
router.route('/pm/stats').get(checkRole(['Program Manager']), getProgramManagerStats);

/**
 * @openapi
 * /dashboard/facilitator:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary for a Facilitator
 *     security: { bearerAuth: [] }
 *     responses:
 *       200: { description: 'An object containing facilitator dashboard statistics.' }
 */
// FIX: Apply middleware specifically to this route
router.route('/facilitator').get(checkRole(['Facilitator']), getFacilitatorDashboard);

export default router;