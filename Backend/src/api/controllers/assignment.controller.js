import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Assignment } from '../models/assignment.model.js';
import { Course } from '../models/course.model.js';
import { Program } from '../models/program.model.js';
import { Roadmap } from '../models/roadmap.model.js';
import { User } from '../models/user.model.js';
import { sendAssignmentNotificationEmail } from '../../services/email.service.js';

// Helper to verify facilitator owns the course/program AND program is Active (for modification actions)
const verifyFacilitatorActiveProgramAccess = async (courseId, facilitatorId) => {
    const course = await Course.findById(courseId).populate('program');
    if (!course) throw new ApiError(404, "Course not found.");
    if (course.facilitator.toString() !== facilitatorId.toString()) {
        throw new ApiError(403, "Forbidden: You are not the facilitator of this course.");
    }
    if (!course.program || course.program.status !== 'Active') {
        throw new ApiError(400, `Cannot perform this action. The program "${course.program?.name || 'unknown'}" is not active.`);
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

    const course = await verifyFacilitatorActiveProgramAccess(courseId, facilitatorId); // Access check includes program is Active

    // Verify roadmap exists and belongs to the course
    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
        throw new ApiError(404, "Roadmap not found.");
    }
    if (roadmap.course.toString() !== courseId) {
        throw new ApiError(400, "Roadmap does not belong to the selected course.");
    }
    // Verify roadmap's program status is Active
    const programForRoadmap = await Program.findById(roadmap.program);
    if (!programForRoadmap || programForRoadmap.status !== 'Active') {
        throw new ApiError(400, `Cannot create assignment. The program "${programForRoadmap?.name || 'unknown'}" for this roadmap is not active.`);
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
    
    // Allow fetching assignments for courses in ACTIVE OR COMPLETED programs
    const course = await Course.findById(courseId).populate('program');
    if (!course) throw new ApiError(404, "Course not found.");
    
    // Trainees: Must be enrolled in program, program must be Active/Completed, and course must be Approved.
    if (req.user.role === 'Trainee') {
        const userPrograms = await Program.find({ trainees: req.user._id, _id: course.program._id }).select('_id status');
        if (userPrograms.length === 0) {
            throw new ApiError(403, "Forbidden: You are not enrolled in this program.");
        }
        if (course.status !== 'Approved') {
            throw new ApiError(403, "Access Denied: This course is not approved for trainee access.");
        }
        if (userPrograms[0].status !== 'Active' && userPrograms[0].status !== 'Completed') {
            throw new ApiError(403, "Access Denied: This course belongs to an inaccessible program.");
        }
    } else { // Facilitator, PM, SA: Allow viewing assignments for courses in Active/Completed programs
        if (course.program.status !== 'Active' && course.program.status !== 'Completed') {
            throw new ApiError(403, "Access Denied: This course belongs to an inaccessible program.");
        }
    }


    const assignments = await Assignment.find({ course: courseId }).sort({ dueDate: 1 });
    return res.status(200).json(new ApiResponse(200, assignments, "Assignments fetched successfully."));
});

/**
 * @desc    Get all assignments created by the logged-in facilitator, including those from completed programs.
 * @route   GET /api/v1/assignments/my-assignments
 * @access  Private (Facilitator)
 */
export const getMyCreatedAssignments = asyncHandler(async (req, res) => {
    // NEW: Fetch all assignments created by facilitator, populating program status
    const userPrograms = await Program.find({ facilitators: req.user._id, status: { $in: ['Active', 'Completed'] } }).select('_id');
    const programIds = userPrograms.map(p => p._id);

    const assignments = await Assignment.find({ 
        facilitator: req.user._id,
        program: { $in: programIds } // Only show assignments for programs facilitator is involved with (active or completed)
    })
        .populate('course', 'title')
        .populate('program', 'name status') // Populate status to filter on frontend
        .populate('roadmap', 'title weekNumber')
        .sort({ dueDate: -1 }); // Sort newest first

    // Send all for frontend to sort into tabs
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

    await verifyFacilitatorActiveProgramAccess(assignment.course, req.user._id); // Access check includes program is Active

    // If roadmapId is provided, verify it exists and belongs to the course
    if (roadmapId) {
        const roadmap = await Roadmap.findById(roadmapId);
        if (!roadmap) {
            throw new ApiError(404, "Roadmap not found.");
        }
        if (roadmap.course.toString() !== assignment.course.toString()) {
            throw new ApiError(400, "Roadmap does not belong to the assignment's course.");
        }
        // Also check the roadmap's program status if roadmap is changed
        const programForRoadmap = await Program.findById(roadmap.program);
        if (!programForRoadmap || programForRoadmap.status !== 'Active') {
            throw new ApiError(400, `Cannot update assignment with this roadmap. The program "${programForRoadmap?.name || 'unknown'}" for this roadmap is not active.`);
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
    
    await verifyFacilitatorActiveProgramAccess(assignment.course, req.user._id); // Access check includes program is Active

    await assignment.deleteOne();

    return res.status(200).json(new ApiResponse(200, {}, "Assignment deleted successfully."));
});

/**
 * @desc    Get all assignments available to the logged-in trainee.
 * @route   GET /api/v1/assignments/my-available
 * @access  Private (Trainee)
 */
export const getMyAvailableAssignments = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;

    // 1. Find all programs the trainee is enrolled in and are 'Active'.
    const userPrograms = await Program.find({ trainees: traineeId, status: 'Active' }).select('_id');
    if (userPrograms.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "Not enrolled in any active programs."));
    }
    const programIds = userPrograms.map(p => p._id);

    // 2. Find all assignments that belong to any of those active programs.
    const assignments = await Assignment.find({
        program: { $in: programIds },
        isActive: true // Only show active assignments
    })
    .populate('program', 'name')
    .populate('course', 'title')
    .sort({ dueDate: 1 }); // Sort by the nearest due date first

    return res.status(200).json(new ApiResponse(200, assignments, "Available assignments fetched successfully."));
});

/**
 * @desc    Get all assignments for a specific program (used for trainee submit-project page)
 * @route   GET /api/v1/assignments/program/:programId
 * @access  Private (Trainee)
 */
export const getAssignmentsForProgram = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const traineeId = req.user._id;

    // Verify program exists and trainee is enrolled and program is Active
    const program = await Program.findById(programId);
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }
    if (!program.trainees.includes(traineeId)) {
        throw new ApiError(403, "Forbidden: You are not enrolled in this program.");
    }
    if (program.status !== 'Active') {
        throw new ApiError(400, "This program is not active. Cannot retrieve assignments for submission.");
    }

    const assignments = await Assignment.find({ 
        program: programId,
        isActive: true
    })
    .populate('course', 'title')
    .populate('roadmap', 'title weekNumber')
    .sort({ dueDate: 1 });

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
        .populate('program', 'name trainees status') // Populate program status
        .populate('facilitator', 'name');
    
    if (!assignment) {
        throw new ApiError(404, "Assignment not found.");
    }

    // Verify facilitator owns the assignment and program is active
    if (assignment.facilitator.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Forbidden: You are not the facilitator of this assignment.");
    }
    if (assignment.program.status !== 'Active') {
        throw new ApiError(400, `Cannot resend notifications. The program "${assignment.program.name}" is not active.`);
    }

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