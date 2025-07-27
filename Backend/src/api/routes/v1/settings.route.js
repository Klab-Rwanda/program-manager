import { Router } from 'express';
import { getSettings, updateSettings } from '../../controllers/settings.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = Router();

// Secure all routes in this file for SuperAdmins only
router.use(verifyJWT, checkRole(['SuperAdmin']));

router.route('/')
    .get(getSettings)
    .patch(updateSettings);

export default router;