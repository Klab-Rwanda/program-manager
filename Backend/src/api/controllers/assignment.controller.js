import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Assignment } from '../models/assignment.model.js';
import { Course } from '../models/course.model.js';
import { Program } from '../models/program.model.js';
import { Roadmap } from '../models/roadmap.model.js';
import { User } from '../models/user.model.js';
import { Submission } from '../models/submission.model.js'; // Import Submission model to check status
import { sendAssignmentNotificationEmail } from '../../services/email.service.js';
import { createNotification } from '../../services/notification.service.js';

// Helper to verify facilitator owns the course/program
const verifyFacilitatorAccess = async (courseId, facilitatorId) => {
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found.");
    if (course.facilitator.toString() !== facilitatorId.toString()) {
        throw new ApiError(403, "Forbidden: You are not the facilitator of this course.");
    }
    return course;
};

// Helper to send assignment notifications to trainees
const sendAssignmentNotifications = async (assignment, course, program, facilitator) => {
    try {
        // Get all trainees enrolled in this program
        const trainees = await User.find({ 
            _id: { $in: program.trainees },
            role: 'Trainee'
        }).select('name email');

        if (trainees.length === 0) {
            console.log('No trainees found for program:', program._id);
            return { success: true, sentCount: 0 };
        }

        console.log(`Sending assignment notifications to ${trainees.length} trainees`);

        // Send emails to all trainees
        const emailPromises = trainees.map(trainee => 
            sendAssignmentNotificationEmail(
                trainee.email,
                trainee.name,
                assignment.title,
                course.title,
                program.name,
                assignment.dueDate,
                facilitator.name
            )
        );

          const notificationPromises = trainees.map(trainee =>
            createNotification({
                recipient: trainee._id,
                sender: facilitator._id,
                title: `New Assignment: ${assignment.title}`,
                message: `A new assignment "${assignment.title}" has been posted for your course "${course.title}" in program "${program.name}". Due: ${new Date(assignment.dueDate).toLocaleDateString()}.`,
                link: `/dashboard/Trainee/submit-projects`, // Link to trainee's submission page
                type: 'info'
            })
        );
        const results = await Promise.allSettled(emailPromises);
        const successfulEmails = results.filter(result => result.status === 'fulfilled' && result.value).length;

        console.log(`Successfully sent ${successfulEmails} out of ${trainees.length} assignment notifications`);

        return { 
            success: true, 
            sentCount: successfulEmails,
            totalCount: trainees.length
        };
    } catch (error) {
        console.error('Error sending assignment notifications:', error);
        return { 
            success: false, 
            error: error.message,
            sentCount: 0
        };
    }
};

/**
 * @desc    Create a new assignment for a course.
 * @route   POST /api/v1/assignments
 * @access  Private (Facilitator)
 */
