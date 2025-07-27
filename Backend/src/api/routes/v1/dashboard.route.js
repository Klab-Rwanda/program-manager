import { Router } from 'express';
import { getAdminOverview, getDashboardStats, getFacilitatorDashboardStats, getRecentActivity } from '../../controllers/dashboard.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

/**
 * @openapi
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary statistics
 *     description: Retrieves key statistics for the dashboard homepage, such as total users, active programs, etc.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: An object containing dashboard statistics.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPrograms: { type: integer }
 *                 activeTrainees: { type: integer }
 *                 totalUsers: { type: integer }
 *                 pendingApprovals: { type: integer }
 */
// SuperAdmin and Program Manager dashboard stats
router.route('/stats').get(checkRole(['SuperAdmin', 'Program Manager']), getDashboardStats);

// Facilitator dashboard stats
router.route('/facilitator-stats').get(checkRole(['Facilitator']), getFacilitatorDashboardStats);
router.route('/admin-overview').get(checkRole(['SuperAdmin', 'Program Manager']), getAdminOverview);

// Recent activity for dashboard
router.route('/recent-activity').get(checkRole(['SuperAdmin', 'Program Manager']), getRecentActivity);

export default router;