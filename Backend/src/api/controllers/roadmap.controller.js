import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Roadmap } from '../models/roadmap.model.js';
import { Topic } from '../models/topic.model.js';
import { Program } from '../models/program.model.js';
import { Assignment } from '../models/assignment.model.js';
import { Submission } from '../models/submission.model.js';
import { Attendance } from '../models/attendance.model.js';
import { Course } from '../models/course.model.js';
import { createNotification } from '../../services/notification.service.js';

/**
 * @desc    Create a new weekly roadmap with its daily topics.
 * @route   POST /api/v1/roadmaps
 * @access  Private (Facilitator)
 */
export const createOrUpdateRoadmap = asyncHandler(async (req, res) => {
    const { program, course, weekNumber, title, startDate, objectives, topics, action } = req.body;
    const facilitatorId = req.user._id;

    console.log('createOrUpdateRoadmap called with:', { program, course, weekNumber, title, action });

    // Verify facilitator is assigned to this program
    const programDoc = await Program.findOne({ _id: program, facilitators: facilitatorId });
    if (!programDoc) {
        throw new ApiError(403, "You are not authorized to manage the roadmap for this program.");
    }
    
    // Determine the status based on the action
    let status = 'draft';
    if (action === 'submit_for_approval') {
        status = 'pending_approval';
    }
    
    console.log('Status will be:', status);
    
    // --- THIS IS THE UPSERT LOGIC ---
    // Try to find an existing roadmap for this program and week.
    // If it exists, update it. If not, create a new one.
    const roadmapData = {
        program,
        course,
        weekNumber: parseInt(weekNumber),
        title,
        startDate,
        objectives: objectives.split('\n').filter(o => o.trim() !== ''),
        facilitator: facilitatorId,
        status: status,
    };
    
    console.log('Looking for existing roadmap with:', { program, weekNumber: parseInt(weekNumber) });
    console.log('Roadmap data to set:', roadmapData);
    
    const roadmap = await Roadmap.findOneAndUpdate(
        { program: program, weekNumber: parseInt(weekNumber) }, // The unique key to find by
        { $set: roadmapData }, // The data to set on create or update
        { new: true, upsert: true, runValidators: true } // Options: return the new doc, create if not found
    );
    
    console.log('Roadmap result:', roadmap);
    // --- END OF UPSERT LOGIC ---


    // Now, handle the topics. First, delete any old topics for this roadmap.
    await Topic.deleteMany({ roadmap: roadmap._id });

    // Then, insert the new topics.
    if (topics && topics.length > 0) {
        const topicDocs = topics
            .filter(topic => topic.title && topic.title.trim() !== '') // Only insert topics with a title
            .map(topic => {
                // Calculate duration if startTime and endTime are provided
                let duration = topic.duration;
                if (topic.startTime && topic.endTime) {
                    const start = new Date(`2000-01-01T${topic.startTime}`);
                    const end = new Date(`2000-01-01T${topic.endTime}`);
                    const diffMs = end.getTime() - start.getTime();
                    const diffHours = diffMs / (1000 * 60 * 60);
                    
                    if (diffHours >= 0) {
                        const hours = Math.floor(diffHours);
                        const minutes = Math.round((diffHours - hours) * 60);
                        
                        if (minutes === 0) {
                            duration = `${hours} hour${hours !== 1 ? 's' : ''}`;
                        } else {
                            duration = `${hours}h ${minutes}m`;
                        }
                    }
                }
                
                return {
                    ...topic,
                    roadmap: roadmap._id,
                    duration: duration || '3 hours' // fallback
                };
            });
        
        if (topicDocs.length > 0) {
            await Topic.insertMany(topicDocs);
        }
    }

    const fullRoadmap = await getFullRoadmapById(roadmap._id);
    const message = action === 'submit_for_approval' 
        ? "Roadmap submitted for approval successfully." 
        : "Roadmap saved as draft successfully.";

         if (action === 'submit_for_approval' && programDoc.programManager) {
        await createNotification({
            recipient: programDoc.programManager._id,
            sender: facilitatorId, // The facilitator who submitted
            title: "Roadmap Submitted for Approval",
            message: `Facilitator ${req.user.name} submitted Week ${roadmap.weekNumber} roadmap for program "${programDoc.name}" for your approval.`,
            link: `/dashboard/Manager/course-management`, // Link to PM's course management, assuming roadmap approval is there
            type: 'approval'
        });
    }
    
    return res.status(201).json(new ApiResponse(201, fullRoadmap, message));
});


