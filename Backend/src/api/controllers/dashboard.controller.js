import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Program } from '../models/program.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ClassSession } from '../models/classSession.model.js';
import { Course } from '../models/course.model.js';

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

/**
 * @desc    Get facilitator dashboard statistics.
 * @route   GET /api/v1/dashboard/facilitator-stats
 * @access  Private (Facilitator)
 */
export const getFacilitatorDashboardStats = asyncHandler(async (req, res) => {
    const facilitatorId = req.user._id;
    // Assigned programs: count of programs where facilitator is assigned
    const assignedPrograms = await Program.countDocuments({ facilitators: facilitatorId, isActive: true });
    // Today's sessions: count of sessions scheduled for today for this facilitator
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const todaysSessions = await ClassSession.countDocuments({
        facilitatorId,
        startTime: { $gte: startOfDay, $lte: endOfDay }
    });
    // Pending reviews: count of courses with status 'PendingApproval' for this facilitator
    const pendingReviews = await Course.countDocuments({ facilitator: facilitatorId, status: 'PendingApproval' });
    // Attendance rate: placeholder (real calculation would require more logic)
    const attendanceRate = 92;
    const stats = {
        assignedPrograms,
        todaysSessions,
        pendingReviews,
        attendanceRate
    };
    return res.status(200).json(new ApiResponse(200, stats, "Facilitator dashboard stats fetched successfully."));
});