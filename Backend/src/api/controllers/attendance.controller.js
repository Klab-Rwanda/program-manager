import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Attendance } from '../models/attendance.model.js';
import { ClassSession } from '../models/classSession.model.js';
import { Program } from '../models/program.model.js';
import { generateSessionQRCode, generateSessionId, verifySessionQRCode } from '../../services/qr.service.js';
import { isWithinRadius } from '../../services/geolocation.service.js';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js'; // Ensure User model is imported
import { createNotification } from '../../services/notification.service.js'; // Ensure createNotification is imported

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
    const { type, programId, title, description, latitude, longitude, radius } = req.body;
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

    // Notify trainees about the new session
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

    const qrResult = await generateSessionQRCode(session.sessionId, 5);
    session.qrCodeData = qrResult.qrData;
    await session.save();
    return res.status(200).json(new ApiResponse(200, { qrCodeImage: qrResult.qrCodeImage, expiresAt: qrResult.expiresAt }));
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


// ===================================================================
//   TRAINEE ENDPOINTS
// ===================================================================

const markQRAttendance = asyncHandler(async (req, res) => {
    const { qrData } = req.body;
    if (!qrData) throw new ApiError(400, "QR code data is required.");

    const qrResult = verifySessionQRCode(qrData);
    if (!qrResult) throw new ApiError(400, "Invalid or expired QR code.");

    const session = await ClassSession.findOne({ sessionId: qrResult.sessionId, status: 'active' })
                                        .populate('programId', 'name')
                                        .populate('facilitatorId', 'name email');

    if (!session) throw new ApiError(404, "Session not found or not active.");

    const program = await Program.findById(session.programId._id);
    if (!program || !program.trainees.includes(req.user._id)) {
        throw new ApiError(403, "You are not enrolled in this program's session.");
    }

    const todayDateString = new Date(session.startTime).toISOString().split('T')[0];

    const query = { userId: req.user._id, sessionId: session._id };

    const update = {
        $set: {
            programId: session.programId._id,
            date: todayDateString,
            timestamp: new Date(),
            method: 'qr_code',
            status: 'Present'
        }
    };
    
    const attendance = await Attendance.findOneAndUpdate(query, update, { upsert: true, new: true, runValidators: true });

    if (session.facilitatorId) {
        await createNotification({
            recipient: session.facilitatorId._id,
            sender: req.user._id,
            title: "Trainee Marked Attendance",
            message: `Trainee ${req.user.name} marked attendance for session "${session.title}" (${session.programId.name}) via QR code.`,
            link: `/dashboard/Facilitator/Fac-attendance`,
            type: 'info'
        });
    }

    return res.status(201).json(new ApiResponse(201, { attendance }, "QR attendance marked successfully."));
});