const getFullRoadmapById = async (roadmapId) => {
    const roadmap = await Roadmap.findById(roadmapId)
        .populate('program', 'name status') // FIX: Ensure program status is populated here
        .populate('course', 'title')
        .lean();
    if (!roadmap) return null;
    const topics = await Topic.find({ roadmap: roadmapId }).sort({ createdAt: 1 });
    return { ...roadmap, topics };
};

/**
 * @desc    Get roadmaps pending approval (for Program Manager)
 * @route   GET /api/v1/roadmaps/pending-approval
 * @access  Private (ProgramManager)
 */
export const getPendingApprovalRoadmaps = asyncHandler(async (req, res) => {
    const roadmaps = await Roadmap.find({ status: 'pending_approval' })
        .populate('program', 'name')
        .populate('course', 'title')
        .populate('facilitator', 'name email')
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, roadmaps, "Pending approval roadmaps fetched successfully."));
});

/**
 * @desc    Get all roadmaps for the logged-in facilitator, populated with topics.
 * @route   GET /api/v1/roadmaps/my-roadmaps
 * @access  Private (Facilitator)
 */
export const getMyRoadmaps = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;

    let programQuery = {};
    let roadmapQuery = {};

    if (userRole === 'Facilitator') {
        programQuery = { facilitators: userId };
    } else if (userRole === 'Trainee') {
        programQuery = { trainees: userId };
        roadmapQuery = { status: 'approved' };
    } else {
        return res.status(200).json(new ApiResponse(200, [], "No roadmaps applicable for your role via this endpoint."));
    }

    const userPrograms = await Program.find(programQuery).select('_id');
    if (userPrograms.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "You are not enrolled in any programs."));
    }
    const programIds = userPrograms.map(p => p._id);

    const roadmaps = await Roadmap.find({ 
        program: { $in: programIds },
        ...roadmapQuery // Apply the status filter for trainees
    })
    .populate('program', 'name')
    .populate('course', 'title')
    .populate('facilitator', 'name') // Ensure facilitator is populated
    .sort({ weekNumber: 1 }); // Sort by week number

    // Get full roadmap details including topics
    const populatedRoadmaps = await Promise.all(
        roadmaps.map(r => getFullRoadmapById(r._id))
    );

    return res.status(200).json(new ApiResponse(200, populatedRoadmaps, "Roadmaps fetched successfully."));
});


export const deleteRoadmap = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const roadmap = await Roadmap.findOne({ _id: id, facilitator: req.user._id });
    if (!roadmap) {
        throw new ApiError(404, "Roadmap not found or you lack permission.");
    }

    // Delete the roadmap and all its associated topics
    await Topic.deleteMany({ roadmap: id });
    await Roadmap.findByIdAndDelete(id);

    return res.status(200).json(new ApiResponse(200, {}, "Roadmap deleted successfully."));
});


