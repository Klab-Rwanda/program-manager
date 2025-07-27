import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Program } from '../models/program.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ClassSession } from '../models/classSession.model.js';
import { Course } from '../models/course.model.js';
import { Log } from '../models/log.model.js';
import { Roadmap } from '../models/roadmap.model.js';
import { Assignment } from '../models/assignment.model.js';
import { Submission } from '../models/submission.model.js';

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

export const getAdminOverview = asyncHandler(async (req, res) => {
    // Determine if the user is a manager to filter some stats
    const isManager = req.user.role === 'Program Manager' ;
    const managerQuery = isManager ? { programManager: req.user._id } : {};

    const [
        totalPrograms,
        activePrograms,
        pendingPrograms,
        totalTrainees,
        totalFacilitators,
        pendingCourses,
        recentLogs,
        programsEndingSoon,
    ] = await Promise.all([
        Program.countDocuments(managerQuery),
        Program.countDocuments({ ...managerQuery, status: 'Active' }),
        Program.countDocuments({ ...managerQuery, status: 'PendingApproval' }),
        User.countDocuments({ role: 'Trainee', isActive: true }), // System-wide for now
        User.countDocuments({ role: 'Facilitator', isActive: true }), // System-wide for now
        Course.countDocuments({ status: 'PendingApproval' }), // System-wide for now
        Log.find({}).sort({ createdAt: -1 }).limit(5).populate('user', 'name role'),
        Program.find({
            ...managerQuery,
            status: 'Active',
            endDate: { $gte: new Date(), $lte: new Date(new Date().setDate(new Date().getDate() + 30)) }
        }).sort('endDate').limit(3).select('name endDate')
    ]);

    const stats = {
        totalPrograms,
        activePrograms,
        pendingPrograms,
        totalTrainees,
        totalFacilitators,
        pendingCourses,
        recentLogs,
        programsEndingSoon,
    };
    
    return res.status(200).json(new ApiResponse(200, stats, "Admin overview fetched successfully."));
});

/**
 * @desc    Get recent activity for dashboard.
 * @route   GET /api/v1/dashboard/recent-activity
 * @access  Private (SuperAdmin, ProgramManager)
 */
export const getRecentActivity = asyncHandler(async (req, res) => {
    const isManager = req.user.role === 'Program Manager';
    const managerQuery = isManager ? { programManager: req.user._id } : {};

    // Get recent roadmaps submitted
    const recentRoadmaps = await Roadmap.find({
        ...managerQuery,
        status: 'pending_approval'
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('program', 'name')
    .populate('facilitator', 'name');

    // Get recent assignment submissions
    const recentSubmissions = await Submission.find({
        submittedAt: { $exists: true, $ne: null }
    })
    .sort({ submittedAt: -1 })
    .limit(3)
    .populate('assignment', 'title')
    .populate('trainee', 'name');

    // Get recent assignments created
    const recentAssignments = await Assignment.find({
        ...managerQuery
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('program', 'name')
    .populate('course', 'name');

    const activities = [];

    // Add roadmap activities
    recentRoadmaps.forEach(roadmap => {
        activities.push({
            id: roadmap._id.toString(),
            type: 'roadmap_submitted',
            title: 'New roadmap submitted',
            description: `${roadmap.program?.name || 'Unknown Program'} - Week ${roadmap.weekNumber} roadmap submitted by ${roadmap.facilitator?.name || 'Unknown Facilitator'}`,
            timestamp: roadmap.createdAt,
            programName: roadmap.program?.name,
            facilitatorName: roadmap.facilitator?.name
        });
    });

    // Add submission activities
    recentSubmissions.forEach(submission => {
        activities.push({
            id: submission._id.toString(),
            type: 'assignment_completed',
            title: 'Assignment completed',
            description: `${submission.assignment?.title || 'Unknown Assignment'} completed by ${submission.trainee?.name || 'Unknown Trainee'}`,
            timestamp: submission.submittedAt,
            assignmentName: submission.assignment?.title,
            traineeName: submission.trainee?.name
        });
    });

    // Add assignment creation activities
    recentAssignments.forEach(assignment => {
        activities.push({
            id: assignment._id.toString(),
            type: 'assignment_created',
            title: 'New assignment created',
            description: `${assignment.title} created for ${assignment.program?.name || 'Unknown Program'}`,
            timestamp: assignment.createdAt,
            assignmentName: assignment.title,
            programName: assignment.program?.name
        });
    });

    // Sort all activities by timestamp (most recent first) and take top 10
    const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

    return res.status(200).json(new ApiResponse(200, sortedActivities, "Recent activity fetched successfully."));
});