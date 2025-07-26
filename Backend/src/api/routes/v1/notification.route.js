import { Router } from 'express';
import { getMyNotifications, markAllAsRead, markOneAsRead } from '../../controllers/notification.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJWT); // All notification routes require a logged-in user

router.route('/')
    .get(getMyNotifications);
    
router.route('/mark-all-read')
    .post(markAllAsRead);

router.route('/:id/read')
    .patch(markOneAsRead);
    
export default router;