import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Attendance } from '../models/attendance.model.js';
import { ClassSession } from '../models/classSession.model.js';
import { Program } from '../models/program.model.js';
import { generateSessionQRCode, generateSessionId, verifySessionQRCode } from '../../services/qr.service.js';
import { isWithinRadius } from '../../services/geolocation.service.js';
import mongoose from 'mongoose';

// A reusable helper function to build robust queries for finding sessions by _id OR sessionId
const buildSessionQuery = (idFromParams, extraConditions = {}) => {
    let query = { ...extraConditions };
    if (mongoose.Types.ObjectId.isValid(idFromParams)) {
        query.$or = [{ _id: idFromParams }, { sessionId: idFromParams }];
    } else {
        query.sessionId = idFromParams;
    }
    return query;
};

// ===================================================================
//   FACILITATOR ENDPOINTS
// ===================================================================

const createSession = asyncHandler(async (req, res) => {
    const { type, programId, title, description } = req.body;
    if (!type || !programId || !title) {
        throw new ApiError(400, "Type, Program ID, and Title are required.");
    }
    const program = await Program.findById(programId);
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }

    const session = await ClassSession.create({
        type, programId, title, description,
        facilitatorId: req.user._id,
        sessionId: generateSessionId(),
        startTime: new Date(),
        status: 'scheduled',
        createdBy: req.user._id,
    });
    return res.status(201).json(new ApiResponse(201, session, "Session created successfully."));
});

const startOnlineSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const query = buildSessionQuery(idFromParams, { facilitatorId: req.user._id, type: 'online' });
    const session = await ClassSession.findOne(query);

    if (!session) throw new ApiError(404, "Online session not found.");
    if (session.status === 'active') return res.status(200).json(new ApiResponse(200, { session }, "Session is already active."));
    if (session.status !== 'scheduled') throw new ApiError(400, "Session is already completed or cancelled.");

    session.status = 'active';
    session.accessLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/classroom/${session.sessionId}`;
    await session.save();
    return res.status(200).json(new ApiResponse(200, { session }, "Online session started successfully."));
});

const startPhysicalSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const { latitude, longitude, radius = 50 } = req.body; // Facilitator provides their location

    // --- GEOLOCATION FIX ---
    if (!latitude || !longitude) {
        throw new ApiError(400, "Your location (latitude and longitude) is required to start a physical session.");
    }

    const query = buildSessionQuery(idFromParams, { facilitatorId: req.user._id, type: 'physical' });
    const session = await ClassSession.findOne(query);

    if (!session) throw new ApiError(404, "Physical session not found.");
    if (session.status !== 'scheduled') throw new ApiError(400, "Session is already active or completed.");

    session.status = 'active';
    // Save the class location based on where the facilitator started it
    session.location = {
        lat: latitude,
        lng: longitude,
        radius: radius
    };
    await session.save();
    // --- END OF FIX ---

    return res.status(200).json(new ApiResponse(200, session, "Physical session started successfully."));
});


const openQrForSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const query = buildSessionQuery(idFromParams, { facilitatorId: req.user._id, type: 'online', status: 'active' });
    const session = await ClassSession.findOne(query);

    if (!session) throw new ApiError(404, "Active online session not found.");

    const qrResult = await generateSessionQRCode(session.sessionId, 5);
    session.qrCodeData = qrResult.qrData;
    await session.save();
    return res.status(200).json(new ApiResponse(200, { qrCodeImage: qrResult.qrCodeImage, expiresAt: qrResult.expiresAt }));
});

const markPhysicalAttendance = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const { latitude, longitude } = req.body;
    const query = buildSessionQuery(idFromParams, { facilitatorId: req.user._id, type: 'physical' });
    const session = await ClassSession.findOne(query);

    if (!session) throw new ApiError(404, "Physical session not found for you.");

    const attendance = await Attendance.findOneAndUpdate(
        { userId: req.user._id, sessionId: session._id },
        {
            $setOnInsert: { userId: req.user._id, sessionId: session._id },
            $set: { timestamp: new Date(), method: 'geolocation', status: 'Present', location: { lat: latitude, lng: longitude } }
        }, { upsert: true, new: true }
    );
    return res.status(201).json(new ApiResponse(201, { attendance }));
});


// ===================================================================
//   TRAINEE ENDPOINTS
// ===================================================================

const markQRAttendance = asyncHandler(async (req, res) => {
    const { qrData } = req.body;
    if (!qrData) throw new ApiError(400, "QR code data is required.");

    const qrResult = verifySessionQRCode(qrData);
    if (!qrResult) throw new ApiError(400, "Invalid or expired QR code.");

    const session = await ClassSession.findOne({ sessionId: qrResult.sessionId, status: 'active' });
    if (!session) throw new ApiError(404, "Session not found or not active.");

    const program = await Program.findById(session.programId);
    if (!program || !program.trainees.includes(req.user._id)) {
        throw new ApiError(403, "You are not enrolled in this program's session.");
    }

    const todayDateString = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOneAndUpdate(
        { userId: req.user._id, programId: session.programId, date: todayDateString },
        { 
            $set: { checkIn: new Date(), method: 'qr_code', status: 'Present', sessionId: session._id },
            $setOnInsert: { userId: req.user._id, programId: session.programId, date: todayDateString }
        },
        { upsert: true, new: true, runValidators: true }
    );

    return res.status(201).json(new ApiResponse(201, { attendance }, "QR attendance marked successfully."));
});

const markGeolocationAttendance = asyncHandler(async (req, res) => {
    const { sessionId, latitude, longitude } = req.body;
    if (!sessionId) throw new ApiError(400, "Session ID is required.");

    const session = await ClassSession.findOne({ sessionId, type: 'physical', status: 'active' });
    if (!session) throw new ApiError(404, "Active physical session not found.");

    const program = await Program.findById(session.programId);
    if (!program || !program.trainees.includes(req.user._id)) {
        throw new ApiError(403, "You are not enrolled in this program.");
    }
    
    const classLocation = session.location || { lat: -1.9441, lng: 30.0619, radius: 100 };
    if (!isWithinRadius({ lat: latitude, lng: longitude }, classLocation)) {
        throw new ApiError(400, "You are not within the required class location radius.");
    }

    const todayDateString = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOneAndUpdate(
        { userId: req.user._id, programId: session.programId, date: todayDateString },
        { 
            $set: { checkIn: new Date(), method: 'geolocation', status: 'Present', locationCheckIn: { lat: latitude, lng: longitude }, sessionId: session._id },
            $setOnInsert: { userId: req.user._id, programId: session.programId, date: todayDateString }
        },
        { upsert: true, new: true, runValidators: true }
    );
    return res.status(201).json(new ApiResponse(201, { attendance }, "Geolocation attendance marked successfully."));
});


// ===================================================================
//   GENERAL/REPORTING ENDPOINTS
// ===================================================================

const getSessionDetails = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const query = buildSessionQuery(idFromParams);
    const session = await ClassSession.findOne(query).populate('facilitatorId', 'name email').populate('programId', 'name');
    if (!session) throw new ApiError(404, "Session could not be found.");
    const attendanceCount = await Attendance.countDocuments({ sessionId: session._id, status: 'Present' });
    return res.status(200).json(new ApiResponse(200, { session, attendanceCount }));
});

const getSessionAttendance = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const query = buildSessionQuery(idFromParams);
    const session = await ClassSession.findOne(query);
    if (!session) throw new ApiError(404, "Session not found.");
    const attendance = await Attendance.find({ sessionId: session._id }).populate('userId', 'name email').populate('markedBy', 'name').sort({ timestamp: -1 });
    return res.status(200).json(new ApiResponse(200, attendance, "Attendance report retrieved successfully."));
});

const getFacilitatorSessions = asyncHandler(async (req, res) => {
    const sessions = await ClassSession.find({ facilitatorId: req.user._id }).sort({ startTime: -1 }).populate('programId', 'name');
    return res.status(200).json(new ApiResponse(200, sessions, "Sessions retrieved successfully."));
});

const getTraineeSessions = asyncHandler(async (req, res) => {
    const programs = await Program.find({ trainees: req.user._id });
    const programIds = programs.map(p => p._id);
    const sessions = await ClassSession.find({ programId: { $in: programIds } }).sort({ startTime: -1 }).populate('programId', 'name');
    return res.status(200).json(new ApiResponse(200, sessions, "Your sessions retrieved successfully."));
});


// ===================================================================
//   LEGACY / OTHER ENDPOINTS (INCLUDED AND FIXED)
// ===================================================================

const markManualStudentAttendance = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { userId, status = 'present', reason } = req.body;

    if (!userId) throw new ApiError(400, "User ID is required.");
    const session = await ClassSession.findOne({ sessionId });
    if (!session) throw new ApiError(404, "Session not found.");

    const todayDateString = new Date(session.startTime).toISOString().split('T')[0];

    const attendance = await Attendance.findOneAndUpdate(
        { userId: userId, programId: session.programId, date: todayDateString },
        { 
            $set: { status, reason: reason || null, method: 'manual', markedBy: req.user._id, sessionId: session._id },
            $setOnInsert: { userId: userId, programId: session.programId, date: todayDateString }
        },
        { upsert: true, new: true, runValidators: true }
    );

    const message = `Attendance for user ${userId} has been set to ${status}.`;
    return res.status(200).json(new ApiResponse(200, attendance, message));
});

const markAttendance = asyncHandler(async (req, res) => {
    const { method } = req.body;
    if (method === 'qr_code') return markQRAttendance(req, res);
    if (method === 'geolocation') return markGeolocationAttendance(req, res);
    throw new ApiError(400, "Invalid attendance method.");
});

const getSessionQRCode = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const qrResult = await generateSessionQRCode(sessionId);
    return res.status(200).json(new ApiResponse(200, { qrCodeImage: qrResult.qrCodeImage }));
});

const getProgramAttendanceReport = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const { startDate, endDate } = req.query;

    if (!programId || !startDate || !endDate) {
        throw new ApiError(400, "Program ID, start date, and end date are required.");
    }

    const attendanceRecords = await Attendance.find({
        programId: programId,
        date: { $gte: startDate, $lte: endDate }
    })
    .populate('userId', 'name email role')
    .sort({ date: -1 });

    return res.status(200).json(new ApiResponse(200, attendanceRecords, "Program attendance report fetched successfully."));
});
const getMyAttendanceHistory = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;
    const { programId } = req.query;

    let query = { userId: traineeId };
    if (programId) {
        // This is a valid query condition because 'programId' is in the schema
        query.programId = programId;
    }

    // --- THIS IS THE FIX ---
    // The field name in the schema is 'programId', so we must populate 'programId'.
    const attendanceRecords = await Attendance.find(query)
        .populate('programId', 'name') // Corrected from 'program'
        .sort({ date: -1 });
    // --- END OF FIX ---
    
    return res.status(200).json(new ApiResponse(200, attendanceRecords, "Your attendance history fetched successfully."));
});


const endSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    
    const query = buildSessionQuery(idFromParams, { 
        facilitatorId: req.user._id,
        status: 'active' 
    });
    const session = await ClassSession.findOne(query);

    if (!session) {
        throw new ApiError(404, "Active session not found or you don't have permission to end it.");
    }

    session.status = 'completed';
    session.endTime = new Date();
    await session.save();

    // Optional: Notify trainees via WebSocket that the session has ended
    // You would need to get the 'io' instance here if you want to do this.
    // For now, we'll keep it simple.

    return res.status(200).json(new ApiResponse(200, session, "Session has been ended successfully."));
});


export {
    // Facilitator
    createSession,
    startOnlineSession,
    startPhysicalSession,
    markPhysicalAttendance,
    openQrForSession,
    
    // Trainee
    markQRAttendance,
    markGeolocationAttendance,
    
    // General
    getSessionDetails,
    getSessionAttendance,
    getFacilitatorSessions,
    getTraineeSessions,
    endSession,
    
    // Legacy / Other
    markAttendance,
    getSessionQRCode,
    markManualStudentAttendance,
    getProgramAttendanceReport,
    getMyAttendanceHistory
};