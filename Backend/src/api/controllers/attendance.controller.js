import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Attendance } from '../models/attendance.model.js';
import { ClassSession } from '../models/classSession.model.js';
import { Program } from '../models/program.model.js';
import { generateSessionQRCode, generateSessionId, verifySessionQRCode } from '../../services/qr.service.js';
import { isWithinRadius } from '../../services/geolocation.service.js';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { createNotification } from '../../services/notification.service.js';
import { scheduleSessionReminder } from '../../services/sessionReminder.service.js';

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

/**
 * Helper function to check if attendance is already marked and determine status (Present/Late).
 * @param {string} userId - The ID of the user attempting to mark attendance.
 * @param {object} session - The ClassSession document.
 * @param {Date} markTime - The current time attendance is being marked.
 * @param {'qr_code'|'geolocation'} method - The method used for marking.
 * @returns {Promise<{existingAttendance: object|null, calculatedStatus: 'Present'|'Late'}>}
 */
const checkAndMarkAttendanceStatus = async (userId, session, markTime, method) => {
    // 1. Check if user already marked attendance for this session
    const existingAttendance = await Attendance.findOne({
        userId: userId,
        sessionId: session._id,
        status: { $in: ['Present', 'Late'] } // Already present means no re-marking
    });

    if (existingAttendance) {
        throw new ApiError(400, `You have already marked attendance for this session. Status: ${existingAttendance.status}`);
    }

    // 2. Determine if it's a 'Late' entry
    let calculatedStatus = 'Present';
    const lateThresholdMs = (session.lateThreshold || 10) * 60 * 1000; // Convert minutes to milliseconds

    let attendanceOpenTime;

    if (method === 'qr_code' && session.qrCodeOpenedAt) {
        // For QR code, lateness is relative to when the QR was first opened OR if it's been re-opened
        attendanceOpenTime = session.qrCodeOpenedAt;
        if (session.qrCodeLastGeneratedAt && session.qrCodeLastGeneratedAt.getTime() > session.qrCodeOpenedAt.getTime()) {
            // If QR was re-generated, it's considered late
            calculatedStatus = 'Late';
        } else if (markTime.getTime() > (session.qrCodeOpenedAt.getTime() + lateThresholdMs)) {
            calculatedStatus = 'Late';
        }
    } else if (method === 'geolocation' && session.startTime) {
        // For geolocation, lateness is relative to session start time OR if QR was re-opened (acting as a "start attendance window" flag)
        attendanceOpenTime = session.startTime;
        if (session.qrCodeLastGeneratedAt && session.qrCodeLastGeneratedAt.getTime() > session.startTime.getTime()) {
             // If attendance window was effectively "re-opened" (via QR last generated), it's considered late
            calculatedStatus = 'Late';
        } else if (markTime.getTime() > (session.startTime.getTime() + lateThresholdMs)) {
            calculatedStatus = 'Late';
        }
    }

    if (session.allowLateAttendance === false && calculatedStatus === 'Late') {
        throw new ApiError(400, "Late attendance is not allowed for this session.");
    }

    return { existingAttendance, calculatedStatus };
};


// ===================================================================
//   FACILITATOR ENDPOINTS
// ===================================================================

const createSession = asyncHandler(async (req, res) => {
    const { type, programId, title, description, latitude, longitude, radius, startTime } = req.body;
    
    if (!type || !programId || !title || !startTime) {
        throw new ApiError(400, "Type, Program ID, Title, and Start Time are required.");
    }

    const sessionStartTime = new Date(startTime);
    if (isNaN(sessionStartTime.getTime())) {
        throw new ApiError(400, "Invalid Start Time format provided.");
    }

    const program = await Program.findById(programId);
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }

    const sessionData = {
        type, 
        programId, 
        title, 
        description,
        facilitatorId: req.user._id,
        sessionId: generateSessionId(),
        startTime: sessionStartTime,
        status: 'scheduled',
        createdBy: req.user._id,
    };

    if (type === 'physical') {
        if (latitude === undefined || longitude === undefined) {
            throw new ApiError(400, "Location (latitude and longitude) is required for creating a physical session.");
        }
        sessionData.location = {
            lat: latitude,
            lng: longitude,
            radius: radius || 50
        };
    }

    const session = await ClassSession.create(sessionData);

    const populatedProgram = await Program.findById(programId).select('trainees name');
    if (populatedProgram && populatedProgram.trainees && populatedProgram.trainees.length > 0) {
        const trainees = await User.find({ _id: { $in: populatedProgram.trainees }, role: 'Trainee' }).select('_id');
        const notificationPromises = trainees.map(trainee =>
            createNotification({
                recipient: trainee._id,
                sender: req.user._id,
                title: `New Session Scheduled: ${session.title}`,
                message: `A new ${session.type} class session "${session.title}" has been scheduled for your program "${populatedProgram.name}". It starts at ${new Date(session.startTime).toLocaleString()}.`,
                link: `/dashboard/Trainee/Trattendance`,
                type: 'info'
            })
        );
        await Promise.allSettled(notificationPromises);
    } else {
        console.log(`No trainees found in program ${program.name} for session ${session.title}. No notifications sent.`);
    }

    scheduleSessionReminder(session);

    return res.status(201).json(new ApiResponse(201, session, "Session created successfully."));
});

const startOnlineSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const query = buildSessionQuery(idFromParams, { facilitatorId: req.user._id, type: 'online' });
    
    const session = await ClassSession.findOne(query).populate('programId', 'name trainees');

    if (!session) throw new ApiError(404, "Online session not found.");
    if (session.status === 'active') return res.status(200).json(new ApiResponse(200, { session }, "Session is already active."));
    if (session.status !== 'scheduled') throw new ApiError(400, "Session is already completed or cancelled.");

    session.status = 'active';
    session.accessLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/classroom/${session.sessionId}`;
    await session.save();

    if (session.programId && session.programId.trainees && session.programId.trainees.length > 0) {
        const trainees = await User.find({ _id: { $in: session.programId.trainees }, role: 'Trainee' }).select('_id');
        const notificationPromises = trainees.map(trainee =>
            createNotification({
                recipient: trainee._id,
                sender: req.user._id,
                title: `Session Started: ${session.title}`,
                message: `Your online class session "${session.title}" for program "${session.programId.name}" has just started. Join now!`,
                link: `/dashboard/classroom/${session.sessionId}`,
                type: 'info'
            })
        );
        await Promise.allSettled(notificationPromises);
    } else {
        console.log(`No trainees found in program ${session.programId?.name || session.programId} for session ${session.title}. No notifications sent.`);
    }

    return res.status(200).json(new ApiResponse(200, { session }, "Online session started successfully."));
});

const startPhysicalSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const { latitude, longitude, radius = 50 } = req.body; 

    if (latitude === undefined || longitude === undefined) {
        throw new ApiError(400, "Your location (latitude and longitude) is required to start a physical session.");
    }

    const query = buildSessionQuery(idFromParams, { facilitatorId: req.user._id, type: 'physical' });
    const session = await ClassSession.findOne(query).populate('programId', 'name trainees');

    if (!session) throw new ApiError(404, "Physical session not found.");
    if (session.status !== 'scheduled') throw new ApiError(400, "Session is already active or completed.");

    session.status = 'active';
    session.location = {
        lat: latitude,
        lng: longitude,
        radius: radius
    };
    await session.save();
   
    if (session.programId && session.programId.trainees && session.programId.trainees.length > 0) {
        const trainees = await User.find({ _id: { $in: session.programId.trainees }, role: 'Trainee' }).select('_id');
        const notificationPromises = trainees.map(trainee =>
            createNotification({
                recipient: trainee._id,
                sender: req.user._id,
                title: `Session Started: ${session.title}`,
                message: `Your physical class session "${session.title}" for program "${session.programId.name}" has just started. Remember to mark attendance!`,
                link: `/dashboard/Trainee/Trattendance`,
                type: 'info'
            })
        );
        await Promise.allSettled(notificationPromises);
    } else {
        console.log(`No trainees found in program ${session.programId?.name || session.programId} for session ${session.title}. No notifications sent.`);
    }

    return res.status(200).json(new ApiResponse(200, session, "Physical session started successfully."));
});


const openQrForSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const query = buildSessionQuery(idFromParams, { facilitatorId: req.user._id, type: 'online', status: 'active' });
    const session = await ClassSession.findOne(query);

    if (!session) throw new ApiError(404, "Active online session not found.");

    // Update qrCodeOpenedAt if it's the first time, otherwise update qrCodeLastGeneratedAt
    const now = new Date();
    let updateFields = { qrCodeLastGeneratedAt: now };
    if (!session.qrCodeOpenedAt) {
        updateFields.qrCodeOpenedAt = now;
    }

    const qrResult = await generateSessionQRCode(session.sessionId, 5); // QR code expires in 5 minutes
    session.qrCodeData = qrResult.qrData;
    
    const updatedSession = await ClassSession.findByIdAndUpdate(
        session._id,
        { $set: { ...updateFields, qrCodeData: qrResult.qrData } },
        { new: true }
    );
    
    return res.status(200).json(new ApiResponse(200, { 
        qrCodeImage: qrResult.qrCodeImage, 
        expiresAt: qrResult.expiresAt,
        session: updatedSession // Return updated session to client for status flags
    }));
});

const markPhysicalAttendance = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const { latitude, longitude } = req.body;
    const query = buildSessionQuery(idFromParams, { facilitatorId: req.user._id, type: 'physical' });
    const session = await ClassSession.findOne(query).populate('programId', 'name trainees');

    if (!session) throw new ApiError(404, "Physical session not found for you.");

    const todayDateString = new Date(session.startTime).toISOString().split('T')[0];

    const attendance = await Attendance.findOneAndUpdate(
        { userId: req.user._id, sessionId: session._id },
        {
            $setOnInsert: { userId: req.user._id, sessionId: session._id },
            $set: { 
                programId: session.programId._id, 
                date: todayDateString,
                timestamp: new Date(), 
                method: 'manual', 
                status: 'Present', 
                location: { lat: latitude, lng: longitude } 
            }
        }, 
        { upsert: true, new: true, runValidators: true }
    );

    await createNotification({
        recipient: req.user._id,
        sender: req.user._id, 
        title: `Your Attendance Marked: ${session.title}`,
        message: `You marked your attendance for session "${session.title}" in program "${session.programId.name}" via manual entry.`,
        link: `/dashboard/Facilitator/Fac-attendance`,
        type: 'info'
    });

    return res.status(201).json(new ApiResponse(201, { attendance }));
});

/**
 * @desc    Delete a session.
 * @route   DELETE /api/v1/attendance/sessions/:sessionId
 * @access  Private (Facilitator)
 */
 const deleteSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const facilitatorId = req.user._id;

    const query = buildSessionQuery(idFromParams, { facilitatorId: facilitatorId });
    const session = await ClassSession.findOne(query).populate('programId', 'name');

    if (!session) {
        throw new ApiError(404, "Session not found or you are not authorized to delete it.");
    }

    if (session.status !== 'completed') {
        throw new ApiError(400, `Session with status '${session.status}' cannot be deleted. Only completed sessions can be deleted.`);
    }

    await Attendance.deleteMany({ sessionId: session._id });
    await session.deleteOne();

    return res.status(200).json(new ApiResponse(200, {}, "Session deleted successfully."));
});

/**
 * @desc    Update a session.
 * @route   PATCH /api/v1/attendance/sessions/:sessionId
 * @access  Private (Facilitator)
 */
const updateSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const facilitatorId = req.user._id;
    const { title, description, startTime, duration, type, latitude, longitude, radius } = req.body;

    const query = buildSessionQuery(idFromParams, { facilitatorId: facilitatorId });
    const session = await ClassSession.findOne(query).populate('programId', 'name trainees');

    if (!session) {
        throw new ApiError(404, "Session not found or you are not authorized to update it.");
    }

    if (session.status !== 'scheduled') {
        throw new ApiError(400, `Cannot update a session with status '${session.status}'. Only scheduled sessions can be updated.`);
    }

    const updateFields = {};

    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (duration !== undefined) {
        const parsedDuration = parseInt(duration);
        if (isNaN(parsedDuration) || parsedDuration <= 0) {
            throw new ApiError(400, "Duration must be a positive number.");
        }
        updateFields.duration = parsedDuration;
    }
    
    if (startTime !== undefined) {
        const newStartTime = new Date(startTime);
        if (isNaN(newStartTime.getTime())) {
            throw new ApiError(400, "Invalid Start Time format provided.");
        }
        updateFields.startTime = newStartTime;
        // Reschedule reminder only if the time is in the future
        if (newStartTime.getTime() > new Date().getTime()) {
            scheduleSessionReminder({ ...session.toObject(), startTime: newStartTime }); 
        } else {
             // If startTime is updated to a past time, ensure any pending job is cancelled
             // (node-schedule doesn't auto-cancel for past times, but it won't execute)
             // For real cancellation, you'd need a way to track job handles, which is complex.
             console.warn(`Session ${session.title} updated to a past time. Reminder will not be sent.`);
        }
    }

    if (type !== undefined) updateFields.type = type;

    if (type === 'physical' || (session.type === 'physical' && (latitude !== undefined || longitude !== undefined || radius !== undefined))) {
        if (!updateFields.location) updateFields.location = { ...session.location?.toObject() }; 
        
        if (latitude !== undefined) updateFields.location.lat = latitude;
        if (longitude !== undefined) updateFields.location.lng = longitude;
        if (radius !== undefined) updateFields.location.radius = radius;

        if (updateFields.type === 'physical' && (updateFields.location.lat === undefined || updateFields.location.lng === undefined)) {
             throw new ApiError(400, "Latitude and longitude are required for a physical session.");
        }
    }


    const updatedSession = await ClassSession.findByIdAndUpdate(
        session._id,
        { $set: updateFields },
        { new: true, runValidators: true }
    ).populate('programId', 'name');

    if (!updatedSession) {
        throw new ApiError(500, "Failed to update session unexpectedly.");
    }
    
    if (updatedSession.programId && updatedSession.programId.trainees && updatedSession.programId.trainees.length > 0) {
        const trainees = await User.find({ _id: { $in: updatedSession.programId.trainees }, role: 'Trainee' }).select('_id');
        const notificationPromises = trainees.map(trainee =>
            createNotification({
                recipient: trainee._id,
                sender: req.user._id,
                title: `Session Updated: ${updatedSession.title}`,
                message: `The class session "${updatedSession.title}" for your program "${updatedSession.programId.name}" has been updated. It is now scheduled for ${new Date(updatedSession.startTime).toLocaleString()}.`,
                link: `/dashboard/Trainee/Trattendance`,
                type: 'info'
            })
        );
        await Promise.allSettled(notificationPromises);
    }

    return res.status(200).json(new ApiResponse(200, updatedSession, "Session updated successfully."));
});


// ===================================================================
//   TRAINEE ENDPOINTS
// ===================================================================

const markQRAttendance = asyncHandler(async (req, res) => {
    const { qrData } = req.body;
    const traineeId = req.user._id;

    if (!qrData) throw new ApiError(400, "QR code data is required.");

    const qrResult = verifySessionQRCode(qrData);
    if (!qrResult) throw new ApiError(400, "Invalid or expired QR code.");

    const session = await ClassSession.findOne({ sessionId: qrResult.sessionId, status: 'active' })
                                        .populate('programId', 'name')
                                        .populate('facilitatorId', 'name email');

    if (!session) throw new ApiError(404, "Session not found or not active.");

    const program = await Program.findById(session.programId._id);
    if (!program || !program.trainees.includes(traineeId)) { // Use traineeId
        throw new ApiError(403, "You are not enrolled in this program's session.");
    }

    const markTime = new Date(); // Time of actual scan
    const todayDateString = new Date(session.startTime).toISOString().split('T')[0];

    // Check if attendance already exists and determine status (Present/Late)
    const { calculatedStatus } = await checkAndMarkAttendanceStatus(traineeId, session, markTime, 'qr_code');

    const attendance = await Attendance.findOneAndUpdate(
        { userId: traineeId, sessionId: session._id },
        {
            $setOnInsert: { userId: traineeId, sessionId: session._id },
            $set: {
                programId: session.programId._id,
                date: todayDateString,
                timestamp: markTime, // Use actual mark time
                method: 'qr_code',
                status: calculatedStatus // Use calculated status
            }
        },
        { upsert: true, new: true, runValidators: true }
    );

    if (session.facilitatorId) {
        await createNotification({
            recipient: session.facilitatorId._id,
            sender: req.user._id,
            title: `Trainee Marked Attendance: ${calculatedStatus}`,
            message: `Trainee ${req.user.name} marked attendance for session "${session.title}" (${session.programId.name}) via QR code. Status: ${calculatedStatus}.`,
            link: `/dashboard/Facilitator/Fac-attendance`,
            type: calculatedStatus === 'Late' ? 'warning' : 'info'
        });
    }

    return res.status(201).json(new ApiResponse(201, { attendance }, `QR attendance marked successfully. Status: ${calculatedStatus}.`));
});


const markGeolocationAttendance = asyncHandler(async (req, res) => {
    const { sessionId, latitude, longitude } = req.body;
    const traineeId = req.user._id;

    if (!sessionId) throw new ApiError(400, "Session ID is required.");
    if (latitude === undefined || longitude === undefined) {
        throw new ApiError(400, "Your location (latitude and longitude) is required for geolocation attendance.");
    }

    const session = await ClassSession.findOne({ sessionId, type: 'physical', status: 'active' })
                                        .populate('programId', 'name')
                                        .populate('facilitatorId', 'name email');

    if (!session) throw new ApiError(404, "Active physical session not found.");

    const program = await Program.findById(session.programId._id);
    if (!program || !program.trainees.includes(traineeId)) {
        throw new ApiError(403, "You are not enrolled in this program.");
    }
    
    const classLocation = session.location || { lat: -1.9441, lng: 30.0619, radius: 100 };
    if (!isWithinRadius({ lat: latitude, lng: longitude }, classLocation)) {
        throw new ApiError(400, "You are not within the required class location radius.");
    }

    const markTime = new Date(); // Time of actual marking
    const todayDateString = new Date(session.startTime).toISOString().split('T')[0];

    // Check if attendance already exists and determine status (Present/Late)
    const { calculatedStatus } = await checkAndMarkAttendanceStatus(traineeId, session, markTime, 'geolocation');

    const attendance = await Attendance.findOneAndUpdate(
        { userId: traineeId, sessionId: session._id },
        {
            $setOnInsert: { userId: traineeId, sessionId: session._id },
            $set: {
                programId: session.programId._id,
                date: todayDateString,
                timestamp: markTime, // Use actual mark time
                method: 'geolocation',
                status: calculatedStatus, // Use calculated status
                location: { lat: latitude, lng: longitude }
            }
        },
        { upsert: true, new: true, runValidators: true }
    );

    if (session.facilitatorId) {
        await createNotification({
            recipient: session.facilitatorId._id,
            sender: req.user._id,
            title: `Trainee Marked Attendance: ${calculatedStatus}`,
            message: `Trainee ${req.user.name} marked attendance for session "${session.title}" (${session.programId.name}) via geolocation. Status: ${calculatedStatus}.`,
            link: `/dashboard/Facilitator/Fac-attendance`,
            type: calculatedStatus === 'Late' ? 'warning' : 'info'
        });
    }

    return res.status(201).json(new ApiResponse(201, { attendance }, `Geolocation attendance marked successfully. Status: ${calculatedStatus}.`));
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
    
    const session = await ClassSession.findOne(query)
        .populate('programId', 'name trainees')
        .populate('facilitatorId', 'name email');

    if (!session) throw new ApiError(404, "Session not found.");
    
    const currentAttendanceRecords = await Attendance.find({ sessionId: session._id })
        .populate('userId', 'name email')
        .populate('markedBy', 'name')
        .sort({ timestamp: -1 });

    const attendanceMap = new Map();
    currentAttendanceRecords.forEach(record => {
        // Only keep the latest status for a user for this session
        // This ensures if someone was marked 'Absent' then 'Present', 'Present' is kept.
        if (!attendanceMap.has(record.userId._id.toString()) || new Date(record.timestamp) > new Date(attendanceMap.get(record.userId._id.toString()).timestamp)) {
            attendanceMap.set(record.userId._id.toString(), record);
        }
    });

    const populatedTrainees = await User.find({ 
        _id: { $in: session.programId.trainees },
        role: 'Trainee'
    }).select('name email');


    const detailedAttendance = populatedTrainees.map(trainee => {
        const record = attendanceMap.get(trainee._id.toString());
        return {
            _id: record?._id || new mongoose.Types.ObjectId(), // Add an _id for the table key
            userId: {
                _id: trainee._id,
                name: trainee.name,
                email: trainee.email
            },
            status: record ? record.status : 'Absent',
            method: record ? record.method : 'N/A',
            timestamp: record ? record.timestamp : null,
            reason: record ? record.reason : null,
            markedBy: record?.markedBy ? record.markedBy.name : (record?.method === 'qr_code' || record?.method === 'geolocation' ? 'Self' : 'N/A')
        };
    });

    return res.status(200).json(new ApiResponse(200, { session, attendance: detailedAttendance }, "Attendance report retrieved successfully."));
});

const getFacilitatorSessions = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    let query = { facilitatorId: req.user._id };

    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.startTime = { $gte: start, $lte: end };
    }

    const sessions = await ClassSession.find(query).sort({ startTime: -1 }).populate('programId', 'name');
    return res.status(200).json(new ApiResponse(200, sessions, "Sessions retrieved successfully."));
});

const getTraineeSessions = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const programs = await Program.find({ trainees: req.user._id });
    const programIds = programs.map(p => p._id);
    
    let query = { programId: { $in: programIds } };

    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.startTime = { $gte: start, $lte: end };
    }

    const sessions = await ClassSession.find(query).sort({ startTime: -1 }).populate('programId', 'name');
    return res.status(200).json(new ApiResponse(200, sessions, "Your sessions retrieved successfully."));
});


// ===================================================================
//   LEGACY / OTHER ENDPOINTS (INCLUDED AND FIXED)
// ===================================================================

const markManualStudentAttendance = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { userId, status = 'Present', reason } = req.body;

    if (!userId) throw new ApiError(400, "User ID is required.");
    const session = await ClassSession.findOne({ sessionId })
                                        .populate('programId', 'name trainees programManager')
                                        .populate('facilitatorId', 'name email'); 
    if (!session) throw new ApiError(404, "Session not found.");
    
    let authorized = false;
    if (req.user.role === 'SuperAdmin') {
        authorized = true;
    } 
    else if (req.user.role === 'Program Manager' && session.programId && session.programId.programManager?.toString() === req.user._id.toString()) {
        authorized = true;
    }
    else if (req.user.role === 'Facilitator' && session.facilitatorId?._id.toString() === req.user._id.toString()) {
        authorized = true;
    }

    if (!authorized) {
        throw new ApiError(403, "You are not authorized to manually mark attendance for this session.");
    }
    
    const isTraineeEnrolledInProgram = session.programId.trainees.some(t => t.toString() === userId);
    if (!isTraineeEnrolledInProgram) {
        throw new ApiError(400, "The specified user is not enrolled in this session's program.");
    }

    const sessionStartDateString = new Date(session.startTime).toISOString().split('T')[0];

    const attendance = await Attendance.findOneAndUpdate(
        { userId: userId, sessionId: session._id },
        { 
            $set: { 
                status, 
                reason: reason || null, 
                method: 'manual', 
                markedBy: req.user._id, 
                timestamp: new Date()
            },
            $setOnInsert: { 
                programId: session.programId._id, 
                date: sessionStartDateString
            }
        },
        { upsert: true, new: true, runValidators: true }
    );

    const markedUser = await User.findById(userId).select('name');
    await createNotification({
        recipient: userId,
        sender: req.user._id,
        title: "Attendance Marked Manually",
        message: `Your attendance for session "${session.title}" (${session.programId.name}) was manually marked as "${status}" by ${req.user.name}.`,
        link: `/dashboard/Trainee/Trattendance`,
        type: (status === 'Absent' || status === 'Late') ? 'warning' : 'info'
    });

    if (session.facilitatorId && session.facilitatorId._id.toString() !== req.user._id.toString()) {
        await createNotification({
            recipient: session.facilitatorId._id,
            sender: req.user._id,
            title: "Manual Attendance Update",
            message: `${req.user.name} manually updated attendance for trainee ${markedUser?.name || userId} in session "${session.title}" to "${status}".`,
            link: `/dashboard/Facilitator/Fac-attendance`,
            type: 'info'
        });
    }

    const message = `Attendance for user ${markedUser?.name || userId} has been set to ${status}.`;
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

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    const program = await Program.findById(programId).populate('trainees', 'name email');
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }

    if (req.user.role === 'Program Manager' && program.programManager?.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Forbidden: You are not the manager of this program.");
    }

    const traineeIds = program.trainees.map(t => t._id);
    if (traineeIds.length === 0) {
        return res.status(200).json(new ApiResponse(200, {
            programName: program.name,
            reportDates: [],
            traineeReports: [],
            summaryStats: {
                totalDaysInPeriod: 0,
                totalPresentCount: 0,
                totalAbsentCount: 0,
                totalLateCount: 0,
                totalExcusedCount: 0,
                totalTrainees: 0
            }
        }, "No trainees in this program."));
    }

    const classSessions = await ClassSession.find({
        programId: programId,
        startTime: { $gte: start, $lte: end },
        status: { $in: ['active', 'completed'] }
    }).select('startTime');

    const reportDatesSet = new Set();
    classSessions.forEach(session => {
        reportDatesSet.add(new Date(session.startTime).toISOString().split('T')[0]);
    });
    const reportDates = Array.from(reportDatesSet).sort();

    const attendanceRecords = await Attendance.find({
        userId: { $in: traineeIds },
        programId: programId,
        timestamp: { $gte: start, $lte: end }
    }).select('userId date status timestamp');

    const attendanceByTraineeIdAndDate = new Map();
    attendanceRecords.forEach(record => {
        const traineeStringId = record.userId.toString();
        const recordDate = record.date;

        if (!attendanceByTraineeIdAndDate.has(traineeStringId)) {
            attendanceByTraineeIdAndDate.set(traineeStringId, new Map());
        }

        const traineeDailyMap = attendanceByTraineeIdAndDate.get(traineeStringId);

        if (!traineeDailyMap.has(recordDate) || new Date(record.timestamp) > new Date(traineeDailyMap.get(recordDate).timestamp)) {
             traineeDailyMap.set(recordDate, { status: record.status, timestamp: record.timestamp });
        }
    });

    const traineeReports = program.trainees.map(trainee => {
        const dailyAttendance = [];
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        let excusedCount = 0;

        for (const date of reportDates) {
            const status = attendanceByTraineeIdAndDate.get(trainee._id.toString())?.get(date)?.status || 'Absent'; 
            dailyAttendance.push({ date, status });

            if (status === 'Present') presentCount++;
            else if (status === 'Absent') absentCount++;
            else if (status === 'Late') lateCount++;
            else if (status === 'Excused') excusedCount++;
        }

        return {
            trainee: {
                _id: trainee._id,
                name: trainee.name,
                email: trainee.email
            },
            dailyAttendance,
            summary: {
                present: presentCount,
                absent: absentCount,
                late: lateCount,
                excused: excusedCount,
                totalDaysInPeriod: reportDates.length
            }
        };
    });
    
    const overallTotalPresent = traineeReports.reduce((sum, tr) => sum + tr.summary.present, 0);
    const overallTotalAbsent = traineeReports.reduce((sum, tr) => sum + tr.summary.absent, 0);
    const overallTotalLate = traineeReports.reduce((sum, tr) => sum + tr.summary.late, 0);
    const overallTotalExcused = traineeReports.reduce((sum, tr) => sum + tr.summary.excused, 0);

    const summaryStats = {
        totalDaysInPeriod: reportDates.length,
        totalPresentCount: overallTotalPresent,
        totalAbsentCount: overallTotalAbsent,
        totalLateCount: overallTotalLate,
        totalExcusedCount: overallTotalExcused,
        totalTrainees: program.trainees.length
    };

    return res.status(200).json(new ApiResponse(200, {
        programName: program.name,
        reportDates,
        traineeReports,
        summaryStats
    }, "Program attendance report fetched successfully."));
});

const getMyAttendanceHistory = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;
    const { programId, startDate, endDate } = req.query; 

    const enrolledPrograms = await Program.find({ trainees: traineeId }).select('_id name');
    const enrolledProgramIds = enrolledPrograms.map(p => p._id);

    let programFilterQuery = { $in: enrolledProgramIds };
    if (programId && programId !== 'all') {
        if (!enrolledProgramIds.some(id => id.toString() === programId)) {
            return res.status(200).json(new ApiResponse(200, [], "Not enrolled in the specified program."));
        }
        programFilterQuery = new mongoose.Types.ObjectId(programId);
    }

    const queryStartDate = startDate ? new Date(startDate) : new Date(0);
    queryStartDate.setUTCHours(0, 0, 0, 0);

    const queryEndDate = endDate ? new Date(endDate) : new Date();
    queryEndDate.setUTCHours(23, 59, 59, 999);

    const relevantSessions = await ClassSession.find({
        programId: programFilterQuery,
        startTime: { $gte: queryStartDate, $lte: queryEndDate },
        status: { $in: ['active', 'completed'] }
    }).populate('programId', 'name')
      .sort({ startTime: 1 });

    const attendanceRecords = await Attendance.find({
        userId: traineeId,
        sessionId: { $in: relevantSessions.map(s => s._id) }
    }).sort({ timestamp: -1 });

    const attendanceMap = new Map();
    attendanceRecords.forEach(record => {
        attendanceMap.set(record.sessionId.toString(), record);
    });

    const traineeHistory = relevantSessions.map(session => {
        const record = attendanceMap.get(session._id.toString());
        
        let status = 'Absent';
        let method = 'N/A';
        let timestamp = null;
        let checkIn = null;
        let reason = null;
        let markedBy = null;

        if (record) {
            status = record.status;
            method = record.method;
            timestamp = record.timestamp;
            checkIn = record.checkIn;
            reason = record.reason;
            markedBy = record.markedBy;
        }

        return {
            _id: record?._id || new mongoose.Types.ObjectId(),
            userId: traineeId,
            sessionId: session._id,
            programId: session.programId,
            date: new Date(session.startTime).toISOString().split('T')[0],
            timestamp: timestamp,
            checkIn: checkIn,
            location: record?.location || undefined,
            method: method,
            status: status,
            reason: reason,
            markedBy: markedBy,
            sessionTitle: session.title,
            sessionType: session.type,
            sessionTime: session.startTime
        };
    });
    
    traineeHistory.sort((a, b) => new Date(b.sessionTime).getTime() - new Date(a.sessionTime).getTime());

    return res.status(200).json(new ApiResponse(200, traineeHistory, "Your attendance history fetched successfully."));
});


const getProgramAttendanceSummary = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const { startDate, endDate } = req.query;

    if (!programId || !startDate || !endDate) {
        throw new ApiError(400, "Program ID, start date, and end date are required.");
    }

    const program = await Program.findById(programId).populate('trainees', 'name email role').lean();
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }

    const totalSessions = await ClassSession.countDocuments({
        programId: new mongoose.Types.ObjectId(programId),
        startTime: {
            $gte: new Date(startDate),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) 
        },
        status: { $in: ['active', 'completed'] }
    });

    const attendanceSummary = await Attendance.aggregate([
        {
            $match: {
                programId: new mongoose.Types.ObjectId(programId),
                timestamp: { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) } 
            }
        },
        {
            $group: {
                _id: { userId: "$userId", status: "$status" },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: "$_id.userId",
                present: { $sum: { $cond: [{ $in: ["$_id.status", ["Present", "Late"]] }, "$count", 0] } },
                absent: { $sum: { $cond: [{ $eq: ["$_id.status", "Absent"] }, "$count", 0] } },
                late: { $sum: { $cond: [{ $eq: ["$_id.status", "Late"] }, "$count", 0] } },
                excused: { $sum: { $cond: [{ $eq: ["$_id.status", "Excused"] }, "$count", 0] } },
            }
        }
    ]);

    const summaryMap = new Map(attendanceSummary.map(item => [item._id.toString(), item]));
    
    const finalReport = program.trainees.map(trainee => {
        const summary = summaryMap.get(trainee._id.toString());
        const presentCount = summary ? summary.present : 0;
        const excusedCount = summary?.excused || 0;
        
        const totalPossibleAttendanceDays = totalSessions; 
        
        const actualTotalForRate = totalPossibleAttendanceDays - excusedCount;

        const attendanceRate = actualTotalForRate > 0 
            ? Math.round((presentCount / actualTotalForRate) * 100) 
            : 0; 

        return {
            userId: trainee._id,
            name: trainee.name,
            email: trainee.email,
            role: trainee.role,
            present: presentCount,
            absent: summary ? summary.absent : (totalPossibleAttendanceDays - presentCount - excusedCount),
            late: summary ? summary.late : 0,
            excused: excusedCount,
            attendanceRate: attendanceRate < 0 ? 0 : attendanceRate, 
            totalPossibleSessions: totalPossibleAttendanceDays
        };
    });

    res.status(200).json(new ApiResponse(200, {
        totalSessions,
        report: finalReport
    }));
});





const endSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    
    const query = buildSessionQuery(idFromParams, { 
        facilitatorId: req.user._id,
        status: 'active' 
    });
    const session = await ClassSession.findOne(query).populate('programId', 'name trainees');

    if (!session) {
        throw new ApiError(404, "Active session not found or you don't have permission to end it.");
    }

    session.status = 'completed';
    session.endTime = new Date();
    await session.save();

    if (session.programId && session.programId.trainees && session.programId.trainees.length > 0) {
        const trainees = await User.find({ _id: { $in: session.programId.trainees }, role: 'Trainee' }).select('_id');
        const notificationPromises = trainees.map(trainee =>
            createNotification({
                recipient: trainee._id,
                sender: req.user._id,
                title: `Session Ended: ${session.title}`,
                message: `The class session "${session.title}" for program "${session.programId.name}" has ended.`,
                link: `/dashboard/Trainee/Trattendance`,
                type: 'info'
            })
        );
        await Promise.allSettled(notificationPromises);
    } else {
        console.log(`No trainees found in program ${session.programId?.name || session.programId} for session ${session.title}. No notifications sent.`);
    }

    return res.status(200).json(new ApiResponse(200, session, "Session has been ended successfully."));
});





const getProgramSessionCounts = asyncHandler(async (req, res) => {
    const { programId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(programId)) {
        throw new ApiError(400, "Invalid Program ID.");
    }

    const program = await Program.findById(programId);
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }

    // Ensure the requesting facilitator is associated with this program
    if (req.user.role === 'Facilitator' && !program.facilitators.includes(req.user._id)) {
        throw new ApiError(403, "Forbidden: You are not a facilitator for this program.");
    }

    const totalSessions = await ClassSession.countDocuments({ programId });
    const completedSessions = await ClassSession.countDocuments({ programId, status: 'completed' });
    const activeSessions = await ClassSession.countDocuments({ programId, status: 'active' });
    const scheduledSessions = await ClassSession.countDocuments({ programId, status: 'scheduled' });

    // Find the next upcoming session that is scheduled or active
    const nextSession = await ClassSession.findOne({
        programId,
        status: { $in: ['scheduled', 'active'] },
        startTime: { $gte: new Date() } // Future sessions
    }).sort({ startTime: 1 }) // Closest first
      .select('startTime');

    return res.status(200).json(new ApiResponse(200, {
        totalSessions,
        completedSessions,
        activeSessions,
        scheduledSessions,
        nextSessionTime: nextSession ? nextSession.startTime : null,
    }, "Program session counts fetched successfully."));
});


const getAttendanceStatusForUserSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const traineeId = req.user._id;

    // First, find the session to ensure it's valid and the trainee is enrolled
    const query = buildSessionQuery(idFromParams, { status: { $in: ['active', 'completed', 'scheduled'] } }); // Can check for status in any phase
    const session = await ClassSession.findOne(query).populate('programId', 'trainees');

    if (!session) {
        throw new ApiError(404, "Session not found.");
    }

    // Ensure trainee is part of the program associated with this session
    if (!session.programId || !session.programId.trainees.includes(traineeId)) {
        throw new ApiError(403, "You are not enrolled in this session's program.");
    }

    // Find the latest attendance record for this user in this session
    // We search for 'Present', 'Late', 'Absent', 'Excused'
    const attendanceRecord = await Attendance.findOne({
        userId: traineeId,
        sessionId: session._id,
    }).sort({ timestamp: -1 }); // Get the most recent one if multiple (though unique index should prevent true duplicates)

    if (attendanceRecord) {
        return res.status(200).json(new ApiResponse(200, attendanceRecord, "Attendance status fetched successfully."));
    } else {
        // If no record, return null or a default 'Absent' status for clarity
        // Returning null allows the frontend to easily check `if (!statusRecord)`
        return res.status(200).json(new ApiResponse(200, null, "No attendance record found for this session."));
    }
});




export {
    // Facilitator
    createSession,
    startOnlineSession,
    startPhysicalSession,
    markPhysicalAttendance,
    openQrForSession,
    deleteSession, 
    updateSession,
    
    // Trainee
    markQRAttendance,
    markGeolocationAttendance,
    
    // General
    getSessionDetails,
    getSessionAttendance,
    getFacilitatorSessions,
    getTraineeSessions,
    endSession,
    getAttendanceStatusForUserSession,
    
    // Legacy / Other
    markAttendance,
    getSessionQRCode,
    markManualStudentAttendance,
    getProgramAttendanceReport,
    getMyAttendanceHistory,
    getProgramSessionCounts,
    getProgramAttendanceSummary,
};