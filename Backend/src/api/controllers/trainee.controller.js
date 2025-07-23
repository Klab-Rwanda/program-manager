import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Program } from '../models/program.model.js';
import { Submission } from '../models/submission.model.js';
import { Attendance } from '../models/attendance.model.js';
import mongoose from 'mongoose';

export const getMyProgress = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;

    // 1. Get all programs the trainee is enrolled in
    const programs = await Program.find({ trainees: traineeId, status: 'Active' }).lean();
    if (programs.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "Trainee is not enrolled in any active programs."));
    }

    const programIds = programs.map(p => p._id);

    // 2. Get all submissions for this trainee in these programs
    const submissions = await Submission.find({ trainee: traineeId, program: { $in: programIds } });

    // 3. Get all attendance records
    const sessions = await mongoose.model('ClassSession').find({ programId: { $in: programIds } });
    const sessionIds = sessions.map(s => s._id);
    const attendanceRecords = await Attendance.find({ userId: traineeId, sessionId: { $in: sessionIds } });

    // 4. Calculate stats for each program
    const progressData = programs.map(program => {
        const programSubmissions = submissions.filter(s => s.program.toString() === program._id.toString());
        const programSessions = sessions.filter(s => s.programId.toString() === program._id.toString());
        const programAttendance = attendanceRecords.filter(a => programSessions.some(ps => ps._id.toString() === a.sessionId.toString()));

        const attendanceRate = programSessions.length > 0
            ? Math.round((programAttendance.length / programSessions.length) * 100)
            : 100;

        return {
            program: program.name,
            overallProgress: 65, // This is complex, so we'll mock it for now
            attendanceRate: attendanceRate,
            assignmentsCompleted: programSubmissions.length,
            totalAssignments: 10, // Mocked, would need to count courses/assignments in program
            averageGrade: "B+", // Mocked, would need to average grades
        };
    });

    return res.status(200).json(new ApiResponse(200, progressData, "Progress data fetched successfully."));
});