import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Course } from '../models/course.model.js';
import { Program } from '../models/program.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import path from 'path';
import fs from 'fs';
import { Assignment } from '../models/assignment.model.js';
import { Submission } from '../models/submission.model.js';
import { Attendance } from '../models/attendance.model.js';
import { createNotification } from '../../services/notification.service.js';


export const createCourse = asyncHandler(async (req, res) => {
    const { title, description, programId } = req.body;
    const facilitatorId = req.user._id;

    if (!req.file) {
        throw new ApiError(400, "Course content document is required.");
    }

    // --- THIS IS THE FIX ---
    // Instead of using req.file.path, we construct a URL-friendly path.
    // req.file.path might be "public\\temp\\filename.pdf"
    // We want to store "uploads/filename.pdf" in the database.
    const contentUrl = `uploads/${req.file.filename}`;
    // --- END OF FIX ---

    const course = await Course.create({
        title,
        description,
        program: programId,
        facilitator: facilitatorId,
        contentUrl, // Save the corrected, relative URL path
        status: 'Draft' // Changed from PendingApproval to Draft as per our workflow
    });

    return res.status(201).json(new ApiResponse(201, course, "Course created as Draft successfully."));
});

export const approveCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const course = await Course.findByIdAndUpdate(courseId, { status: 'Approved' }, { new: true });
    
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

     await createNotification({
        recipient: course.facilitator, // The facilitator who created the course
        sender: req.user._id, // The manager who approved it
        title: "Your Course has been Approved!",
        message: `Your course "${course.title}" is now active and visible to trainees.`,
        link: `/dashboard/Facilitator/fac-curriculum`, // Link for the facilitator
        type: 'success',
    });

    return res.status(200).json(new ApiResponse(200, course, "Course has been approved."));
});

export const getCoursesForProgram = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const courses = await Course.find({ program: programId }).populate('facilitator', 'name');
    return res.status(200).json(new ApiResponse(200, courses, "Courses fetched successfully."));
});

export const verifyFacilitatorAccess = async (courseId, facilitatorId) => {
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, "Course not found.");
    if (course.facilitator.toString() !== facilitatorId.toString()) {
        throw new ApiError(403, "Forbidden: You do not have permission to modify this course.");
    }
    return course;
};



export const requestCourseApproval = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const facilitatorId = req.user._id;
    // First, verify the facilitator owns this course
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, 'Course not found.');
    if (course.facilitator.toString() !== facilitatorId.toString()) {
        throw new ApiError(403, 'Forbidden: You can only request approval for your own courses.');
    }
    if (course.status !== 'Draft' && course.status !== 'Rejected') { // Allow re-submission if rejected
        throw new ApiError(400, 'Only draft or rejected courses can be submitted for approval.');
    }
    // Update the status from 'Draft' to 'PendingApproval'
    course.status = 'PendingApproval';
    await course.save();
    return res.status(200).json(new ApiResponse(200, course, 'Course submitted for approval.'));
});


export const getAllCourses = asyncHandler(async (req, res) => {
    // Only Facilitator or Program Manager can access
    if (!['Facilitator', 'Program Manager', 'SuperAdmin'].includes(req.user.role)) { // Added SuperAdmin
        throw new ApiError(403, 'Forbidden: Only facilitators, program managers, and super admins can access this resource.');
    }
    // Optionally, add filters/search here
    const courses = await Course.find().populate('program', 'name').populate('facilitator', 'name email');
    return res.status(200).json(new ApiResponse(200, courses, 'All courses fetched successfully.'));
});


export const downloadCourseFile = asyncHandler(async (req, res) => {
    // Anyone who has access to the course information should be able to download the file.
    // For simplicity, we allow it for Facilitator, Program Manager, and Trainee.
    // More granular control would check if the user is enrolled in the program.
    if (!['Facilitator', 'Program Manager', 'Trainee', 'SuperAdmin'].includes(req.user.role)) {
        throw new ApiError(403, 'Forbidden: You do not have permission to download this resource.');
    }

    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, 'Course not found.');
    }
    if (!course.contentUrl) {
        throw new ApiError(404, 'No file found for this course.');
    }

    // Construct the absolute path to the file
    // Assumes `contentUrl` stores a relative path like "uploads/filename.pdf"
    // and your `public` directory is at the project root.
    const rootDir = process.cwd(); // Get the current working directory (project root)
    const filePath = path.join(rootDir, 'public', course.contentUrl); // Corrected path construction

    console.log('Download request - Course ID:', courseId);
    console.log('File path from database:', course.contentUrl);
    console.log('Constructed absolute file path:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.log('File does not exist at path:', filePath);
        throw new ApiError(404, 'File not found on server.');
    }
    
    console.log('File exists, proceeding with download');
    
    const fileName = path.basename(filePath);
    const fileExtension = path.extname(fileName).toLowerCase();
    
    console.log('File name:', fileName);
    console.log('File extension:', fileExtension);
    
    // Define MIME types for different file extensions
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv',
        '.flv': 'video/x-flv',
        '.webm': 'video/webm',
        '.mkv': 'video/x-matroska',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.txt': 'text/plain',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.zip': 'application/zip', // Added zip for submissions
        '.rar': 'application/x-rar-compressed', // Added rar
        '.7z': 'application/x-7z-compressed' // Added 7z
    };
    
    // Try to get content type from file extension first, then from course type
    let contentType = mimeTypes[fileExtension];
    if (!contentType && course.type) { // Fallback to `course.type` field if available
        contentType = mimeTypes[`.${course.type.toLowerCase()}`] || `application/${course.type.toLowerCase()}`;
        console.log('Using course type for MIME type:', course.type, '->', contentType);
    }
    
    // Fallback to octet-stream if still no content type
    if (!contentType) {
        contentType = 'application/octet-stream';
        console.log('No content type found, using fallback:', contentType);
    }
    
    console.log('Final Content-Type:', contentType);
    
    try {
        // Set headers for proper download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        fileStream.on('error', (err) => {
            console.error('File stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to download file.' });
            }
        });
        
        fileStream.on('end', () => {
            console.log('File download completed successfully');
        });
        
    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to download file.' });
        }
    }
});



