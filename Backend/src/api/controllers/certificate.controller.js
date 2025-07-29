import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Certificate } from '../models/certificate.model.js';
import { Program } from '../models/program.model.js';
import { User } from '../models/user.model.js';
import { Submission } from '../models/submission.model.js';
import { Attendance } from '../models/attendance.model.js';
import { CertificateTemplate } from '../models/certificateTemplate.model.js';
import { sendCertificateIssuedEmail } from '../../services/email.service.js';
import { createNotification } from '../../services/notification.service.js';



const getEligibleStudents = asyncHandler(async (req, res) => {
    const managerId = req.user._id;
    const userRole = req.user.role;

    let programMatchConditions = {
        status: 'Completed' // Only consider students from completed programs
    };

    // If Program Manager, filter by programs they manage
    if (userRole === 'Program Manager') {
        programMatchConditions.programManager = managerId;
    }

    // --- AGGREGATION DEBUGGING START ---
    // We will build the pipeline step-by-step and return early for inspection

    let pipeline = [
        // 1. Match active Trainees
        {
            $match: {
                role: 'Trainee',
                isActive: true
            }
        },
        // 2. Lookup programs they are enrolled in
        {
            $lookup: {
                from: 'programs',
                localField: '_id',
                foreignField: 'trainees',
                as: 'enrolledPrograms'
            }
        },
        // 3. Unwind programs to process each program enrollment separately
        {
            $unwind: '$enrolledPrograms'
        },
        // 4. Filter programs by status and manager (if Program Manager)
        {
            $match: {
                ...programMatchConditions
            }
        }
        // STOP 1: Return results here to see which trainees and their programs survive the initial filters
        // { $limit: 10 } // Optional: limit to first few results
        // { $project: { name: 1, email: 1, 'enrolledPrograms.name': 1, 'enrolledPrograms.status': 1, 'enrolledPrograms.programManager': 1 } }
        // { $addFields: { debugStage1: true } } // Mark this stage
    ];

    // EXECUTE STAGE 1 (Optional: If you want to see results after step 4)
    // const stage1Results = await User.aggregate(pipeline).exec();
    // console.log("DEBUG: Stage 1 Results (Trainees in relevant programs):", stage1Results.length, stage1Results.map(t => ({name: t.name, program: t.enrolledPrograms.name, status: t.enrolledPrograms.status})));
    // return res.status(200).json(new ApiResponse(200, stage1Results, "DEBUG: Stage 1 results fetched."));


    pipeline.push(
        // 5. Lookup submissions for the trainee in this program
        {
            $lookup: {
                from: 'submissions',
                let: { traineeId: '$_id', programId: '$enrolledPrograms._id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$trainee', '$$traineeId'] },
                                    { $eq: ['$program', '$$programId'] },
                                    { $eq: ['$status', 'Reviewed'] }, // Only count reviewed submissions
                                    // Make sure your grades are actually stored as numbers or can be parsed
                                    { $ne: ['$grade', null] },
                                    { $ne: ['$grade', ''] }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            // Attempt to convert grade to a number, default to 0 if conversion fails
                            grade: { $convert: { input: '$grade', to: 'double', onError: 0, onNull: 0 } } 
                        }
                    }
                ],
                as: 'submissions'
            }
        }
        // STOP 2: Return results here to see how many submissions are found per trainee/program
        // { $addFields: { debugStage2: true } }
        // { $project: { name: 1, email: 1, 'enrolledPrograms.name': 1, submissions: 1 } }
    );

    // EXECUTE STAGE 2 (Optional: If you want to see results after step 5)
    // const stage2Results = await User.aggregate(pipeline).exec();
    // console.log("DEBUG: Stage 2 Results (Submissions found):", stage2Results.length, stage2Results.map(t => ({name: t.name, program: t.enrolledPrograms.name, submissionsCount: t.submissions.length, sampleGrade: t.submissions.length > 0 ? t.submissions[0].grade : 'N/A'})));
    // return res.status(200).json(new ApiResponse(200, stage2Results, "DEBUG: Stage 2 results fetched."));


    pipeline.push(
        // 6. Lookup attendance records for the trainee in this program
        {
            $lookup: {
                from: 'attendances',
                let: { traineeId: '$_id', programId: '$enrolledPrograms._id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$userId', '$$traineeId'] },
                                    { $eq: ['$programId', '$$programId'] }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            status: '$status'
                        }
                    }
                ],
                as: 'attendances'
            }
        }
        // STOP 3: Return results here to see how many attendance records are found
        // { $addFields: { debugStage3: true } }
        // { $project: { name: 1, email: 1, 'enrolledPrograms.name': 1, attendances: 1 } }
    );

    // EXECUTE STAGE 3 (Optional: If you want to see results after step 6)
    // const stage3Results = await User.aggregate(pipeline).exec();
    // console.log("DEBUG: Stage 3 Results (Attendances found):", stage3Results.length, stage3Results.map(t => ({name: t.name, program: t.enrolledPrograms.name, attendancesCount: t.attendances.length, sampleStatus: t.attendances.length > 0 ? t.attendances[0].status : 'N/A'})));
    // return res.status(200).json(new ApiResponse(200, stage3Results, "DEBUG: Stage 3 results fetched."));


    pipeline.push(
        // 7. Calculate average grade and attendance rate
        {
            $addFields: {
                totalSubmissions: { $size: '$submissions' },
                sumGrades: { $sum: '$submissions.grade' },
                totalAttendanceRecords: { $size: '$attendances' },
                presentAttendanceRecords: {
                    $size: {
                        $filter: {
                            input: '$attendances',
                            as: 'att',
                            cond: { $in: ['$$att.status', ['Present', 'Late']] }
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                finalScore: {
                    $cond: [
                        { $gt: ['$totalSubmissions', 0] },
                        { $divide: ['$sumGrades', '$totalSubmissions'] },
                        0
                    ]
                },
                attendanceRate: {
                    $cond: [
                        { $gt: ['$totalAttendanceRecords', 0] },
                        { $multiply: [{ $divide: ['$presentAttendanceRecords', '$totalAttendanceRecords'] }, 100] },
                        0
                    ]
                }
            }
        },
        // STOP 4: Return results here to see calculated scores and rates before final filter
        // { $addFields: { debugStage4: true } }
        // { $project: { name: 1, email: 1, 'enrolledPrograms.name': 1, finalScore: 1, attendanceRate: 1, totalSubmissions: 1, totalAttendanceRecords: 1, presentAttendanceRecords: 1 } }
    );

    // EXECUTE STAGE 4 (Optional: If you want to see results after step 7)
    // const stage4Results = await User.aggregate(pipeline).exec();
    // console.log("DEBUG: Stage 4 Results (Calculated Scores/Rates):", stage4Results.length, stage4Results.map(t => ({name: t.name, program: t.enrolledPrograms.name, finalScore: t.finalScore, attendanceRate: t.attendanceRate, subs: t.totalSubmissions, att: t.totalAttendanceRecords, presentAtt: t.presentAttendanceRecords})));
    // return res.status(200).json(new ApiResponse(200, stage4Results, "DEBUG: Stage 4 results fetched."));


    pipeline.push(
        // 8. Final Filter based on eligibility criteria
        {
            $match: {
                finalScore: { $gte: 80 },
                attendanceRate: { $gte: 85 }
            }
        },
        // 9. Project the final fields required by the frontend
        {
            $project: {
                _id: '$_id',
                name: '$name',
                email: '$email',
                program: '$enrolledPrograms.name', // Return program name directly
                programId: '$enrolledPrograms._id', // Return program ID for certificate issuance
                finalScore: { $round: ['$finalScore', 0] },
                attendanceRate: { $round: ['$attendanceRate', 0] },
                completionDate: '$enrolledPrograms.endDate', // Use program end date as completion date
                isEligible: true
            }
        }
    );

    // EXECUTE FINAL STAGE
    const finalResults = await User.aggregate(pipeline).exec();
    console.log("DEBUG: Final Eligible Students Results:", finalResults.length, finalResults.map(t => ({name: t.name, program: t.program, finalScore: t.finalScore, attendanceRate: t.attendanceRate})));
    // --- AGGREGATION DEBUGGING END ---

    return res.status(200).json(new ApiResponse(200, finalResults, "Eligible students fetched."));
});


// ... (rest of the controller functions: getCertificateTemplates, createCertificateTemplate, updateCertificateTemplate, deleteCertificateTemplate - keep them as they are) ...
/**
 * @desc    Issue a new certificate.
 * @route   POST /api/v1/certificates/issue
 * @access  Private (Program Manager, SuperAdmin)
 */
const issueCertificate = asyncHandler(async (req, res) => {
    const { programId, traineeId } = req.body;
    const managerId = req.user._id;

    if (!programId || !traineeId) {
        throw new ApiError(400, "Program ID and Trainee ID are required.");
    }

    // Verify Program Manager owns the program OR is SuperAdmin
    const program = await Program.findById(programId);
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }
    if (req.user.role === 'Program Manager' && program.programManager?.toString() !== managerId.toString()) {
        throw new ApiError(403, "Forbidden: You are not the manager of this program.");
    }

    // Verify trainee is part of this program
    const isTraineeEnrolled = program.trainees.some(t => t.toString() === traineeId);
    if (!isTraineeEnrolled) {
        throw new ApiError(400, "Trainee is not enrolled in this program.");
    }

    // Check if certificate already exists for this trainee and program
    const existingCert = await Certificate.findOne({ program: programId, trainee: traineeId });
    if (existingCert) {
        throw new ApiError(409, "A certificate has already been issued to this trainee for this program.");
    }

    const certificate = await Certificate.create({
        program: programId,
        trainee: traineeId,
        issueDate: new Date(),
    });

    // Fetch trainee details for email and notification
    const trainee = await User.findById(traineeId).select('name email');

    if (trainee) {
        // Send email notification
        sendCertificateIssuedEmail(trainee.email, trainee.name, program.name)
            .catch(err => console.error('Failed to send certificate issuance email:', err));

        // Send in-app notification
        createNotification({
            recipient: trainee._id,
            sender: req.user._id,
            title: "Certificate Issued!",
            message: `Congratulations! Your certificate for "${program.name}" has been issued.`,
            link: `/dashboard/Trainee/my-certificates`, // Link to their certificates page
            type: 'success'
        }).catch(err => console.error('Failed to send certificate issuance notification:', err));
    }


    return res.status(201).json(new ApiResponse(201, certificate, "Certificate issued successfully."));
});