const markGeolocationAttendance = asyncHandler(async (req, res) => {
    const { sessionId, latitude, longitude } = req.body;
    if (!sessionId) throw new ApiError(400, "Session ID is required.");
    if (latitude === undefined || longitude === undefined) {
        throw new ApiError(400, "Your location (latitude and longitude) is required for geolocation attendance.");
    }

    const session = await ClassSession.findOne({ sessionId, type: 'physical', status: 'active' })
                                        .populate('programId', 'name')
                                        .populate('facilitatorId', 'name email');

    if (!session) throw new ApiError(404, "Active physical session not found.");

    const program = await Program.findById(session.programId._id);
    if (!program || !program.trainees.includes(req.user._id)) {
        throw new ApiError(403, "You are not enrolled in this program.");
    }
    
    const classLocation = session.location || { lat: -1.9441, lng: 30.0619, radius: 100 };
    if (!isWithinRadius({ lat: latitude, lng: longitude }, classLocation)) {
        throw new ApiError(400, "You are not within the required class location radius.");
    }

    const todayDateString = new Date(session.startTime).toISOString().split('T')[0];

    const query = { userId: req.user._id, sessionId: session._id };
    const update = {
        $set: {
            programId: session.programId._id,
            date: todayDateString,
            timestamp: new Date(),
            method: 'geolocation',
            status: 'Present',
            location: { lat: latitude, lng: longitude }
        }
    };
    
    const attendance = await Attendance.findOneAndUpdate(query, update, { upsert: true, new: true, runValidators: true });

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
    
    const session = await ClassSession.findOne(query)
        .populate('programId', 'name')
        .populate('facilitatorId', 'name email');

    if (!session) throw new ApiError(404, "Session not found.");
    
    const attendance = await Attendance.find({ sessionId: session._id })
        .populate('userId', 'name email')
        .populate('markedBy', 'name')
        .sort({ timestamp: -1 });

    return res.status(200).json(new ApiResponse(200, { session, attendance }, "Attendance report retrieved successfully."));
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
    const { userId, status = 'Present', reason } = req.body; // Default status is 'Present' if not provided

    if (!userId) throw new ApiError(400, "User ID is required.");
    // Populate programId and facilitatorId for validation and notifications
    const session = await ClassSession.findOne({ sessionId })
                                        .populate('programId', 'name trainees') // Added trainees to populate
                                        .populate('facilitatorId', 'name email'); 
    if (!session) throw new ApiError(404, "Session not found.");
    
    // --- AUTHENTICATION LOGIC FOR MANUAL MARKING ---
    let authorized = false;
    // SuperAdmins can mark for any session
    if (req.user.role === 'SuperAdmin') {
        authorized = true;
    } 
    
    else if (req.user.role === 'Program Manager' && session.programId && session.programId.programManager?.toString() === req.user._id.toString()) {
        authorized = true;
    }
   
    else if (req.user.role === 'Facilitator' && session.facilitatorId?.toString() === req.user._id.toString()) {
        authorized = true;
    }

    if (!authorized) {
        throw new ApiError(403, "You are not authorized to manually mark attendance for this session.");
    }
    
    const isTraineeEnrolledInProgram = session.programId.trainees.some(t => t.toString() === userId);
    if (!isTraineeEnrolledInProgram) {
        throw new ApiError(400, "The specified user is not enrolled in this session's program.");
    }

    const todayDateString = new Date(session.startTime).toISOString().split('T')[0];

    const attendance = await Attendance.findOneAndUpdate(
        { userId: userId, sessionId: session._id }, // Query by sessionId (unique index)
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
        { upsert: true, new: true, runValidators: true } // runValidators for enum status
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

    // Notify the facilitator if someone else (PM/SA) marked their session's attendance
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
    start.setUTCHours(0, 0, 0, 0); // Ensure start of day UTC
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999); // Ensure end of day UTC

    const program = await Program.findById(programId).populate('trainees', 'name email');
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }

    // Access check for Program Manager (SuperAdmin implicitly allowed by middleware)
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

    // Get all unique dates where sessions were held within the period
    const classSessions = await ClassSession.find({
        programId: programId,
        startTime: { $gte: start, $lte: end },
        status: { $in: ['active', 'completed'] } // Only count active/completed sessions
    }).select('startTime');

    const reportDatesSet = new Set();
    classSessions.forEach(session => {
        reportDatesSet.add(new Date(session.startTime).toISOString().split('T')[0]);
    });
    // Sort dates chronologically
    const reportDates = Array.from(reportDatesSet).sort();

    // Fetch all attendance records for these trainees within the date range
    const attendanceRecords = await Attendance.find({
        userId: { $in: traineeIds },
        programId: programId,
        timestamp: { $gte: start, $lte: end }
    }).select('userId date status timestamp'); // Also select timestamp to prioritize latest status if duplicates

    // Map for quick lookup: attendanceByTraineeIdAndDate[traineeId][date] = latest_status
    const attendanceByTraineeIdAndDate = new Map();
    attendanceRecords.forEach(record => {
        const traineeStringId = record.userId.toString();
        const recordDate = record.date;

        if (!attendanceByTraineeIdAndDate.has(traineeStringId)) {
            attendanceByTraineeIdAndDate.set(traineeStringId, new Map());
        }

        const traineeDailyMap = attendanceByTraineeIdAndDate.get(traineeStringId);

        // If there are multiple entries for the same trainee on the same day,
        // keep the status from the latest timestamp (e.g., if first marked Absent, then Present)
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
            // Get the status for this trainee on this specific date, defaulting to 'Absent' if no record
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
                totalDaysInPeriod: reportDates.length // Total days classes were held for this period
            }
        };
    });
    
    // Calculate overall summary stats across all trainees for the selected period
    const overallTotalPresent = traineeReports.reduce((sum, tr) => sum + tr.summary.present, 0);
    const overallTotalAbsent = traineeReports.reduce((sum, tr) => sum + tr.summary.absent, 0);
    const overallTotalLate = traineeReports.reduce((sum, tr) => sum + tr.summary.late, 0);
    const overallTotalExcused = traineeReports.reduce((sum, tr) => sum + tr.summary.excused, 0);

    const summaryStats = {
        totalDaysInPeriod: reportDates.length, // Number of unique class days in the period
        totalPresentCount: overallTotalPresent,
        totalAbsentCount: overallTotalAbsent,
        totalLateCount: overallTotalLate,
        totalExcusedCount: overallTotalExcused,
        totalTrainees: program.trainees.length // Total trainees in the program
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

    let query = { userId: traineeId };
    if (programId && programId !== 'all') { 
        query.programId = programId;
    }
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp = { $gte: start, $lte: end }; 
    }

    const attendanceRecords = await Attendance.find(query)
        .populate('programId', 'name')
        .sort({ timestamp: -1 }); 
    
    return res.status(200).json(new ApiResponse(200, attendanceRecords, "Your attendance history fetched successfully."));
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
        }
    });

    const attendanceSummary = await Attendance.aggregate([
        {
            $match: {
                programId: new mongoose.Types.ObjectId(programId),
                timestamp: { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) } 
            }
        },
        {
            $lookup: {
                from: 'classsessions',
                localField: 'sessionId',
                foreignField: '_id',
                as: 'sessionInfo'
            }
        },
        { $unwind: { path: "$sessionInfo", preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: "$userId",
                present: { $sum: { $cond: [{ $in: ["$status", ["Present", "Late"]] }, 1, 0] } },
                absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
                late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
                excused: { $sum: { $cond: [{ $eq: ["$status", "Excused"] }, 1, 0] } },
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
        {
            $addFields: {
                records: {
                    $sortArray: {
                        input: "$records",
                        sortBy: { timestamp: -1 } 
                    }
                }
            }
        }
    ]);

    const summaryMap = new Map(attendanceSummary.map(item => [item._id.toString(), item]));
    
    const finalReport = program.trainees.map(trainee => {
        const summary = summaryMap.get(trainee._id.toString());
        const presentCount = summary ? summary.present : 0;
        const totalPossible = totalSessions > 0 ? totalSessions : 0;
        const excusedCount = summary?.excused || 0;
        const actualTotalForRate = totalPossible - excusedCount;

        const attendanceRate = actualTotalForRate > 0 
            ? Math.round((presentCount / actualTotalForRate) * 100) 
            : 0;

        return {
            userId: trainee._id,
            name: trainee.name,
            email: trainee.email,
            role: trainee.role,
            present: presentCount,
            absent: summary ? summary.absent : totalPossible - presentCount, 
            late: summary ? summary.late : 0,
            excused: excusedCount,
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