export const getMyCourses = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;

    let programQuery = {};

    if (userRole === 'Trainee') {
        programQuery = { trainees: userId };
    } else if (userRole === 'Facilitator') {
        programQuery = { facilitators: userId };
    } else {
        return res.status(200).json(new ApiResponse(200, [], "No courses applicable for your role via this endpoint."));
    }

    const userPrograms = await Program.find(programQuery).select('_id');
    if (userPrograms.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "You are not enrolled in any programs."));
    }
    const programIds = userPrograms.map(p => p._id);

    // --- THIS IS THE FIX ---
    const courseQuery = { program: { $in: programIds } };
    if (userRole === 'Trainee') {
        // Trainees ONLY see Approved courses. This is correct.
        courseQuery.status = 'Approved';
    } else if (userRole === 'Facilitator') {
        // Facilitators need to see ALL courses they created, regardless of status.
        courseQuery.facilitator = userId;
    }
    // --- END OF FIX ---

    const courses = await Course.find(courseQuery)
        .populate('program', 'name')
        .populate('facilitator', 'name')
        .sort({ createdAt: -1 }); // Sort by newest first
        
    return res.status(200).json(new ApiResponse(200, courses, "Your courses fetched successfully."));
});





export const updateCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, description } = req.body;

    // Verify ownership and ensure the course is in an editable state ('Draft' or 'Rejected')
    await verifyFacilitatorAccess(courseId, req.user._id);

    const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        {
            $set: { title, description },
            // If a rejected course is edited, it should go back to Draft status
            $unset: { rejectionReason: "" }, // Remove rejection reason
            status: 'Draft'
        },
        { new: true, runValidators: true }
    ).populate('program', 'name');

    return res.status(200).json(new ApiResponse(200, updatedCourse, "Course updated successfully."));
});



export const deleteCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    
    // For deletion, we can allow it regardless of status for simplicity,
    // but we MUST verify ownership.
    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found.");
    }
    if (course.facilitator.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Forbidden: You do not have permission to delete this course.");
    }
    
    // In a real app, you would also delete the associated file from storage (e.g., S3).
    // For local storage, this is more complex, so we'll skip it for now.
    
    await Course.findByIdAndDelete(courseId);

    return res.status(200).json(new ApiResponse(200, {}, "Course deleted successfully."));
});

export const rejectCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
        throw new ApiError(400, "A reason for rejection is required.");
    }
    
    const course = await Course.findByIdAndUpdate(
        courseId, 
        { status: 'Rejected', rejectionReason: reason }, 
        { new: true }
    );
    
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    await createNotification({
        recipient: course.facilitator,
        sender: req.user._id,
        title: "Action Required: Course Rejected",
        message: `Your course "${course.title}" was rejected. Please review the feedback and resubmit.`,
        link: `/dashboard/Facilitator/fac-curriculum`,
        type: 'warning',
    });
    return res.status(200).json(new ApiResponse(200, course, "Course has been rejected."));
});


// --- NEW FUNCTION ---
/**
 * @desc    Program Manager activates a rejected course.
 * @route   PATCH /api/v1/courses/{courseId}/activate
 * @access  Private (ProgramManager)
 */
export const activateCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    
    const course = await Course.findByIdAndUpdate(
        courseId, 
        { 
            status: 'Approved',
            $unset: { rejectionReason: "" } // Remove rejection reason when activating
        }, 
        { new: true }
    );
    
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    return res.status(200).json(new ApiResponse(200, course, "Course has been activated."));
});

// --- NEW FUNCTION ---
/**
 * @desc    Program Manager gets all courses pending their approval.
 * @route   GET /api/v1/courses/pending
 * @access  Private (ProgramManager)
 */