export const createAssignment = asyncHandler(async (req, res) => {
    console.log('=== CREATE ASSIGNMENT DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user._id);
    
    const { title, description, courseId, roadmapId, dueDate, maxGrade } = req.body;
    const facilitatorId = req.user._id;

    console.log('Extracted fields:', { title, description, courseId, roadmapId, dueDate, maxGrade });

    // Validate required fields
    if (!title || !description || !courseId || !roadmapId || !dueDate) {
        console.log('Validation failed - missing fields:', { title: !!title, description: !!description, courseId: !!courseId, roadmapId: !!roadmapId, dueDate: !!dueDate });
        throw new ApiError(400, "All required fields must be provided.");
    }

    const course = await verifyFacilitatorAccess(courseId, facilitatorId);

    // Verify roadmap exists and belongs to the course
    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
        throw new ApiError(404, "Roadmap not found.");
    }
    if (roadmap.course.toString() !== courseId) {
        throw new ApiError(400, "Roadmap does not belong to the selected course.");
    }

    console.log('Creating assignment with data:', {
        title,
        description,
        course: courseId,
        roadmap: roadmapId,
        program: course.program,
        facilitator: facilitatorId,
        dueDate,
        maxGrade,
    });

    const assignment = await Assignment.create({
        title,
        description,
        course: courseId,
        roadmap: roadmapId,
        program: course.program,
        facilitator: facilitatorId,
        dueDate,
        maxGrade,
    });

    console.log('Assignment created successfully:', assignment._id);

    // Send notifications to trainees
    try {
        // Get program and facilitator details for notifications
        const program = await Program.findById(course.program).populate('trainees');
        const facilitator = await User.findById(facilitatorId).select('name');

        if (program && facilitator) {
            console.log('Sending assignment notifications to trainees...');
            const notificationResult = await sendAssignmentNotifications(assignment, course, program, facilitator);
            
            if (notificationResult.success) {
                // Update assignment to mark as sent to trainees
                await Assignment.findByIdAndUpdate(assignment._id, {
                    sentToTrainees: true,
                    sentToTraineesAt: new Date()
                });
                
                console.log(`Assignment notifications sent: ${notificationResult.sentCount}/${notificationResult.totalCount} trainees notified`);
            } else {
                console.error('Failed to send assignment notifications:', notificationResult.error);
            }
        }
    } catch (notificationError) {
        console.error('Error in assignment notification process:', notificationError);
        // Don't fail the assignment creation if notifications fail
    }

    return res.status(201).json(new ApiResponse(201, assignment, "Assignment created successfully."));
});

/**
 * @desc    Get all assignments for a specific course.
 * @route   GET /api/v1/assignments/course/:courseId
 * @access  Private (Facilitator, Trainee)
 */
export const getAssignmentsForCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const assignments = await Assignment.find({ course: courseId }).sort({ dueDate: 1 });
    return res.status(200).json(new ApiResponse(200, assignments, "Assignments fetched successfully."));
});

/**
 * @desc    Get all assignments created by the logged-in facilitator.
 * @route   GET /api/v1/assignments/my-assignments
 * @access  Private (Facilitator)
 */
export const getMyCreatedAssignments = asyncHandler(async (req, res) => {
    const assignments = await Assignment.find({ facilitator: req.user._id })
        .populate('course', 'title')
        .populate('program', 'name')
        .populate('roadmap', 'title weekNumber')
        .sort({ dueDate: -1 });
    return res.status(200).json(new ApiResponse(200, assignments));
});


/**
 * @desc    Update an assignment.
 * @route   PATCH /api/v1/assignments/:id
 * @access  Private (Facilitator)
 */
export const updateAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, roadmapId, dueDate, maxGrade } = req.body;
    
    const assignment = await Assignment.findById(id);
    if (!assignment) throw new ApiError(404, "Assignment not found.");

    await verifyFacilitatorAccess(assignment.course, req.user._id);

    // If roadmapId is provided, verify it exists and belongs to the course
    if (roadmapId) {
        const roadmap = await Roadmap.findById(roadmapId);
        if (!roadmap) {
            throw new ApiError(404, "Roadmap not found.");
        }
        if (roadmap.course.toString() !== assignment.course.toString()) {
            throw new ApiError(400, "Roadmap does not belong to the assignment's course.");
        }
    }

    assignment.title = title ?? assignment.title;
    assignment.description = description ?? assignment.description;
    assignment.roadmap = roadmapId ?? assignment.roadmap;
    assignment.dueDate = dueDate ?? assignment.dueDate;
    assignment.maxGrade = maxGrade ?? assignment.maxGrade;
    
    await assignment.save();

    return res.status(200).json(new ApiResponse(200, assignment, "Assignment updated successfully."));
});

/**
 * @desc    Delete an assignment.
 * @route   DELETE /api/v1/assignments/:id
 * @access  Private (Facilitator)
 */
