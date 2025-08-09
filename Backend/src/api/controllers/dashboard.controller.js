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

export const getFacilitatorDashboardStats = asyncHandler(async (req, res) => {
    const facilitatorId = req.user._id;

    // Fetch programs assigned to this facilitator
    const assignedPrograms = await Program.find({ facilitators: facilitatorId, isActive: true }).select('_id trainees');
    const assignedProgramIds = assignedPrograms.map(p => p._id);

    // Count total students across all assigned programs
    let totalStudents = 0;
    assignedPrograms.forEach(program => {
        totalStudents += program.trainees.length;
    });

    // Count courses created by this facilitator
    const courses = await Course.find({ facilitator: facilitatorId }).select('status');
    const totalCourses = courses.length;
    const approvedCourses = courses.filter(c => c.status === 'Approved').length;

    // Count sessions scheduled for today by this facilitator
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const todaysSessions = await ClassSession.countDocuments({
        facilitatorId,
        startTime: { $gte: startOfDay, $lte: endOfDay }
    });

    // Count pending submissions for assignments created by this facilitator
    // This is more complex and would ideally involve joining Submission and Assignment by facilitatorId
    // For now, we count pending assignments that belong to courses/programs this facilitator manages
    const pendingReviews = await Submission.countDocuments({
        status: 'Submitted', // Assuming 'Submitted' means pending review
        // You would need to refine this to only count for THIS facilitator's assignments
        // A more robust query: find assignments created by this facilitator, then count submissions for them.
        // For simplicity, let's keep it as is (counting general pending reviews) or directly count assignments.
        // Let's count assignments created by this facilitator that have NOT been graded yet.
        assignment: { $in: await Assignment.find({ facilitator: facilitatorId }).select('_id') }
    });


    // Attendance rate placeholder (complex to calculate accurately across multiple classes/students without aggregation)
    const attendanceRate = 92; // Still a mock or aggregate from data you retrieve elsewhere

    const stats = {
        assignedPrograms: assignedProgramIds.length,
        todaysSessions,
        totalStudents,      // NEW
        totalCourses,       // NEW
        approvedCourses,    // NEW
        pendingReviews,
        attendanceRate
    };
    return res.status(200).json(new ApiResponse(200, stats, "Facilitator dashboard stats fetched successfully."));
});


