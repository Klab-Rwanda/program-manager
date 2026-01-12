import { Router } from 'express';
import * as announcementController from '../../controllers/announcement.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

// Get announcements for current user's programs
router.route('/my-announcements')
    .get(announcementController.getMyAnnouncements);

// Get announcements by program
router.route('/program/:programId')
    .get(announcementController.getAnnouncementsByProgram);

// Create announcement (Facilitator, Evaluator, Program Manager)
router.route('/')
    .post(
        checkRole(['Facilitator', 'Evaluator', 'Program Manager']),
        announcementController.createAnnouncement
    );

// Mark as read
router.route('/:announcementId/read')
    .patch(announcementController.markAsRead);

// Update announcement (author only)
router.route('/:announcementId')
    .patch(
        checkRole(['Facilitator', 'Evaluator', 'Program Manager']),
        announcementController.updateAnnouncement
    )
    .delete(
        checkRole(['Facilitator', 'Evaluator', 'Program Manager']),
        announcementController.deleteAnnouncement
    );

export default router;