export const getRoadmapAssignmentsWithMarks = asyncHandler(async (req, res) => {
    const { roadmapId } = req.params;
    
    console.log('🔍 getRoadmapAssignmentsWithMarks called with roadmapId:', roadmapId);
    
    // Find the roadmap and verify it exists
    const roadmap = await Roadmap.findById(roadmapId)
        .populate('program', 'name')
        .populate('facilitator', 'name email');
    
    if (!roadmap) {
        console.log('❌ Roadmap not found for ID:', roadmapId);
        throw new ApiError(404, "Roadmap not found");
    }
    
    console.log('✅ Found roadmap:', roadmap.title, 'Program:', roadmap.program?.name);

    // Get all assignments for this roadmap
    const assignments = await Assignment.find({ roadmap: roadmapId })
        .populate('facilitator', 'name email')
        .sort({ dueDate: -1 });
    
    console.log('📝 Found assignments:', assignments.length);
    assignments.forEach(assignment => {
        console.log(`   - ${assignment.title} (Due: ${assignment.dueDate})`);
    });

    // Get all submissions for assignments in this roadmap
    // Note: Current Submission model is for course submissions, not assignment submissions
    // TODO: Create AssignmentSubmission model or update Submission model to include assignment field
    const assignmentIds = assignments.map(assignment => assignment._id);
    // const submissions = await Submission.find({ assignment: { $in: assignmentIds } })
    //     .populate('trainee', 'name email')
    //     .sort({ submittedAt: -1 });
    
    // For now, we'll create empty submissions data since assignment submissions aren't implemented yet
    const submissions = [];
    
    console.log('📤 Found submissions:', submissions.length);

    // Get all trainees enrolled in this program
    const program = await Program.findById(roadmap.program._id).populate('trainees', 'name email');
    const allTrainees = program.trainees || [];
    
    console.log('👥 Found trainees in program:', allTrainees.length);
    allTrainees.forEach(trainee => {
        console.log(`   - ${trainee.name} (${trainee.email})`);
    });

    // Get attendance data for trainees in this roadmap's program
    console.log('📊 Fetching attendance data for program:', roadmap.program._id);
    const attendanceData = await Attendance.aggregate([
        {
            $match: {
                programId: roadmap.program._id
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
    
    console.log('📈 Found attendance data for', attendanceData.length, 'trainees');
    attendanceData.forEach(att => {
        console.log(`   - ${att.traineeName}: ${att.presentSessions}/${att.totalSessions} sessions (${att.attendancePercentage}%)`);
    });

    // Organize data by assignment
    const assignmentsWithMarks = assignments.map(assignment => {
        // Since assignment submissions aren't implemented yet, we'll create empty submission data
        const assignmentSubmissions = []; // submissions.filter(sub => 
        //     sub.assignment && sub.assignment._id.toString() === assignment._id.toString()
        // );

        // Create a complete list of all trainees with their submission status
        const allTraineesWithSubmissions = allTrainees.map(trainee => {

            const submission = assignmentSubmissions.find(sub => 
                sub.trainee && sub.trainee._id.toString() === trainee._id.toString() // Ensure submission.trainee is populated
            );

            
            const traineeAttendance = attendanceData.find(att => 
                att.traineeId.toString() === trainee._id.toString()
            );

            // For now, all trainees show as not submitted since assignment submissions aren't implemented
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
        });

        return {
            assignmentId: assignment._id,
            assignmentTitle: assignment.title,
            assignmentDescription: assignment.description,
            dueDate: assignment.dueDate,
            maxGrade: assignment.maxGrade,
            facilitatorName: assignment.facilitator.name,
            submissions: allTraineesWithSubmissions
        };
    });

    return res.status(200).json(new ApiResponse(200, {
        roadmap: {
            _id: roadmap._id,
            title: roadmap.title,
            weekNumber: roadmap.weekNumber,
            program: roadmap.program.name,
            facilitator: roadmap.facilitator.name,
            startDate: roadmap.startDate,
            objectives: roadmap.objectives
        },
        assignments: assignmentsWithMarks
    }, "Roadmap assignments with marks and attendance fetched successfully."));
});


export const getRoadmapsByCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    
    // Find the course and get its program
    const course = await Course.findById(courseId).populate('program', 'name');
    if (!course) {
        throw new ApiError(404, "Course not found.");
    }

    // Get all roadmaps for this course's program
    // Populate relevant fields and use .lean() for efficiency before manual topic population
    const roadmaps = await Roadmap.find({ program: course.program._id })
        .populate('facilitator', 'name email')
        .populate('course', 'title') // Populate course title for convenience
        .populate('program', 'name') // Populate program name for convenience
        .sort({ weekNumber: 1 })
        .lean();

    // Manually populate topics for each roadmap
    const populatedRoadmaps = await Promise.all(
        roadmaps.map(async (roadmap) => {
            const topics = await Topic.find({ roadmap: roadmap._id }).sort({ createdAt: 1 });
            return { ...roadmap, topics };
        })
    );

    return res.status(200).json(new ApiResponse(200, {
        course: {
            _id: course._id,
            title: course.title,
            program: course.program.name
        },
        roadmaps: populatedRoadmaps
    }, "Roadmaps for course fetched successfully."));
});

export const approveRoadmap = asyncHandler(async (req, res) => {
    const { roadmapId } = req.params;
    const programManagerId = req.user._id;
    
    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
        throw new ApiError(404, "Roadmap not found");
    }

    if (roadmap.status === 'approved') {
        throw new ApiError(400, "Roadmap is already approved");
    }

    roadmap.status = 'approved';
    roadmap.approvedBy = programManagerId;
    roadmap.approvedAt = new Date();
    await roadmap.save();

     if (roadmap.facilitator) {
        await createNotification({
            recipient: roadmap.facilitator._id,
            sender: req.user._id, // The Program Manager who approved
            title: "Roadmap Approved!",
            message: `Your roadmap for Week ${roadmap.weekNumber} of program "${roadmap.program.name}" has been approved.`,
            link: `/dashboard/Facilitator/fac-roadmap`, // Link to facilitator's roadmap page
            type: 'success'
        });
    }

    return res.status(200).json(new ApiResponse(200, roadmap, "Roadmap approved successfully."));
});

/**
 * @desc    Reject a roadmap (Program Manager)
 * @route   PATCH /api/v1/roadmaps/{roadmapId}/reject
 * @access  Private (ProgramManager)
 */
export const rejectRoadmap = asyncHandler(async (req, res) => {
    const { roadmapId } = req.params;
    const { feedback } = req.body;
    const programManagerId = req.user._id;
    
    console.log('rejectRoadmap called with:', { roadmapId, feedback, programManagerId });
    
    if (!feedback || feedback.trim() === '') {
        throw new ApiError(400, "Rejection feedback is required");
    }

    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
        throw new ApiError(404, "Roadmap not found");
    }

    console.log('Found roadmap before rejection:', { id: roadmap._id, status: roadmap.status, title: roadmap.title });

    if (roadmap.status === 'rejected') {
        throw new ApiError(400, "Roadmap is already rejected");
    }

    roadmap.status = 'rejected';
    roadmap.feedback = feedback;
    roadmap.approvedBy = programManagerId;
    roadmap.approvedAt = new Date();
    await roadmap.save();

    console.log('Roadmap rejected successfully:', { id: roadmap._id, status: roadmap.status, title: roadmap.title });

    if (roadmap.facilitator) {
        await createNotification({
            recipient: roadmap.facilitator._id,
            sender: req.user._id, // The Program Manager who rejected
            title: "Roadmap Rejected",
            message: `Your roadmap for Week ${roadmap.weekNumber} of program "${roadmap.program.name}" was rejected. Feedback: "${feedback}".`,
            link: `/dashboard/Facilitator/fac-roadmap`,
            type: 'error'
        });
    }

    return res.status(200).json(new ApiResponse(200, roadmap, "Roadmap rejected successfully."));
});

/**
 * @desc    Get all roadmaps (for Program Manager)
 * @route   GET /api/v1/roadmaps
 * @access  Private (ProgramManager)
 */
export const getAllRoadmaps = asyncHandler(async (req, res) => {
    console.log('getAllRoadmaps called by user:', req.user._id);
    
    const roadmaps = await Roadmap.find()
        .populate('program', 'name')
        .populate('course', 'title')
        .populate('facilitator', 'name email')
        .sort({ createdAt: -1 });

    console.log('Found roadmaps:', roadmaps.length);
    console.log('Roadmap statuses:', roadmaps.map(r => ({ id: r._id, status: r.status, title: r.title })));

    return res.status(200).json(new ApiResponse(200, roadmaps, "All roadmaps fetched successfully."));
});