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
    getSessionQRCode,
    markManualStudentAttendance,
    startPhysicalSession,
    openQrForSession,
    getProgramAttendanceReport,
    getMyAttendanceHistory,
    endSession,
    getProgramAttendanceSummary,
    deleteSession,
    getProgramSessionCounts
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

router.delete('/sessions/:sessionId', 
    verifyRole(['Facilitator']), 
    deleteSession
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
router.post('/sessions/:sessionId/manual-attendance',
    verifyRole(['Facilitator', 'Program Manager']), // Only facilitators or PMs can manually mark
    markManualStudentAttendance
);

router.post('/sessions/:sessionId/start-physical', 
    verifyRole(['Facilitator']), 
    startPhysicalSession // Add this new route
);

router.post('/sessions/:sessionId/open-qr', 
    verifyRole(['Facilitator']), 
    openQrForSession // Add this new route
);

router.get('/report/program/:programId/summary',
    verifyRole(['Program Manager', 'SuperAdmin']),
    getProgramAttendanceSummary // Add this new route
);
router.get('/report/program/:programId', 
    verifyRole(['Program Manager', 'SuperAdmin']), 
    getProgramAttendanceReport 
);

router.get('/my-history', 
    verifyRole(['Trainee']), 
    getMyAttendanceHistory
);
router.post('/sessions/:sessionId/end', 
    verifyRole(['Facilitator']), 
    endSession
);

router.get('/sessions/:sessionId/report', 
    verifyRole(['Facilitator', 'ProgramManager', 'SuperAdmin']), 
    getSessionAttendance 
);

router.get('/sessions/program/:programId/counts', 
    verifyRole(['Facilitator', 'ProgramManager', 'SuperAdmin']), 
    getProgramSessionCounts
);
export default router;