import { Router } from 'express';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import {
    createDailyUpdate,
    updateDailyUpdate,
    getMyDailyUpdates,
    getTodayUpdate,
    getAllDailyUpdates,
    reviewDailyUpdate,
    getTraineesForProgram,
    getTodaySubmissionStatus,
    exportDailyUpdates
} from '../../controllers/dailyUpdate.controller.js';

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Trainee routes
router.post('/', checkRole(['Trainee']), createDailyUpdate);
router.put('/:id', checkRole(['Trainee']), updateDailyUpdate);
router.get('/my-updates', checkRole(['Trainee']), getMyDailyUpdates);
router.get('/today/:programId', checkRole(['Trainee']), getTodayUpdate);

// Facilitator & Program Manager routes
router.get('/', checkRole(['Facilitator', 'Program Manager']), getAllDailyUpdates);
router.get('/export', checkRole(['Facilitator', 'Program Manager']), exportDailyUpdates);
router.patch('/:id/review', checkRole(['Facilitator', 'Program Manager']), reviewDailyUpdate);
router.get('/trainees/:programId', checkRole(['Facilitator', 'Program Manager']), getTraineesForProgram);
router.get('/today-status/:programId', checkRole(['Facilitator', 'Program Manager']), getTodaySubmissionStatus);

export default router;
