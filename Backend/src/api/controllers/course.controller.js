import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Course } from '../models/course.model.js';
import { Program } from '../models/program.model.js';
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

    // NEW: Verify program exists and is 'Active' before creating a course for it
    const program = await Program.findById(programId);
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }
    if (program.status !== 'Active') {
        throw new ApiError(400, "Cannot create a course for an inactive program. Program must be 'Active'.");
    }

    const contentUrl = `uploads/${req.file.filename}`;

    const course = await Course.create({
        title,
        description,
        program: programId,
        facilitator: facilitatorId,
        contentUrl, 
        status: 'Draft' 
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
        recipient: course.facilitator, 
        sender: req.user._id, 
        title: "Your Course has been Approved!",
        message: `Your course "${course.title}" is now active and visible to trainees.`,
        link: `/dashboard/Facilitator/fac-curriculum`, 
        type: 'success',
    });

    return res.status(200).json(new ApiResponse(200, course, "Course has been approved."));
});

export const getCoursesForProgram = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    // Return all courses for program, but ensure program is Active/Completed
    const program = await Program.findById(programId);
    if (!program) throw new ApiError(404, "Program not found.");
    if (program.status !== 'Active' && program.status !== 'Completed') {
        throw new ApiError(403, `Access Denied: Courses for program "${program.name}" are not accessible (status: ${program.status}).`);
    }

    const courses = await Course.find({ program: programId }).populate('facilitator', 'name');
    return res.status(200).json(new ApiResponse(200, courses, "Courses fetched successfully."));
});

export const verifyFacilitatorAccess = async (courseId, facilitatorId) => {
    const course = await Course.findById(courseId).populate('program');
    if (!course) throw new ApiError(404, "Course not found.");
    if (course.facilitator.toString() !== facilitatorId.toString()) {
        throw new ApiError(403, "Forbidden: You do not have permission to modify this course.");
    }
    // Check if the course's program is Active for modification actions
    if (!course.program || course.program.status !== 'Active') {
        throw new ApiError(400, `Cannot perform this action. The program "${course.program?.name || 'unknown'}" is not active.`);
    }
    return course;
};


export const requestCourseApproval = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const facilitatorId = req.user._id;
    // First, verify the facilitator owns this course
    const course = await Course.findById(courseId).populate('program'); // Populate program for status check
    if (!course) throw new ApiError(404, 'Course not found.');
    if (course.facilitator.toString() !== facilitatorId.toString()) {
        throw new ApiError(403, 'Forbidden: You can only request approval for your own courses.');
    }
    if (course.status !== 'Draft' && course.status !== 'Rejected') { // Allow resubmission from rejected
        throw new ApiError(400, 'Only draft or rejected courses can be submitted for approval.');
    }
    // Verify program is Active before allowing submission for approval
    if (!course.program || course.program.status !== 'Active') {
        throw new ApiError(400, `Cannot submit course for approval. The program "${course.program?.name || 'unknown'}" is not active.`);
    }

    // Update the status from 'Draft' to 'PendingApproval'
    course.status = 'PendingApproval';
    course.rejectionReason = undefined; // Clear rejection reason on resubmission
    await course.save();
    return res.status(200).json(new ApiResponse(200, course, 'Course submitted for approval.'));
});


export const getAllCourses = asyncHandler(async (req, res) => {
    // This endpoint is for Program Manager/SuperAdmin to see ALL courses, regardless of program status or approval status.
    const courses = await Course.find().populate('program', 'name').populate('facilitator', 'name email');
    return res.status(200).json(new ApiResponse(200, courses, 'All courses fetched successfully.'));
});


