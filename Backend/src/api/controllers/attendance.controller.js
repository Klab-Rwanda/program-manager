import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Attendance } from '../models/attendance.model.js';
import { ClassSession } from '../models/classSession.model.js';
import { Program } from '../models/program.model.js';
import { User } from '../models/user.model.js';
import { generateSessionQRCode, generateSessionId, verifySessionQRCode } from '../../services/qr.service.js';
import { isWithinRadius, validateLocation } from '../../services/geolocation.service.js';
import mongoose from 'mongoose';

// ===================================================================
//   FACILITATOR ENDPOINTS
// ===================================================================

/**
 * Create a new class session (Physical or Online)
 */
const createSession = asyncHandler(async (req, res) => {
    try {
        console.log('Creating session with data:', req.body);
        
        const { type, programId, title, description, startTime, endTime, allowLateAttendance, lateThreshold } = req.body;

        // Validate required fields
        if (!type || !programId || !title) {
            throw new ApiError(400, "Type, program ID, and title are required.");
        }

        // Validate program exists
        const program = await Program.findById(programId);
        if (!program) {
            throw new ApiError(404, "Program not found.");
        }

        // Generate unique session ID
        const sessionId = generateSessionId();

        // Create the session
        const sessionData = {
            type,
            programId,
            facilitatorId: req.user._id,
            sessionId,
            title,
            description: description || '',
            startTime: new Date(startTime || Date.now()),
            endTime: endTime ? new Date(endTime) : null,
            status: 'scheduled',
            allowLateAttendance: allowLateAttendance !== undefined ? allowLateAttendance : true,
            lateThreshold: lateThreshold || 15,
            createdBy: req.user._id,
            accessLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/classroom?sessionId=${sessionId}`,
            totalExpected: 0,
            totalPresent: 0,
            totalAbsent: 0
        };

        const session = await ClassSession.create(sessionData);

        // Populate the session with program and facilitator details
        const populatedSession = await ClassSession.findById(session._id)
            .populate('programId', 'name')
            .populate('facilitatorId', 'name email');

        console.log('Session created successfully:', session._id);

        return res.status(201).json(
            new ApiResponse(201, populatedSession, "Class session created successfully.")
        );
    } catch (error) {
        console.error('Error in createSession:', error);
        throw error;
    }
});

/**
 * Start an online session and generate QR code
 */
const startOnlineSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const { expirationMinutes = 15 } = req.body;

    // --- THIS IS THE FIX ---
    // We will build the query object conditionally to avoid the CastError.
    
    const query = {
        facilitatorId: req.user._id,
        type: 'online'
    };

    // Check if the provided ID is a valid MongoDB ObjectId format.
    if (mongoose.Types.ObjectId.isValid(idFromParams)) {
        // If it's a valid format, it could be an _id.
        // We still check both fields in case an old link is used.
        query.$or = [{ _id: idFromParams }, { sessionId: idFromParams }];
    } else {
        // If it's NOT a valid ObjectId format, it can ONLY be a sessionId.
        // This prevents Mongoose from trying to cast it to an ObjectId.
        query.sessionId = idFromParams;
    }

    const session = await ClassSession.findOne(query);
    // --- END OF FIX ---


    if (!session) {
        throw new ApiError(404, "Online session not found or you don't have permission to start it.");
    }

    if (session.status !== 'scheduled') {
        throw new ApiError(400, "Session is already active or completed.");
    }

    // Generate QR code using the correct unique sessionId
    const qrResult = await generateSessionQRCode(session.sessionId, expirationMinutes);
    
    // Update session
    session.status = 'active';
    session.qrCodeData = qrResult.qrData;
    session.expiresAt = qrResult.expiresAt;
    await session.save();

    return res.status(200).json(
        new ApiResponse(200, {
            session,
            qrCode: qrResult.qrCodeImage, // This key name is correct based on qr.service.js
            expiresAt: qrResult.expiresAt,
            accessLink: session.accessLink
        }, "Online session started successfully.")
    );
});

/**
 * @desc    Manually start a physical session.
 * @route   POST /api/v1/attendance/sessions/:sessionId/start-physical
 * @access  Private (Facilitator)
 */
const startPhysicalSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await ClassSession.findOne({ 
        sessionId, 
        facilitatorId: req.user._id,
        type: 'physical'
    });

    if (!session) {
        throw new ApiError(404, "Physical session not found.");
    }

    if (session.status !== 'scheduled') {
        throw new ApiError(400, "Session is already active or completed.");
    }

    // Update session status to active
    session.status = 'active';
    await session.save();

    return res.status(200).json(
        new ApiResponse(200, session, "Physical session started successfully. Trainees can now mark their attendance.")
    );
});

/**
 * Mark attendance for physical class (facilitator)
 */

const markPhysicalAttendance = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { latitude, longitude } = req.body;

    const session = await ClassSession.findOne({ 
        sessionId, 
        facilitatorId: req.user._id,
        type: 'physical'
    });

    if (!session) {
        throw new ApiError(404, "Physical session not found.");
    }

    if (session.status === 'completed') {
        throw new ApiError(400, "Session is already completed.");
    }

    // Validate location
    if (!latitude || !longitude) {
        throw new ApiError(400, "Location coordinates are required.");
    }

    const userLocation = { lat: latitude, lng: longitude };
    
    // Check if facilitator is within class radius
    if (!isWithinRadius(userLocation, session.location)) {
        throw new ApiError(400, "You are not within the class location radius.");
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
        userId: req.user._id,
        sessionId: session._id
    });

    if (existingAttendance) {
        throw new ApiError(400, "Attendance already marked for this session.");
    }

    // Mark attendance
    const attendance = await Attendance.create({
        userId: req.user._id,
        sessionId: session._id,
        timestamp: new Date(),
        location: userLocation,
        method: 'geolocation',
        markedBy: req.user._id,
        deviceInfo: req.headers['user-agent'] || '',
        ipAddress: req.ip || req.connection.remoteAddress
    });

    // Update session status if this is the first attendance
    if (session.status === 'scheduled') {
        session.status = 'active';
        await session.save();
    }

    return res.status(201).json(
        new ApiResponse(201, {
            attendance,
            accessLink: session.accessLink
        }, "Physical attendance marked successfully.")
    );
});

// ===================================================================
//   TRAINEE ENDPOINTS
// ===================================================================

/**
 * Mark attendance using QR code (trainee)
 */
const markQRAttendance = asyncHandler(async (req, res) => {
    const { qrData } = req.body;

    if (!qrData) {
        throw new ApiError(400, "QR code data is required.");
    }

    // Verify QR code
    const qrResult = verifySessionQRCode(qrData);
    if (!qrResult) {
        throw new ApiError(400, "Invalid or expired QR code.");
    }

    // Find the session
    const session = await ClassSession.findOne({ 
        sessionId: qrResult.sessionId,
        status: 'active'
    });

    if (!session) {
        throw new ApiError(404, "Session not found or not active.");
    }

    // Check if trainee is enrolled in the program
    const program = await Program.findById(session.programId);
    if (!program || !program.trainees.includes(req.user._id)) {
        throw new ApiError(403, "You are not enrolled in this program.");
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
        userId: req.user._id,
        sessionId: session._id
    });

    if (existingAttendance) {
        throw new ApiError(400, "Attendance already marked for this session.");
    }

    // Mark attendance
    const attendance = await Attendance.create({
        userId: req.user._id,
        sessionId: session._id,
        timestamp: new Date(),
        method: 'qr_code',
        markedBy: req.user._id,
        deviceInfo: req.headers['user-agent'] || '',
        ipAddress: req.ip || req.connection.remoteAddress
    });

    return res.status(201).json(
        new ApiResponse(201, {
            attendance,
            accessLink: session.accessLink
        }, "QR attendance marked successfully.")
    );
});

/**
 * Mark attendance using geolocation (trainee)
 */
const markGeolocationAttendance = asyncHandler(async (req, res) => {
    const { sessionId, latitude, longitude } = req.body;

    if (!sessionId || !latitude || !longitude) {
        throw new ApiError(400, "Session ID and location coordinates are required.");
    }

    // Find the session
    const session = await ClassSession.findOne({ 
        sessionId,
        type: 'physical',
        status: 'active'
    });

    if (!session) {
        throw new ApiError(404, "Physical session not found or not active.");
    }

    // Check if trainee is enrolled in the program
    const program = await Program.findById(session.programId);
    if (!program || !program.trainees.includes(req.user._id)) {
        throw new ApiError(403, "You are not enrolled in this program.");
    }

    // Validate location
    const userLocation = { lat: latitude, lng: longitude };
    
    // Check if trainee is within class radius
    if (!isWithinRadius(userLocation, session.location)) {
        throw new ApiError(400, "You are not within the class location radius.");
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
        userId: req.user._id,
        sessionId: session._id
    });

    if (existingAttendance) {
        throw new ApiError(400, "Attendance already marked for this session.");
    }

    // Mark attendance
    const attendance = await Attendance.create({
        userId: req.user._id,
        sessionId: session._id,
        timestamp: new Date(),
        location: userLocation,
        method: 'geolocation',
        markedBy: req.user._id,
        deviceInfo: req.headers['user-agent'] || '',
        ipAddress: req.ip || req.connection.remoteAddress
    });

    return res.status(201).json(
        new ApiResponse(201, {
            attendance,
            accessLink: session.accessLink
        }, "Geolocation attendance marked successfully.")
    );
});

// ===================================================================
//   GENERAL ENDPOINTS
// ===================================================================

/**
 * Get session details
 */
const getSessionDetails = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await ClassSession.findOne({ sessionId })
        .populate('facilitatorId', 'name email')
        .populate('programId', 'name description');

    if (!session) {
        throw new ApiError(404, "Session not found.");
    }

    // Get attendance count
    const attendanceCount = await Attendance.countDocuments({ sessionId: session._id });

    return res.status(200).json(
        new ApiResponse(200, {
            session,
            attendanceCount
        }, "Session details retrieved successfully.")
    );
});

/**
 * Get attendance report for a session
 */
const getSessionAttendance = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await ClassSession.findOne({ sessionId });
    if (!session) {
        throw new ApiError(404, "Session not found.");
    }

    // Check permissions
    if (req.user.role === 'Trainee' && !session.trainees.includes(req.user._id)) {
        throw new ApiError(403, "Access denied.");
    }

    const attendance = await Attendance.find({ sessionId: session._id })
        .populate('userId', 'name email')
        .populate('markedBy', 'name')
        .sort({ timestamp: -1 });

    return res.status(200).json(
        new ApiResponse(200, attendance, "Attendance report retrieved successfully.")
    );
});

/**
 * Get facilitator's sessions
 */
const getFacilitatorSessions = asyncHandler(async (req, res) => {
    const { status, type } = req.query;
    const facilitatorId = req.user._id;

    const query = { facilitatorId };
    if (status) query.status = status;
    if (type) query.type = type;

    const sessions = await ClassSession.find(query)
        .populate('programId', 'name')
        .sort({ startTime: -1 });

    return res.status(200).json(
        new ApiResponse(200, sessions, "Sessions retrieved successfully.")
    );
});

/**
 * Get trainee's sessions
 */
const getTraineeSessions = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;

    // Get programs where trainee is enrolled
    const programs = await Program.find({ trainees: traineeId });
    const programIds = programs.map(p => p._id);

    const sessions = await ClassSession.find({
        programId: { $in: programIds }
    })
    .populate('programId', 'name')
    .populate('facilitatorId', 'name')
    .sort({ startTime: -1 });

    return res.status(200).json(
        new ApiResponse(200, sessions, "Sessions retrieved successfully.")
    );
});

// Legacy functions for backward compatibility
const markAttendance = asyncHandler(async (req, res) => {
    // Redirect to appropriate method based on request
    const { method } = req.body;
    
    if (method === 'qr_code') {
        return markQRAttendance(req, res);
    } else if (method === 'geolocation') {
        return markGeolocationAttendance(req, res);
    } else {
        throw new ApiError(400, "Invalid attendance method.");
    }
});

const getSessionQRCode = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const qrResult = await generateSessionQRCode(sessionId);
    return res.status(200).json(
        new ApiResponse(200, { qrCodeImage: qrResult.qrCodeImage }, "QR Code generated for session.")
    );
});

const markManualStudentAttendance = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { userId, status = 'present', reason } = req.body; // status can be 'present', 'absent', 'excused'

    if (!userId) {
        throw new ApiError(400, "User ID is required.");
    }

    const session = await ClassSession.findOne({ sessionId });
    if (!session) {
        throw new ApiError(404, "Session not found.");
    }

    // Check if the current user (facilitator/manager) has permission over this session
    // For now, assume any logged-in Facilitator/PM can mark.
    // In a real app, you'd verify if this session belongs to them.

    // Check if attendance already exists for this user in this session
    let existingAttendance = await Attendance.findOne({
        userId: userId,
        sessionId: session._id
    });

    let attendance;
    let message;

    if (existingAttendance) {
        // If exists, update it
        existingAttendance.status = status;
        existingAttendance.reason = reason || null;
        existingAttendance.timestamp = new Date(); // Update timestamp on modification
        existingAttendance.method = 'manual';
        existingAttendance.markedBy = req.user._id;
        attendance = await existingAttendance.save();
        message = "Attendance updated successfully.";
    } else {
        // If not exists, create new
        attendance = await Attendance.create({
            userId: userId,
            sessionId: session._id,
            timestamp: new Date(),
            method: 'manual',
            status: status,
            reason: reason,
            markedBy: req.user._id
        });
        message = "Attendance marked successfully.";
    }

    return res.status(200).json(
        new ApiResponse(200, attendance, message)
    );
});

/**
 * @desc    Re-opens or generates a new QR code for an already active online session.
 * @route   POST /api/v1/attendance/sessions/:sessionId/open-qr
 * @access  Private (Facilitator)
 */
const openQrForSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { expirationMinutes = 5 } = req.body; // Shorter expiry for in-class checks

    const session = await ClassSession.findOne({ 
        sessionId, 
        facilitatorId: req.user._id,
        type: 'online',
        status: 'active' // Session must already be active
    });

    if (!session) {
        throw new ApiError(404, "Active online session not found.");
    }

    // Generate a new QR code
    const qrResult = await generateSessionQRCode(sessionId, expirationMinutes);
    
    // Update session with new QR data and expiration
    session.qrCodeData = qrResult.qrData;
    session.expiresAt = qrResult.expiresAt;
    await session.save();

    return res.status(200).json(
        new ApiResponse(200, {
            qrCodeImage: qrResult.qrCodeImage,
            expiresAt: qrResult.expiresAt
        }, "Attendance check started. New QR code is ready.")
    );
});


export {
    // Facilitator endpoints
    createSession,
    startOnlineSession,
    startPhysicalSession,
    markPhysicalAttendance,
    openQrForSession,
    
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
    markManualStudentAttendance
};