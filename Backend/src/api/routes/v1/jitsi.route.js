import { Router } from 'express';
import { generateJitsiToken } from '../../controllers/jitsi.controller.js';

const router = Router();

// No authentication required - anyone can access
router.route('/token/:roomName').get(generateJitsiToken);

export default router;