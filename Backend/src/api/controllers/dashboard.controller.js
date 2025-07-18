import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Course } from '../models/course.model.js';
import { Program } from '../models/program.model.js';
import { Submission } from '../models/submission.model.js'; // Assuming you might need this
import { ApiResponse } from '../../utils/ApiResponse.js';

/**
 * @desc    Get dashboard summary statistics.
 * @route   GET /api/v1/dashboard/stats
 * @access  Private (SuperAdmin, ProgramManager)
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
    // We can run these database queries in parallel for better performance
    const [
        totalPrograms,
        activeTrainees,
        totalUsers,
        pendingApprovals
    ] = await Promise.all([
        Program.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'Trainee', status: 'Active' }),
        User.countDocuments({ isActive: true }),
        Program.countDocuments({ status: 'PendingApproval' })
    ]);

    const stats = {
        totalPrograms,
        activeTrainees,
        totalUsers,
        pendingApprovals
    };

    return res.status(200).json(new ApiResponse(200, stats, "Dashboard statistics fetched successfully."));
});

// FIX: Added the 'export' keyword here
export const getProgramManagerStats = asyncHandler(async (req, res) => {
    const managerId = req.user._id;

    // Find all programs managed by this PM
    const programs = await Program.find({ programManagers: managerId });
    const programIds = programs.map(p => p._id);
    
    const activeProgramsCount = programs.filter(p => p.status === 'Active').length;
    
    // Count all unique trainees across all managed programs
    const trainees = new Set();
    programs.forEach(p => {
        p.trainees.forEach(t => trainees.add(t.toString()));
    });
    const totalTrainees = trainees.size;

    // Count pending courses in managed programs
    const pendingCourses = await Course.countDocuments({ program: { $in: programIds }, status: 'PendingApproval' });

    const stats = {
        activePrograms: activeProgramsCount,
        totalTrainees: totalTrainees,
        avgProgress: 68, // This would be a complex aggregation, mocking for now
        pendingCourses: pendingCourses,
    };

    return res.status(200).json(new ApiResponse(200, stats, "Program Manager stats fetched."));
});

/**
 * @desc    Get dashboard summary statistics for a logged-in Facilitator.
 * @route   GET /api/v1/dashboard/facilitator
 * @access  Private (Facilitator)
 */
export const getFacilitatorDashboard = asyncHandler(async (req, res) => {
    const facilitatorId = req.user._id;

    // 1. Get all programs assigned to this facilitator
    const assignedPrograms = await Program.find({ facilitators: facilitatorId }).select('_id');
    const assignedProgramIds = assignedPrograms.map(p => p._id);
    
    // 2. Get all courses assigned to this facilitator
    const assignedCourses = await Course.find({ facilitator: facilitatorId }).select('_id');
    const assignedCourseIds = assignedCourses.map(c => c._id);
    
    // 3. Run stats queries in parallel
    const [
        pendingReviewsCount,
    ] = await Promise.all([
        Submission.countDocuments({ course: { $in: assignedCourseIds }, status: 'Submitted' }),
    ]);

    // TODO: A real attendance rate would be a complex aggregation. We'll mock it for now.
    const weeklyAttendanceRate = 87;

    // TODO: Fetch real upcoming sessions from the Roadmap model based on the current date.
    const upcomingSessions = [
        { _id: '1', programName: 'Software Engineering Bootcamp', sessionTitle: 'React State Management', startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), location: 'Room A1', status: 'Upcoming' },
        { _id: '2', programName: 'Tech for Kids', sessionTitle: 'Introduction to Scratch', startTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() + 6.5 * 60 * 60 * 1000).toISOString(), location: 'Room B2', status: 'Upcoming' },
    ];

    // TODO: Fetch real recent activities from the Log model.
    const recentActivities = [
        { _id: 'act1', action: 'SESSION_COMPLETED', details: 'Class completed - 18/20 students attended', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { _id: 'act2', action: 'SUBMISSION_RECEIVED', details: 'New project submission from Sarah M.', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    ];


    const data = {
        stats: {
            assignedProgramsCount: assignedProgramIds.length,
            todaysSessionsCount: upcomingSessions.length, // Mocked for now
            pendingReviewsCount: pendingReviewsCount,
            weeklyAttendanceRate: weeklyAttendanceRate, // Mocked for now
        },
        upcomingSessions: upcomingSessions,
        recentActivities: recentActivities,
    };

    return res.status(200).json(new ApiResponse(200, data, "Facilitator dashboard data fetched."));
});