import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Submission } from '../models/submission.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

// Trainee submits a project for a course
const createSubmission = asyncHandler(async (req, res) => {
    const { courseId, programId } = req.body;
    const traineeId = req.user._id;

    if (!req.file) {
        throw new ApiError(400, "Project file is required.");
    }
    const fileUrl = req.file.path; // In a real app, this would be a cloud URL

    const submission = await Submission.create({
        program: programId,
        course: courseId,
        trainee: traineeId,
        fileUrl,
    });

    return res.status(201).json(new ApiResponse(201, submission, "Project submitted successfully."));
});

// Facilitator gets all submissions for a course they manage
const getSubmissionsForCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const submissions = await Submission.find({ course: courseId })
        .populate('trainee', 'name email');
    
    return res.status(200).json(new ApiResponse(200, submissions, "Submissions fetched successfully."));
});

// Facilitator reviews a submission (grades it)
const reviewSubmission = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { status, feedback, grade } = req.body;

    // TODO: Add a check to ensure the req.user (facilitator) is allowed to grade this submission

    const updatedSubmission = await Submission.findByIdAndUpdate(
        submissionId,
        { status, feedback, grade },
        { new: true }
    );

    if (!updatedSubmission) {
        throw new ApiError(404, "Submission not found.");
    }

    return res.status(200).json(new ApiResponse(200, updatedSubmission, "Submission reviewed successfully."));
});



export const getSubmissionsForFacilitator = asyncHandler(async (req, res) => {
    const facilitatorId = req.user._id;

    // 1. Find all courses this facilitator is assigned to.
    const coursesTaught = await Course.find({ facilitator: facilitatorId }).select('_id');
    if (coursesTaught.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "You are not assigned to any courses."));
    }
    const courseIds = coursesTaught.map(course => course._id);

    // 2. Find all submissions for those specific courses.
    const submissions = await Submission.find({ course: { $in: courseIds } })
        .populate('trainee', 'name email')
        .populate('program', 'name')
        .populate('course', 'title')
        .sort({ submittedAt: -1 });

    return res.status(200).json(new ApiResponse(200, submissions, "Submissions for your review fetched successfully."));
});

export { createSubmission, getSubmissionsForCourse, reviewSubmission };