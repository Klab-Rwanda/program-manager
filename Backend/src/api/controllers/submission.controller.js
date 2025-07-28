import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Submission } from '../models/submission.model.js';
import { Assignment } from '../models/assignment.model.js'; // To link submissions to assignments
import { Program } from '../models/program.model.js'; // To verify program access
import { Course } from '../models/course.model.js'; // To verify course/facilitator access

// Helper to verify facilitator owns the course/program for submissions
const verifyFacilitatorSubmissionAccess = async (submissionId, facilitatorId) => {
    const submission = await Submission.findById(submissionId).populate('assignment');
    if (!submission) throw new ApiError(404, "Submission not found.");
    if (!submission.assignment) throw new ApiError(500, "Submission's assignment not found.");

    const assignment = await Assignment.findById(submission.assignment._id);
    if (!assignment) throw new ApiError(500, "Associated assignment not found.");

    if (assignment.facilitator.toString() !== facilitatorId.toString()) {
        throw new ApiError(403, "Forbidden: You are not the facilitator for this assignment.");
    }
    return submission;
};

// Trainee submits a project for an assignment
const createSubmission = asyncHandler(async (req, res) => {
    const { assignmentId } = req.body;
    const traineeId = req.user._id;

    if (!assignmentId) {
        throw new ApiError(400, "Assignment ID is required.");
    }
    if (!req.file) {
        throw new ApiError(400, "Project file is required.");
    }

    const fileUrl = `uploads/${req.file.filename}`; // Consistent with course upload path

    // Verify assignment exists and trainee is in the associated program
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
        throw new ApiError(404, "Assignment not found.");
    }

    const program = await Program.findById(assignment.program);
    if (!program || !program.trainees.includes(traineeId)) {
        throw new ApiError(403, "You are not enrolled in the program associated with this assignment.");
    }

    // Check if trainee has already submitted for this assignment
    const existingSubmission = await Submission.findOne({
        trainee: traineeId,
        assignment: assignmentId
    });

    if (existingSubmission) {
        // Allow re-submission only if status is 'Submitted' (pending review) or 'NeedsRevision'
        if (existingSubmission.status === 'Reviewed' || existingSubmission.status === 'Graded') {
             throw new ApiError(400, "You have already submitted and it has been reviewed/graded. Cannot resubmit.");
        }
        
        // Update existing submission
        existingSubmission.fileUrl = fileUrl;
        existingSubmission.submittedAt = new Date();
        existingSubmission.status = 'Submitted'; // Reset status to submitted for re-submission
        existingSubmission.feedback = ''; // Clear feedback on resubmission
        existingSubmission.grade = null; // Clear grade on resubmission (set to null)
        await existingSubmission.save();

        return res.status(200).json(new ApiResponse(200, existingSubmission, "Project re-submitted successfully."));

    } else {
        // Create new submission
        const submission = await Submission.create({
            program: assignment.program,
            course: assignment.course,
            assignment: assignmentId, // Link to assignment
            trainee: traineeId,
            fileUrl,
            submittedAt: new Date(),
            status: 'Submitted' // Default status
        });

        return res.status(201).json(new ApiResponse(201, submission, "Project submitted successfully."));
    }
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
    const submission = await verifyFacilitatorSubmissionAccess(submissionId, facilitatorId);

    submission.status = status;
    submission.feedback = feedback;
    submission.grade = (status === 'Reviewed' ? grade : null); // Set grade to null if NeedsRevision or invalid

    await submission.save();

    return res.status(200).json(new ApiResponse(200, submission, "Submission reviewed successfully."));
});

// Trainee gets all their own submissions
const getMySubmissions = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;

    const submissions = await Submission.find({ trainee: traineeId })
        .populate('assignment', 'title description maxGrade dueDate') // Populate assignment details
        .populate('course', 'title') // Populate the course title
        .populate('program', 'name') // Populate the program name
        .sort({ submittedAt: -1 });

    return res.status(200).json(new ApiResponse(200, submissions, "Your submissions fetched successfully."));
});


export { 
    createSubmission, 
    getSubmissionsForFacilitator, // Renamed and adjusted this function for facilitator's view
    reviewSubmission, 
    getMySubmissions 
};