export const getAdminOverview = asyncHandler(async (req, res) => {
    // Determine if the user is a manager to filter some stats
    const isManager = req.user.role === 'Program Manager';
    const managerQuery = isManager ? { programManager: req.user._id } : {};

    const [
        totalPrograms, // This variable will now hold the count of 'Active' or 'PendingApproval' programs
        activePrograms,
        pendingPrograms,
        totalTrainees,
        totalFacilitators,
        pendingCourses,
        recentLogs,
        programsEndingSoon,
    ] = await Promise.all([
        // Count programs that are either 'Active' or 'PendingApproval'
        // The pre-find middleware in program.model.js will already filter out isDeleted:true and isArchived:true
        Program.countDocuments({ 
            ...managerQuery, 
            status: { $in: ['Active', 'PendingApproval'] } 
        }),
        
        // These are already correctly filtered by status
        Program.countDocuments({ ...managerQuery, status: 'Active' }),
        Program.countDocuments({ ...managerQuery, status: 'PendingApproval' }),
        
        // These remain system-wide counts for SuperAdmin, or filtered by manager for Program Manager
        User.countDocuments({ role: 'Trainee', isActive: true }),
        User.countDocuments({ role: 'Facilitator', isActive: true }),
        Course.countDocuments({ status: 'PendingApproval' }), // Pending course approvals are system-wide for SuperAdmin, or could be filtered by program manager's courses if desired (but generally pending approvals are centralized)
        Log.find({}).sort({ createdAt: -1 }).limit(5).populate('user', 'name role'),
        Program.find({
            ...managerQuery,
            status: 'Active', // Only active programs ending soon
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





export const getRecentActivity = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;

    let programQuery = {}; // For filtering by manager/facilitator if applicable

    // Determine programs relevant to the user's role
    if (userRole === 'Program Manager') {
        programQuery = { programManager: userId };
    } else if (userRole === 'Facilitator') {
        programQuery = { facilitators: userId };
    }

    // Get recent roadmaps submitted (only by this facilitator or for managed programs)
    const recentRoadmaps = await Roadmap.find({
        ...programQuery,
        ...(userRole === 'Facilitator' && { facilitator: userId }), // Specifically filter by facilitator ID if it's a facilitator
        status: 'pending_approval' // Show roadmaps pending approval in recent activity
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('program', 'name')
    .populate('course', 'title') // Populate course for more context
    .populate('facilitator', 'name');

    // Get recent assignment submissions for assignments related to this facilitator's courses
    // Or for managed programs if it's a Program Manager
    const relevantAssignments = await Assignment.find({
        ...programQuery,
        ...(userRole === 'Facilitator' && { facilitator: userId })
    }).select('_id title maxGrade course program facilitator');

    const relevantAssignmentIds = relevantAssignments.map(a => a._id);

    const recentSubmissions = await Submission.find({
        assignment: { $in: relevantAssignmentIds },
        submittedAt: { $exists: true, $ne: null }
    })
    .sort({ submittedAt: -1 })
    .limit(3)
    .populate('assignment', 'title') // Should populate assignment title
    .populate('trainee', 'name');

    // Get recent assignments created by this facilitator (or for managed programs)
    const recentAssignmentsCreated = await Assignment.find({
        ...programQuery,
        ...(userRole === 'Facilitator' && { facilitator: userId })
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('program', 'name')
    .populate('course', 'title');

    // Get recent session activities related to this facilitator
    const recentSessionsActivity = await ClassSession.find({
        facilitatorId: userId,
        startTime: { $lte: new Date() } // Sessions that have started or completed
    })
    .sort({ startTime: -1 })
    .limit(3)
    .populate('programId', 'name');


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
            facilitatorName: roadmap.facilitator?.name,
            courseTitle: roadmap.course?.title // Added courseTitle
        });
    });

    // Add submission activities
    recentSubmissions.forEach(submission => {
        activities.push({
            id: submission._id.toString(),
            type: 'assignment_completed',
            title: 'Assignment completed',
            description: `${submission.assignment?.title || 'Unknown Assignment'} completed by ${submission.trainee?.name || 'Unknown Trainee'}. Status: ${submission.status || 'N/A'}. Grade: ${submission.grade || 'N/A'}`,
            timestamp: submission.submittedAt,
            assignmentName: submission.assignment?.title,
            traineeName: submission.trainee?.name,
            status: submission.status,
            grade: submission.grade
        });
    });

    // Add assignment creation activities
    recentAssignmentsCreated.forEach(assignment => {
        activities.push({
            id: assignment._id.toString(),
            type: 'assignment_created',
            title: 'New assignment created',
            description: `${assignment.title} created for ${assignment.program?.name || 'Unknown Program'} (${assignment.course?.title || 'Unknown Course'})`,
            timestamp: assignment.createdAt,
            assignmentName: assignment.title,
            programName: assignment.program?.name,
            courseName: assignment.course?.title
        });
    });

    // Add recent session activities
    recentSessionsActivity.forEach(session => {
        activities.push({
            id: session._id.toString(),
            type: 'session_activity',
            title: `Session Activity: ${session.title}`,
            description: `Session "${session.title}" (${session.programId?.name || 'Unknown Program'}) was ${session.status}. Started at ${new Date(session.startTime).toLocaleString()}`,
            timestamp: session.startTime,
            sessionTitle: session.title,
            programName: session.programId?.name,
            sessionStatus: session.status
        });
    });

    // Sort all activities by timestamp (most recent first) and take top 10
    const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

    return res.status(200).json(new ApiResponse(200, sortedActivities, "Recent activity fetched successfully."));
});