/**
 * @desc    Get all certificates.
 * @route   GET /api/v1/certificates
 * @access  Private (Program Manager, SuperAdmin)
 */
const getAllCertificates = asyncHandler(async (req, res) => {
    let query = {};

    // Program Managers only see certificates for programs they manage
    if (req.user.role === 'Program Manager') {
        const managedPrograms = await Program.find({ programManager: req.user._id }).select('_id');
        const programIds = managedPrograms.map(p => p._id);
        query.program = { $in: programIds };
    }

    const certificates = await Certificate.find(query)
        .populate('trainee', 'name email')
        .populate('program', 'name'); 

    return res.status(200).json(new ApiResponse(200, certificates, "All certificates fetched successfully."));
});

/**
 * @desc    Get certificates for the logged-in trainee.
 * @route   GET /api/v1/certificates/me
 * @access  Private (Trainee)
 */
const getMyCertificates = asyncHandler(async (req, res) => {
    const certificates = await Certificate.find({ trainee: req.user._id })
        .populate('program', 'name');

    return res.status(200).json(new ApiResponse(200, certificates, "Your certificates fetched successfully."));
});

/**
 * @desc    Get eligible students for certificate issuance.
 * @route   GET /api/v1/certificates/eligible-students
 * @access  Private (Program Manager, SuperAdmin)
 */

