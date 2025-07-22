import { Router } from 'express';
import { getUnreadNotifications, markAllAsRead } from '../../controllers/notification.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';

const router = Router();

// Apply JWT verification to all notification routes
router.use(verifyJWT);

router.route('/unread').get(getUnreadNotifications);
router.route('/read-all').post(markAllAsRead);

export default router;