export const getPendingCourses = asyncHandler(async (req, res) => {
    // In a more complex app, you'd filter by programs the manager owns.
    // For now, any manager can see all pending courses.
    const courses = await Course.find({ status: 'PendingApproval' })
        .populate('facilitator', 'name email')
        .populate('program', 'name');
        
    return res.status(200).json(new ApiResponse(200, courses, "Pending courses fetched successfully."));
});


// --- NEW FUNCTION ---
/**
 * @desc    Program Manager gets courses by status.
 * @route   GET /api/v1/courses/status/:status
 * @access  Private (ProgramManager)
 */
export const getCoursesByStatus = asyncHandler(async (req, res) => {
    const { status } = req.params;
    
    // Validate status parameter
    const validStatuses = ['Draft', 'PendingApproval', 'Approved', 'Rejected'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status. Must be one of: Draft, PendingApproval, Approved, Rejected");
    }
    
    const courses = await Course.find({ status })
        .populate('facilitator', 'name email')
        .populate('program', 'name')
        .sort({ createdAt: -1 }); // Sort by newest first
        
    return res.status(200).json(new ApiResponse(200, courses, `Courses with status '${status}' fetched successfully.`));
});

// --- NEW FUNCTION ---
/**
 * @desc    Program Manager gets assignments with student marks and attendance for a course.
 * @route   GET /api/v1/courses/{courseId}/assignments-with-marks
 * @access  Private (ProgramManager)
 */
export const getCourseAssignmentsWithMarks = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    
    // Find the course and verify it exists
    const course = await Course.findById(courseId)
        .populate('program', 'name')
        .populate('facilitator', 'name email');
    
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Get all assignments for this course
    const assignments = await Assignment.find({ course: courseId })
        .populate('facilitator', 'name email')
        .sort({ dueDate: -1 });

    // Get all submissions for this course with trainee info
    const submissions = await Submission.find({ course: courseId })
        .populate('trainee', 'name email')
        .populate('assignment', 'title maxGrade')
        .sort({ submittedAt: -1 });

    // Get attendance data for trainees in this course's program
    const attendanceData = await Attendance.aggregate([
        {
            $match: {
                programId: course.program._id
            }
        },
        {
            $group: {
                _id: '$userId',
                totalSessions: { $sum: 1 },
                presentSessions: {
                    $sum: {
                        $cond: [
                            { $in: ['$status', ['Present', 'Late']] },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'trainee'
            }
        },
        {
            $unwind: '$trainee'
        },
        {
            $project: {
                traineeId: '$_id',
                traineeName: '$trainee.name',
                traineeEmail: '$trainee.email',
                totalSessions: 1,
                presentSessions: 1,
                attendancePercentage: {
                    $multiply: [
                        {
                            $cond: [
                                { $eq: ['$totalSessions', 0] },
                                0,
                                {
                                    $divide: ['$presentSessions', '$totalSessions']
                                }
                            ]
                        },
                        100
                    ]
                }
            }
        }
    ]);

    // Organize data by assignment
    const assignmentsWithMarks = assignments.map(assignment => {
        const assignmentSubmissions = submissions.filter(sub => 
            sub.assignment && sub.assignment._id.toString() === assignment._id.toString()
        );

        const submissionsWithAttendance = assignmentSubmissions.map(submission => {
            const traineeAttendance = attendanceData.find(att => 
                att.traineeId.toString() === submission.trainee._id.toString()
            );

            return {
                submissionId: submission._id,
                traineeName: submission.trainee.name,
                traineeEmail: submission.trainee.email,
                submittedAt: submission.submittedAt,
                status: submission.status,
                grade: submission.grade || 'Not graded',
                feedback: submission.feedback || '',
                attendancePercentage: traineeAttendance ? 
                    Math.round(traineeAttendance.attendancePercentage) : 0,
                totalSessions: traineeAttendance ? traineeAttendance.totalSessions : 0,
                presentSessions: traineeAttendance ? traineeAttendance.presentSessions : 0
            };
        });

        return {
            assignmentId: assignment._id,
            assignmentTitle: assignment.title,
            assignmentDescription: assignment.description,
            dueDate: assignment.dueDate,
            maxGrade: assignment.maxGrade,
            facilitatorName: assignment.facilitator.name,
            submissions: submissionsWithAttendance
        };
    });

    return res.status(200).json(new ApiResponse(200, {
        course: {
            _id: course._id,
            title: course.title,
            program: course.program.name,
            facilitator: course.facilitator.name
        },
        assignments: assignmentsWithMarks
    }, "Course assignments with marks and attendance fetched successfully."));
});


export const getAllCoursesAdmin = asyncHandler(async (req, res) => {
    const courses = await Course.find({}) // Find all courses, no filter
        .populate('program', 'name')
        .populate('facilitator', 'name')
        .sort({ createdAt: -1 });
        
    return res.status(200).json(new ApiResponse(200, courses, "All courses fetched successfully."));
});