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
    const { type, programId, title, description, latitude, longitude, radius } = req.body; // Added location fields
    if (!type || !programId || !title) {
        throw new ApiError(400, "Type, Program ID, and Title are required.");
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
        startTime: new Date(),
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

    // MOVE NOTIFICATION BLOCK HERE, AFTER 'session' IS DEFINED
    // Notify trainees about the new session
    const trainees = await User.find({ _id: { $in: program.trainees }, role: 'Trainee' }).select('_id');
    const notificationPromises = trainees.map(trainee =>
        createNotification({
            recipient: trainee._id,
            sender: req.user._id,
            title: `New Session Scheduled: ${session.title}`, // 'session' is now defined
            message: `A new ${session.type} class session "${session.title}" has been scheduled for your program "${program.name}". It starts at ${new Date(session.startTime).toLocaleString()}.`, // 'session' is now defined
            link: `/dashboard/Trainee/Trattendance`, // Link to trainee attendance page
            type: 'info'
        })
    );
    await Promise.allSettled(notificationPromises);
    // END OF MOVED NOTIFICATION BLOCK

    return res.status(201).json(new ApiResponse(201, session, "Session created successfully."));
});

const startOnlineSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const query = buildSessionQuery(idFromParams, { facilitatorId: req.user._id, type: 'online' });
    
    // IMPORTANT: Populate programId for notification.
    const session = await ClassSession.findOne(query).populate('programId', 'name trainees');

    if (!session) throw new ApiError(404, "Online session not found.");
    if (session.status === 'active') return res.status(200).json(new ApiResponse(200, { session }, "Session is already active."));
    if (session.status !== 'scheduled') throw new ApiError(400, "Session is already completed or cancelled.");

    session.status = 'active';
    session.accessLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/classroom/${session.sessionId}`;
    await session.save();

    // Now, AFTER session is confirmed to exist and is saved, proceed with notifications
    if (session.programId && session.programId.trainees && session.programId.trainees.length > 0) {
        const trainees = await User.find({ _id: { $in: session.programId.trainees }, role: 'Trainee' }).select('_id');
        const notificationPromises = trainees.map(trainee =>
            createNotification({
                recipient: trainee._id,
                sender: req.user._id,
                title: `Session Started: ${session.title}`,
                message: `Your online class session "${session.title}" for program "${session.programId.name}" has just started. Join now!`,
                link: `/dashboard/classroom/${session.sessionId}`, // Link to the live classroom
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
    const { latitude, longitude, radius = 50 } = req.body; // Facilitator provides their location

    // --- GEOLOCATION FIX (This validation is correct and essential) ---
    if (latitude === undefined || longitude === undefined) {
        throw new ApiError(400, "Your location (latitude and longitude) is required to start a physical session.");
    }

    const query = buildSessionQuery(idFromParams, { facilitatorId: req.user._id, type: 'physical' });
    // IMPORTANT: Populate programId for notification.
    const session = await ClassSession.findOne(query).populate('programId', 'name trainees');

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
   
    // Now, AFTER session is confirmed to exist and is saved, proceed with notifications
    if (session.programId && session.programId.trainees && session.programId.trainees.length > 0) {
        const trainees = await User.find({ _id: { $in: session.programId.trainees }, role: 'Trainee' }).select('_id');
        const notificationPromises = trainees.map(trainee =>
            createNotification({
                recipient: trainee._id,
                sender: req.user._id,
                title: `Session Started: ${session.title}`,
                message: `Your physical class session "${session.title}" for program "${session.programId.name}" has just started. Remember to mark attendance!`,
                link: `/dashboard/Trainee/Trattendance`, // Link to trainee attendance page
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

    const qrResult = await generateSessionQRCode(session.sessionId, 5);
    session.qrCodeData = qrResult.qrData;
    await session.save();
    return res.status(200).json(new ApiResponse(200, { qrCodeImage: qrResult.qrCodeImage, expiresAt: qrResult.expiresAt }));
});

const markPhysicalAttendance = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    const { latitude, longitude } = req.body;
    const query = buildSessionQuery(idFromParams, { facilitatorId: req.user._id, type: 'physical' });
    // Populate programId for notification
    const session = await ClassSession.findOne(query).populate('programId', 'name trainees');

    if (!session) throw new ApiError(404, "Physical session not found for you.");

    const todayDateString = new Date(session.startTime).toISOString().split('T')[0]; // Use session start time for date

    const attendance = await Attendance.findOneAndUpdate(
        { userId: req.user._id, sessionId: session._id }, // Query by sessionId (unique index)
        {
            $setOnInsert: { userId: req.user._id, sessionId: session._id },
            $set: { 
                programId: session.programId._id, // Ensure programId is stored as ObjectId
                date: todayDateString,
                timestamp: new Date(), 
                method: 'geolocation', // This is now 'geolocation' for facilitator-marked as well
                status: 'Present', 
                location: { lat: latitude, lng: longitude } 
            }
        }, 
        { upsert: true, new: true, runValidators: true } // runValidators for enum status
    );

    // Notify facilitator about their own attendance marked via geolocation (optional, but consistent)
    await createNotification({
        recipient: req.user._id,
        sender: req.user._id, // Self-notification
        title: `Your Attendance Marked: ${session.title}`,
        message: `You marked your attendance for session "${session.title}" in program "${session.programId.name}" via geolocation.`,
        link: `/dashboard/Facilitator/Fac-attendance`,
        type: 'info'
    });

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

    // Populate programId and facilitatorId for notifications
    const session = await ClassSession.findOne({ sessionId: qrResult.sessionId, status: 'active' })
                                        .populate('programId', 'name')
                                        .populate('facilitatorId', 'name email');

    if (!session) throw new ApiError(404, "Session not found or not active.");

    const program = await Program.findById(session.programId._id); // Access _id from populated programId
    if (!program || !program.trainees.includes(req.user._id)) {
        throw new ApiError(403, "You are not enrolled in this program's session.");
    }

    const todayDateString = new Date(session.startTime).toISOString().split('T')[0];

    const query = { userId: req.user._id, sessionId: session._id }; // Query by sessionId (unique index)

    const update = {
        $set: {
            programId: session.programId._id, // Ensure to use _id from populated object
            date: todayDateString,
            timestamp: new Date(),
            method: 'qr_code',
            status: 'Present'
        }
    };
    
    const attendance = await Attendance.findOneAndUpdate(query, update, { upsert: true, new: true, runValidators: true });

    // Notify facilitator about trainee attendance
    if (session.facilitatorId) {
        await createNotification({
            recipient: session.facilitatorId._id, // Use _id from populated facilitatorId
            sender: req.user._id,
            title: "Trainee Marked Attendance",
            message: `Trainee ${req.user.name} marked attendance for session "${session.title}" (${session.programId.name}) via QR code.`,
            link: `/dashboard/Facilitator/Fac-attendance`, // Link to facilitator's attendance report
            type: 'info'
        });
    }

    return res.status(201).json(new ApiResponse(201, { attendance }, "QR attendance marked successfully."));
});


const markGeolocationAttendance = asyncHandler(async (req, res) => {
    const { sessionId, latitude, longitude } = req.body;
    if (!sessionId) throw new ApiError(400, "Session ID is required.");
    if (latitude === undefined || longitude === undefined) { // Explicitly check location
        throw new ApiError(400, "Your location (latitude and longitude) is required for geolocation attendance.");
    }

    // Populate programId and facilitatorId for notifications
    const session = await ClassSession.findOne({ sessionId, type: 'physical', status: 'active' })
                                        .populate('programId', 'name')
                                        .populate('facilitatorId', 'name email');

    if (!session) throw new ApiError(404, "Active physical session not found.");

    const program = await Program.findById(session.programId._id); // Access _id from populated programId
    if (!program || !program.trainees.includes(req.user._id)) {
        throw new ApiError(403, "You are not enrolled in this program.");
    }
    
    const classLocation = session.location || { lat: -1.9441, lng: 30.0619, radius: 100 }; // Fallback location
    if (!isWithinRadius({ lat: latitude, lng: longitude }, classLocation)) {
        throw new ApiError(400, "You are not within the required class location radius.");
    }

    const todayDateString = new Date(session.startTime).toISOString().split('T')[0];

    const query = { userId: req.user._id, sessionId: session._id }; // Query by sessionId (unique index)
    const update = {
        $set: {
            programId: session.programId._id, // Ensure to use _id from populated object
            date: todayDateString,
            timestamp: new Date(),
            method: 'geolocation',
            status: 'Present',
            location: { lat: latitude, lng: longitude }
        }
    };
    
    const attendance = await Attendance.findOneAndUpdate(query, update, { upsert: true, new: true, runValidators: true });

    // Notify facilitator about trainee attendance
    if (session.facilitatorId) {
        await createNotification({
            recipient: session.facilitatorId._id,
            sender: req.user._id,
            title: "Trainee Marked Attendance",
            message: `Trainee ${req.user.name} marked attendance for session "${session.title}" (${session.programId.name}) via geolocation.`,
            link: `/dashboard/Facilitator/Fac-attendance`,
            type: 'info'
        });
    }

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
    const { userId, status = 'Present', reason } = req.body;

    if (!userId) throw new ApiError(400, "User ID is required.");
    // Populate programId and facilitatorId for validation and notifications
    const session = await ClassSession.findOne({ sessionId })
                                        .populate('programId', 'name')
                                        .populate('facilitatorId', 'name email'); 
    if (!session) throw new ApiError(404, "Session not found.");

    // Verify current user is facilitator of session or Program Manager/SuperAdmin
    if (req.user.role === 'Facilitator' && session.facilitatorId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to mark attendance for this session.");
    }
    if (!['Program Manager', 'SuperAdmin', 'Facilitator'].includes(req.user.role)) {
        throw new ApiError(403, "You do not have permission to manually mark attendance.");
    }

    const todayDateString = new Date(session.startTime).toISOString().split('T')[0];

    const attendance = await Attendance.findOneAndUpdate(
        { userId: userId, programId: session.programId._id, date: todayDateString }, // Use _id from populated programId
        { 
            $set: { 
                status, 
                reason: reason || null, 
                method: 'manual', 
                markedBy: req.user._id, 
                sessionId: session._id,
                programId: session.programId._id // Ensure programId is correctly set
            },
            $setOnInsert: { userId: userId, programId: session.programId._id, date: todayDateString }
        },
        { upsert: true, new: true, runValidators: true }
    );

    const markedUser = await User.findById(userId).select('name');
    // Notify the trainee whose attendance was manually marked
    await createNotification({
        recipient: userId,
        sender: req.user._id,
        title: "Attendance Marked Manually",
        message: `Your attendance for session "${session.title}" (${session.programId.name}) was manually marked as "${status}" by ${req.user.name}.`,
        link: `/dashboard/Trainee/Trattendance`,
        type: (status === 'Absent' || status === 'Late') ? 'warning' : 'info'
    });


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
        query.programId = programId;
    }

    const attendanceRecords = await Attendance.find(query)
        .populate('programId', 'name')
        .sort({ date: -1 });
    
    return res.status(200).json(new ApiResponse(200, attendanceRecords, "Your attendance history fetched successfully."));
});


const endSession = asyncHandler(async (req, res) => {
    const { sessionId: idFromParams } = req.params;
    
    const query = buildSessionQuery(idFromParams, { 
        facilitatorId: req.user._id,
        status: 'active' 
    });
    // Populate programId for notification
    const session = await ClassSession.findOne(query).populate('programId', 'name trainees');

    if (!session) {
        throw new ApiError(404, "Active session not found or you don't have permission to end it.");
    }

    session.status = 'completed';
    session.endTime = new Date();
    await session.save();

    // Notify trainees that the session has ended
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


const getProgramAttendanceSummary = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const { startDate, endDate } = req.query;

    if (!programId || !startDate || !endDate) {
        throw new ApiError(400, "Program ID, start date, and end date are required.");
    }

    // 1. Find the program and its trainees to ensure we list everyone, even those with 0 attendance
    const program = await Program.findById(programId).populate('trainees', 'name email role').lean();
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }

    // 2. Count the total number of sessions held within the date range for this program
    const totalSessions = await ClassSession.countDocuments({
        programId,
        startTime: {
            $gte: new Date(startDate),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) // Include whole end day
        }
    });

    // 3. Aggregate attendance data from the database
    const attendanceSummary = await Attendance.aggregate([
        // Stage 1: Filter records for the correct program and date range
        {
            $match: {
                programId: new mongoose.Types.ObjectId(programId),
                date: { $gte: startDate, $lte: endDate }
            }
        },
        // Stage 2: Join with ClassSession to get the session title for context
        {
            $lookup: {
                from: 'classsessions',
                localField: 'sessionId',
                foreignField: '_id',
                as: 'sessionInfo'
            }
        },
        { $unwind: { path: "$sessionInfo", preserveNullAndEmptyArrays: true } },
        // Stage 3: Group by student (userId)
        {
            $group: {
                _id: "$userId",
                present: { $sum: { $cond: [{ $in: ["$status", ["Present", "Late"]] }, 1, 0] } },
                absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
                late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
                excused: { $sum: { $cond: [{ $eq: ["$status", "Excused"] }, 1, 0] } },
                // Collect all detailed records for the modal view
                records: {
                    $push: {
                        date: "$date",
                        status: "$status",
                        timestamp: "$timestamp",
                        checkIn: "$checkIn",
                        sessionTitle: "$sessionInfo.title",
                        method: "$method"
                    }
                }
            }
        },
        // Stage 4: Sort records within the modal view by date
        {
            $addFields: {
                records: {
                    $sortArray: {
                        input: "$records",
                        sortBy: { date: -1 }
                    }
                }
            }
        }
    ]);

    // 4. Merge program trainees with their attendance data
    const summaryMap = new Map(attendanceSummary.map(item => [item._id.toString(), item]));
    
    const finalReport = program.trainees.map(trainee => {
        const summary = summaryMap.get(trainee._id.toString());
        const presentCount = summary ? summary.present : 0;
        const totalPossible = totalSessions > 0 ? totalSessions : 0;
        // Avoid division by zero, and don't penalize for excused absences in the rate
        const attendanceRate = totalPossible - (summary?.excused || 0) > 0 
            ? Math.round((presentCount / (totalPossible - (summary?.excused || 0))) * 100) 
            : 0;

        return {
            userId: trainee._id,
            name: trainee.name,
            email: trainee.email,
            role: trainee.role,
            present: presentCount,
            absent: summary ? summary.absent : totalPossible - presentCount, // Calculate absent if no record
            late: summary ? summary.late : 0,
            excused: summary ? summary.excused : 0,
            attendanceRate: attendanceRate < 0 ? 0 : attendanceRate,
            records: summary ? summary.records : [],
        };
    });

    res.status(200).json(new ApiResponse(200, {
        totalSessions,
        report: finalReport
    }));
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
    getMyAttendanceHistory,
    getProgramAttendanceSummary,
};