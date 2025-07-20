import express from 'express';
import { 
    // Facilitator endpoints
    createSession,
    startOnlineSession,
    markPhysicalAttendance,
    
    // Trainee endpoints
    markQRAttendance,
    markGeolocationAttendance,
    
    // General endpoints
    getSessionDetails,
    getSessionAttendance,
    getFacilitatorSessions,
    getTraineeSessions,
    
    // Legacy endpoints
    markAttendance,
    getSessionQRCode
} from '../../controllers/attendance.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { checkRole as verifyRole } from '../../middlewares/role.middleware.js';

const router = express.Router();

// Apply JWT verification to all routes
router.use(verifyJWT);

// ===================================================================
//   FACILITATOR ROUTES
// ===================================================================

// Create a new class session
router.post('/sessions', 
    verifyRole(['Facilitator']), 
    createSession
);

// Start an online session and generate QR code
router.post('/sessions/:sessionId/start-online', 
    verifyRole(['Facilitator']), 
    startOnlineSession
);

// Mark attendance for physical class (facilitator)
router.post('/sessions/:sessionId/physical-attendance', 
    verifyRole(['Facilitator']), 
    markPhysicalAttendance
);

// Get facilitator's sessions
router.get('/facilitator/sessions', 
    verifyRole(['Facilitator']), 
    getFacilitatorSessions
);

// ===================================================================
//   TRAINEE ROUTES
// ===================================================================

// Mark attendance using QR code
router.post('/qr-attendance', 
    verifyRole(['Trainee']), 
    markQRAttendance
);

// Mark attendance using geolocation
router.post('/geolocation-attendance', 
    verifyRole(['Trainee']), 
    markGeolocationAttendance
);

// Get trainee's sessions
router.get('/trainee/sessions', 
    verifyRole(['Trainee']), 
    getTraineeSessions
);

// ===================================================================
//   GENERAL ROUTES
// ===================================================================

// Get session details
router.get('/sessions/:sessionId', 
    verifyRole(['Facilitator', 'Trainee', 'ProgramManager', 'SuperAdmin']), 
    getSessionDetails
);

// Get attendance report for a session
router.get('/sessions/:sessionId/attendance', 
    verifyRole(['Facilitator', 'Trainee', 'ProgramManager', 'SuperAdmin']), 
    getSessionAttendance
);

// ===================================================================
//   LEGACY ROUTES (for backward compatibility)
// ===================================================================

// Legacy attendance marking
router.post('/mark', markAttendance);

// Legacy QR code generation
router.get('/qr/:sessionId', getSessionQRCode);

export default router;