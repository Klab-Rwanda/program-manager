import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Course } from '../models/course.model.js';
import { Program } from '../models/program.model.js';
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