export const deleteAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) throw new ApiError(404, "Assignment not found.");
    
    await verifyFacilitatorAccess(assignment.course, req.user._id);

    await assignment.deleteOne();

     const trainees = await User.find({ _id: { $in: assignment.program.trainees }, role: 'Trainee' }).select('_id');
    const notificationPromises = trainees.map(trainee => 
        createNotification({
            recipient: trainee._id,
            sender: facilitatorId,
            title: `Assignment Deleted: ${assignment.title}`,
            message: `The assignment "${assignment.title}" for course "${assignment.course.title}" has been deleted.`,
            link: `/dashboard/Trainee/submit-projects`, // Link might show nothing now
            type: 'warning'
        })
    );
     await Promise.allSettled(notificationPromises);

    return res.status(200).json(new ApiResponse(200, {}, "Assignment deleted successfully."));
});

/**
 * @desc    Get assignments available for a trainee to submit (not yet reviewed/graded).
 * @route   GET /api/v1/assignments/my-available
 * @access  Private (Trainee)
 */
export const getMyAvailableAssignments = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;

    // 1. Find all programs the trainee is enrolled in.
    const userPrograms = await Program.find({ trainees: traineeId }).select('_id');
    if (userPrograms.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "Not enrolled in any programs."));
    }
    const programIds = userPrograms.map(p => p._id);

    // 2. Find all assignments that belong to any of those programs AND are active.
    let assignments = await Assignment.find({
        program: { $in: programIds },
        isActive: true,
        dueDate: { $gte: new Date() } // Only include assignments not yet past due
    })
    .populate('program', 'name')
    .populate('course', 'title')
    .sort({ dueDate: 1 });

    // 3. Filter out assignments for which the trainee has a 'Reviewed' or 'Graded' submission.
    //    We need to fetch submissions for these assignments by this trainee.
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await Submission.find({
        trainee: traineeId,
        assignment: { $in: assignmentIds },
        status: { $in: ['Reviewed', 'Graded'] }
    }).select('assignment');

    const reviewedOrGradedAssignmentIds = new Set(submissions.map(s => s.assignment.toString()));

    const availableAssignments = assignments.filter(assignment => 
        !reviewedOrGradedAssignmentIds.has(assignment._id.toString())
    );

    return res.status(200).json(new ApiResponse(200, availableAssignments, "Available assignments fetched successfully."));
});


export const getAssignmentsForProgram = asyncHandler(async (req, res) => {
    const { programId } = req.params;

    // 1. Find all APPROVED courses for this program.
    const approvedCourses = await Course.find({ 
        program: programId, 
        status: 'Approved' 
    }).select('_id');

    const courseIds = approvedCourses.map(c => c._id);

    // 2. Find all assignments linked to those approved courses.
    const assignments = await Assignment.find({ course: { $in: courseIds } });
    
    return res.status(200).json(new ApiResponse(200, assignments, "Assignments fetched successfully."));
});

/**
 * @desc    Resend assignment notifications to trainees.
 * @route   POST /api/v1/assignments/:id/resend-notifications
 * @access  Private (Facilitator)
 */
export const resendAssignmentNotifications = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const assignment = await Assignment.findById(id)
        .populate('course', 'title')
        .populate('program', 'name trainees')
        .populate('facilitator', 'name');
    
    if (!assignment) {
        throw new ApiError(404, "Assignment not found.");
    }

    // Verify facilitator owns the assignment
    await verifyFacilitatorAccess(assignment.course, req.user._id);

    console.log('Resending assignment notifications for:', assignment.title);

    // Send notifications to trainees
    const notificationResult = await sendAssignmentNotifications(
        assignment, 
        assignment.course, 
        assignment.program, 
        assignment.facilitator
    );

    if (notificationResult.success) {
        // Update assignment to mark as sent to trainees
        await Assignment.findByIdAndUpdate(assignment._id, {
            sentToTrainees: true,
            sentToTraineesAt: new Date()
        });
        
        console.log(`Assignment notifications resent: ${notificationResult.sentCount}/${notificationResult.totalCount} trainees notified`);
    }

    return res.status(200).json(new ApiResponse(200, notificationResult, "Assignment notifications resent successfully."));
});