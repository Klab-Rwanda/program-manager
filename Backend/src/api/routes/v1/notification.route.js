import { Router } from 'express';
import { 
    getMyNotifications, 
    markAllAsRead, 
    toggleNotificationReadStatus, // Renamed
    deleteNotification // New import
} from '../../controllers/notification.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJWT); // All notification routes require a logged-in user

router.route('/')
    .get(getMyNotifications);
    
router.route('/mark-all-read')
    .post(markAllAsRead);

// Updated route to toggle read status
router.route('/:id/toggle-read')
    .patch(toggleNotificationReadStatus);
    
// New route to delete a notification
router.route('/:id')
    .delete(deleteNotification);
    
export default router;