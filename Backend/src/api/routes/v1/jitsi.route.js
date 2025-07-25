import { Router } from 'express';
import { generateLiveKitToken } from '../../controllers/livekit.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJWT);

// Route will be /api/v1/livekit/token?roomName=some-room
router.route('/token').get(generateLiveKitToken);

export default router;