import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Submission } from '../models/submission.model.js';
import { Assignment } from '../models/assignment.model.js'; // To link submissions to assignments
import { Program } from '../models/program.model.js'; // To verify program access
import { Course } from '../models/course.model.js'; // To verify course/facilitator access (though now primarily populated via Assignment)
import { createNotification } from '../../services/notification.service.js';
import { User } from '../models/user.model.js'; // Needed to populate trainee name for notification message

// Helper to verify facilitator owns the course/program for submissions
const verifyFacilitatorSubmissionAccess = async (submissionId, facilitatorId) => {
    // Populate assignment and its facilitator/course to check access
    const submission = await Submission.findById(submissionId)
                                       .populate({
                                           path: 'assignment',
                                           populate: [
                                               { path: 'facilitator', select: '_id' }, // Only need ID for comparison
                                               { path: 'course', select: 'title' } // For potential message if needed
                                           ]
                                       });

    if (!submission) throw new ApiError(404, "Submission not found.");
    if (!submission.assignment) throw new ApiError(500, "Submission's associated assignment not found or was deleted.");

    // Check if the facilitator of the assignment matches the current user
    if (submission.assignment.facilitator.toString() !== facilitatorId.toString()) {
        throw new ApiError(403, "Forbidden: You are not the facilitator for this assignment.");
    }
    return submission;
};

// Trainee submits a project for an assignment
const createSubmission = asyncHandler(async (req, res) => {
    const { courseId, programId } = req.body;
    const traineeId = req.user._id;

    if (!req.file) {
        throw new ApiError(400, "Project file is required.");
    }
    const fileUrl = req.file.path; // In a real app, this would be a cloud URL

    // NEW: Verify program is Active for submission
    const program = await Program.findById(programId);
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }
    if (program.status !== 'Active') {
        throw new ApiError(400, `Cannot submit. The program "${program.name}" is not active.`);
    }

    const submission = await Submission.create({
        program: programId,
        course: courseId,
        trainee: traineeId,
        fileUrl,
    });

    return res.status(201).json(new ApiResponse(201, submission, "Project submitted successfully."));
});

// Facilitator gets all submissions for a course they manage
// This is being refactored to fetch all submissions for programs/courses they are assigned to.
const getSubmissionsForFacilitator = asyncHandler(async (req, res) => {
    const facilitatorId = req.user._id;

    // 1. Find all programs this facilitator is assigned to
    const programs = await Program.find({ facilitators: facilitatorId }).select('_id');
    const programIds = programs.map(p => p._id);

    // 2. Find all submissions for assignments linked to programs this facilitator manages
    //    OR for assignments created by this facilitator.
    const submissions = await Submission.find({ program: { $in: programIds } })
        .populate('trainee', 'name email') // Populate trainee details
        .populate('assignment', 'title description maxGrade dueDate facilitator') // Populate assignment details including facilitator
        .populate('course', 'title') // Populate course title
        .populate('program', 'name') // Populate program name
        .sort({ submittedAt: -1 }); // Most recent submissions first
    
    // Optional: Filter client-side if the facilitator field in assignment is not the current facilitator
    // (though the initial program filter should be good enough for most cases)
    const filteredByFacilitatorAssignments = submissions.filter(sub => {
        // Ensure assignment is populated and its facilitator matches the current user
        return sub.assignment && sub.assignment.facilitator && sub.assignment.facilitator.toString() === facilitatorId.toString();
    });

    return res.status(200).json(new ApiResponse(200, filteredByFacilitatorAssignments, "Submissions fetched successfully for facilitator."));
});


// Facilitator reviews a submission (grades it)
const reviewSubmission = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { status, feedback, grade } = req.body; // status: 'Reviewed', 'NeedsRevision'
    const facilitatorId = req.user._id;

    // Validate input
    if (!status || !['Reviewed', 'NeedsRevision'].includes(status)) {
        throw new ApiError(400, "Invalid status provided. Must be 'Reviewed' or 'NeedsRevision'.");
    }

    // Ensure grade is null/undefined if status is NeedsRevision
    if (status === 'NeedsRevision' && (grade !== undefined && grade !== null && grade !== '')) {
        throw new ApiError(400, "Grade cannot be provided when requesting a revision (status 'NeedsRevision').");
    }
    
    // Ensure grade is present and valid if status is Reviewed
    if (status === 'Reviewed') {
        const numericGrade = parseFloat(grade);
        if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) { // Assuming max grade of 100 for basic validation
            throw new ApiError(400, "A valid numeric grade (0-100) is required for a 'Reviewed' submission.");
        }
    }


    // Ensure facilitator has permission to review this submission
    // We need to populate trainee, course, and assignment for notification
    const submission = await Submission.findById(submissionId)
                                       .populate('trainee', 'name email')
                                       .populate('course', 'title')
                                       .populate('assignment', 'facilitator'); // Only need facilitator ID from assignment

    if (!submission) throw new ApiError(404, "Submission not found.");
    if (!submission.assignment || submission.assignment.facilitator.toString() !== facilitatorId.toString()) {
        throw new ApiError(403, "Forbidden: You are not the facilitator for this assignment.");
    }
    if (!submission.trainee) throw new ApiError(500, "Trainee not found for submission.");
    if (!submission.course) throw new ApiError(500, "Course not found for submission.");


    submission.status = status;
    submission.feedback = feedback;
    submission.grade = (status === 'Reviewed' ? grade : null); // Set grade to null if NeedsRevision or invalid

    await submission.save();

    // Send notification to trainee
    let notificationTitle = "Assignment Graded!";
    let notificationMessage = `Your submission for "${submission.course.title}" has been graded.`;
    let notificationType= 'success'; // Type for notification service

    if (status === 'NeedsRevision') {
        notificationTitle = "Assignment Needs Revision";
        notificationMessage = `Your submission for "${submission.course.title}" requires revisions.`;
        notificationType = 'warning';
    }
    // Add grade to message if available and relevant
    if (grade && status === 'Reviewed') { 
        notificationMessage += ` Grade: ${grade}.`;
    }
    // Add feedback snippet if available
    if (feedback) { 
        notificationMessage += ` Feedback: "${feedback.substring(0, 50)}${feedback.length > 50 ? '...' : ''}"`;
    }

    await createNotification({
        recipient: submission.trainee._id,
        sender: req.user._id, // The facilitator who reviewed it
        title: notificationTitle,
        message: notificationMessage,
        link: `/dashboard/Trainee/my-submissions`, // Link to trainee's submissions
        type: notificationType
    });

    return res.status(200).json(new ApiResponse(200, submission, "Submission reviewed successfully."));
});

// Trainee gets all their own submissions
const getMySubmissions = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;

    // Find programs the trainee is enrolled in that are Active or Completed
    const userPrograms = await Program.find({ 
        trainees: traineeId, 
        status: { $in: ['Active', 'Completed'] } 
    }).select('_id');

    if (userPrograms.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "Not enrolled in any active or completed programs."));
    }
    const programIds = userPrograms.map(p => p._id);

    const submissions = await Submission.find({ 
        trainee: traineeId,
        program: { $in: programIds } // Filter submissions by these programs
    })
        .populate('course', 'title') 
        .populate('program', 'name status') // Populate program status for frontend filtering
        .sort({ submittedAt: -1 });

    return res.status(200).json(new ApiResponse(200, submissions, "Your submissions fetched successfully."));
});



export { 
    createSubmission, 
    getSubmissionsForFacilitator, 
    reviewSubmission, 
    getMySubmissions 
};