/**
 * @desc    Get all certificate templates.
 * @route   GET /api/v1/certificates/templates
 * @access  Private (Program Manager, SuperAdmin)
 */
const getCertificateTemplates = asyncHandler(async (req, res) => {
    const templates = await CertificateTemplate.find().populate('createdBy', 'name email');
    return res.status(200).json(new ApiResponse(200, templates, "Templates fetched successfully."));
});

/**
 * @desc    Create a new certificate template.
 * @route   POST /api/v1/certificates/templates
 * @access  Private (Program Manager, SuperAdmin)
 */
const createCertificateTemplate = asyncHandler(async (req, res) => {
    const { name, description, style, colorScheme, isDefault, htmlContent } = req.body;

    if (!name || !style || !colorScheme) {
        throw new ApiError(400, "Name, style, and color scheme are required for a template.");
    }

    const existingTemplate = await CertificateTemplate.findOne({ name });
    if (existingTemplate) {
        throw new ApiError(409, "Template with this name already exists.");
    }

    const template = await CertificateTemplate.create({
        name,
        description,
        style,
        colorScheme,
        isDefault: isDefault || false,
        htmlContent,
        createdBy: req.user._id
    });

    return res.status(201).json(new ApiResponse(201, template, "Certificate template created successfully."));
});

/**
 * @desc    Update a certificate template.
 * @route   PATCH /api/v1/certificates/templates/:id
 * @access  Private (Program Manager, SuperAdmin)
 */
const updateCertificateTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, style, colorScheme, isDefault, htmlContent } = req.body;

    const template = await CertificateTemplate.findById(id);
    if (!template) {
        throw new ApiError(404, "Certificate template not found.");
    }

    // Only allow changing name if it's not taken by another template
    if (name && name !== template.name) {
        const existing = await CertificateTemplate.findOne({ name });
        if (existing && existing._id.toString() !== id) {
            throw new ApiError(409, "Template with this name already exists.");
        }
        template.name = name;
    }

    template.description = description ?? template.description;
    template.style = style ?? template.style;
    template.colorScheme = colorScheme ?? template.colorScheme;
    template.htmlContent = htmlContent ?? template.htmlContent;
    
    // Check if isDefault is explicitly provided, if not, retain current value
    if (isDefault !== undefined) {
        template.isDefault = isDefault;
    }

    await template.save(); // The pre-save hook handles isDefault uniqueness

    return res.status(200).json(new ApiResponse(200, template, "Certificate template updated successfully."));
});

/**
 * @desc    Delete a certificate template.
 * @route   DELETE /api/v1/certificates/templates/:id
 * @access  Private (Program Manager, SuperAdmin)
 */
const deleteCertificateTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const template = await CertificateTemplate.findById(id);
    if (!template) {
        throw new ApiError(404, "Certificate template not found.");
    }
    if (template.isDefault) {
        throw new ApiError(400, "Cannot delete a default template. Please set another template as default first.");
    }

    await template.deleteOne();

    return res.status(200).json(new ApiResponse(200, {}, "Certificate template deleted successfully."));
});


export {
    issueCertificate,
    getAllCertificates,
    getMyCertificates,
    getEligibleStudents,
    getCertificateTemplates,
    createCertificateTemplate,
    updateCertificateTemplate,
    deleteCertificateTemplate
};