export const downloadCourseFile = asyncHandler(async (req, res) => {
    if (!['Facilitator', 'Program Manager', 'Trainee', 'SuperAdmin'].includes(req.user.role)) { // Trainee can also download their course files
        throw new ApiError(403, 'Forbidden: Only authorized users can access this resource.');
    }
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, 'Course not found.');
    }
    if (!course.contentUrl) {
        throw new ApiError(404, 'No file found for this course.');
    }

    // If it's a Trainee, they should only download if the course is Approved AND their program is Active/Completed
    if (req.user.role === 'Trainee') {
        const program = await Program.findById(course.program);
        if (!program || (program.status !== 'Active' && program.status !== 'Completed')) { // Allow completed programs
            throw new ApiError(403, 'Forbidden: This course belongs to an inactive or non-completed program.');
        }
        if (course.status !== 'Approved') {
            throw new ApiError(403, 'Forbidden: This course is not approved for access.');
        }
    }
    
    const filePath = course.contentUrl;
    console.log('Download request - Course ID:', courseId);
    console.log('File path from database:', filePath);
    console.log('Course type from database:', course.type);
    
    // Construct the absolute path
    const absoluteFilePath = path.resolve('./public', filePath);
    
    if (!fs.existsSync(absoluteFilePath)) { // Use absolute path here
        console.log('File does not exist at absolute path:', absoluteFilePath);
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
        '.wav': 'audio/wav'
    };
    
    // Also define MIME types for type field values (without dots)
    const typeMimeTypes = {
        'pdf': 'application/pdf',
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'wmv': 'video/x-ms-wmv',
        'flv': 'video/x-flv',
        'webm': 'video/webm',
        'mkv': 'video/x-matroska',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'txt': 'text/plain',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav'
    };
    
    // Try to get content type from file extension first, then from course type
    let contentType = mimeTypes[fileExtension];
    if (!contentType && course.type) {
        contentType = typeMimeTypes[course.type.toLowerCase()];
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
        const fileStream = fs.createReadStream(absoluteFilePath);
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

    // Retrieve programs associated with the user, filtering by Active or Completed status
    const userPrograms = await Program.find({ 
        $or: [{ trainees: userId }, { facilitators: userId }],
        status: { $in: ['Active', 'Completed'] } // Include Completed programs
    }).select('_id status'); // Select status to filter courses later

    if (userPrograms.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "You are not enrolled in any active or completed programs."));
    }
    
    const programIds = userPrograms.map(p => p._id);

    const courseQuery = { program: { $in: programIds } };
    
    // For Trainee, only return Approved courses
    if (userRole === 'Trainee') {
        courseQuery.status = 'Approved';
    } 
    // For Facilitator, return all their courses within their programs
    else if (userRole === 'Facilitator') {
        courseQuery.facilitator = userId; 
    }

    const courses = await Course.find(courseQuery)
        .populate('program', 'name status') // Populate program status
        .populate('facilitator', 'name')
        .sort({ createdAt: -1 });
        
    // Send all for frontend to sort into tabs
    return res.status(200).json(new ApiResponse(200, courses, "Your courses fetched successfully."));
});


export const updateCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, description } = req.body;

    // Verify ownership and ensure the course's program is Active for modification
    const course = await Course.findById(courseId).populate('program');
    if (!course) throw new ApiError(404, "Course not found.");
    if (course.facilitator.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Forbidden: You do not have permission to modify this course.");
    }

    if (!course.program || course.program.status !== 'Active') {
        throw new ApiError(400, `Cannot update course. The program "${course.program?.name || 'unknown'}" is not active.`);
    }

    // Only allow update if course is Draft or Rejected. Do not edit Approved or PendingApproval.
    if (course.status === 'Approved' || course.status === 'PendingApproval') {
        throw new ApiError(400, `Cannot update a course with status '${course.status}'.`);
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;

    const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        {
            $set: updateFields,
            $unset: { rejectionReason: "" }, // Remove rejection reason if it was rejected
            status: 'Draft' // Always revert to Draft on edit/resubmission
        },
        { new: true, runValidators: true }
    ).populate('program', 'name');

    return res.status(200).json(new ApiResponse(200, updatedCourse, "Course updated successfully."));
});



export const deleteCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId).populate('program'); // Populate program for status check
    if (!course) {
        throw new ApiError(404, "Course not found.");
    }
    if (course.facilitator.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Forbidden: You do not have permission to delete this course.");
    }
    
    // NEW: Only allow deletion if the program is Active
    if (!course.program || course.program.status !== 'Active') {
        throw new ApiError(400, `Cannot delete course. The program "${course.program?.name || 'unknown'}" is not active.`);
    }

    // Only allow deletion if the course is Draft, Rejected, or PendingApproval
    // Do not allow deletion of Approved courses via this route (Admin can do it by changing status)
    if (course.status === 'Approved') {
        throw new ApiError(400, "Cannot delete an approved course directly.");
    }

    await course.deleteOne();

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
        .sort({ createdAt: -1 });
        
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
    
    // Get all trainees enrolled in this program
    const program = await Program.findById(course.program).populate('trainees', 'name email');
    const allTrainees = program.trainees || [];

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

        const submissionsWithAttendance = allTrainees.map(trainee => {
            const submission = assignmentSubmissions.find(sub => 
                sub.trainee._id.toString() === trainee._id.toString()
            );
            
            const traineeAttendance = attendanceData.find(att => 
                att.traineeId.toString() === trainee._id.toString()
            );

            if (submission) {
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
                    presentSessions: traineeAttendance ? traineeAttendance.presentSessions : 0,
                    hasSubmitted: true
                };
            } else {
                return {
                    submissionId: null,
                    traineeName: trainee.name,
                    traineeEmail: trainee.email,
                    submittedAt: null,
                    status: 'Not Submitted',
                    grade: 'Not graded',
                    feedback: '',
                    attendancePercentage: traineeAttendance ? 
                        Math.round(traineeAttendance.attendancePercentage) : 0,
                    totalSessions: traineeAttendance ? traineeAttendance.totalSessions : 0,
                    presentSessions: traineeAttendance ? traineeAttendance.presentSessions : 0,
                    hasSubmitted: false
                };
            }
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