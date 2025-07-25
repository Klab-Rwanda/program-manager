import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Assignment } from '../models/assignment.model.js';
import { Course } from '../models/course.model.js';
import { Program } from '../models/program.model.js';

// Helper to verify facilitator owns the course/program
const verifyFacilitatorAccess = async (courseId, facilitatorId) => {
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found.");
    if (course.facilitator.toString() !== facilitatorId.toString()) {
        throw new ApiError(403, "Forbidden: You are not the facilitator of this course.");
    }
    return course;
};

/**
 * @desc    Create a new assignment for a course.
 * @route   POST /api/v1/assignments
 * @access  Private (Facilitator)
 */
export const createAssignment = asyncHandler(async (req, res) => {
    const { title, description, courseId, dueDate, maxGrade } = req.body;
    const facilitatorId = req.user._id;

    const course = await verifyFacilitatorAccess(courseId, facilitatorId);

    const assignment = await Assignment.create({
        title,
        description,
        course: courseId,
        program: course.program,
        facilitator: facilitatorId,
        dueDate,
        maxGrade,
    });

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
    const { title, description, dueDate, maxGrade } = req.body;
    
    const assignment = await Assignment.findById(id);
    if (!assignment) throw new ApiError(404, "Assignment not found.");

    await verifyFacilitatorAccess(assignment.course, req.user._id);

    assignment.title = title ?? assignment.title;
    assignment.description = description ?? assignment.description;
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

    return res.status(200).json(new ApiResponse(200, {}, "Assignment deleted successfully."));
});

export const getMyAvailableAssignments = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;

    // 1. Find all programs the trainee is enrolled in.
    const userPrograms = await Program.find({ trainees: traineeId }).select('_id');
    if (userPrograms.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "Not enrolled in any programs."));
    }
    const programIds = userPrograms.map(p => p._id);

    // 2. Find all assignments that belong to any of those programs.
    const assignments = await Assignment.find({
        program: { $in: programIds },
        isActive: true // Only show active assignments
    })
    .populate('program', 'name')
    .populate('course', 'title')
    .sort({ dueDate: 1 }); // Sort by the nearest due date first

    return res.status(200).json(new ApiResponse(200, assignments, "Available assignments fetched successfully."));
});