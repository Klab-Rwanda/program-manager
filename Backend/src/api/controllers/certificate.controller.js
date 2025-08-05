import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Certificate } from '../models/certificate.model.js';
import { Program } from '../models/program.model.js';
import { User } from '../models/user.model.js';
import { Submission } from '../models/submission.model.js';
import { Attendance } from '../models/attendance.model.js';
import { CertificateTemplate } from '../models/certificateTemplate.model.js';
import { createNotification } from '../../services/notification.service.js';
import { generateCertificatePDF } from '../../services/pdf.service.js';

const MIN_FINAL_SCORE = 80;
const MIN_ATTENDANCE_RATE = 85;


// const issueCertificate = asyncHandler(async (req, res) => {
//     const { programId, traineeId } = req.body;
//     const managerId = req.user._id;

//     if (!programId || !traineeId) {
//         throw new ApiError(400, "Program ID and Trainee ID are required.");
//     }

//     // Verify Program Manager owns the program OR is SuperAdmin
//     const program = await Program.findById(programId);
//     if (!program) {
//         throw new ApiError(404, "Program not found.");
//     }
//     if (req.user.role === 'Program Manager' && program.programManager?.toString() !== managerId.toString()) {
//         throw new ApiError(403, "Forbidden: You are not the manager of this program.");
//     }

//     // Verify trainee is part of this program
//     const isTraineeEnrolled = program.trainees.some(t => t.toString() === traineeId);
//     if (!isTraineeEnrolled) {
//         throw new ApiError(400, "Trainee is not enrolled in this program.");
//     }

//     // Check if certificate already exists for this trainee and program
//     const existingCert = await Certificate.findOne({ program: programId, trainee: traineeId });
//     if (existingCert) {
//         throw new ApiError(409, "A certificate has already been issued to this trainee for this program.");
//     }

//     const certificate = await Certificate.create({
//         program: programId,
//         trainee: traineeId,
//         issueDate: new Date(),
//     });

//     try {
//         const issuedTrainee = await User.findById(traineeId).select('name email'); // Get trainee name/email for notification
//         if (issuedTrainee) {
//             await createNotification({
//                 recipient: issuedTrainee._id,
//                 sender: req.user._id, // The Program Manager or SuperAdmin who issued it
//                 title: "Congratulations! You've Earned a Certificate!",
//                 message: `You have successfully completed the "${program.name}" program and earned a certificate! View it now.`,
//                 link: `/dashboard/Trainee/my-certificates`, // Assuming this page exists or will exist
//                 type: 'success'
//             });
//             console.log(`Notification sent to trainee ${issuedTrainee.name} for certificate in program ${program.name}.`);
//         }
//     } catch (notificationError) {
//         console.error('Error sending certificate issuance notification:', notificationError);
//         // Don't throw this error, certificate creation should succeed even if notification fails.
//     }
//     return res.status(201).json(new ApiResponse(201, certificate, "Certificate issued successfully."));
// });


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


const getMyCertificates = asyncHandler(async (req, res) => {
    const certificates = await Certificate.find({ trainee: req.user._id })
        .populate('program', 'name'); // This looks fine.

    return res.status(200).json(new ApiResponse(200, certificates, "Your certificates fetched successfully."));
});


const getStudentsEligibility = asyncHandler(async (req, res) => {
    const managerId = req.user._id;
    const userRole = req.user.role;

    let programMatchCondition = {};

    // If Program Manager, filter by programs they manage
    if (userRole === 'Program Manager') {
        programMatchCondition.programManager = managerId;
    }

    const studentsWithEligibility = await User.aggregate([
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
        // 3. Filter only programs that are Completed and (if PM) managed by the current manager
        {
            $addFields: {
                // Filter enrolledPrograms to only include 'Completed' ones (and potentially managed ones for PM)
                filteredPrograms: {
                    $filter: {
                        input: '$enrolledPrograms',
                        as: 'program',
                        cond: {
                            $and: [
                                { $eq: ['$$program.status', 'Completed'] },
                                ...(userRole === 'Program Manager' ? [{ $eq: ['$$program.programManager', managerId] }] : [])
                            ]
                        }
                    }
                }
            }
        },
        // 4. Unwind only the filtered programs (this ensures we only process trainees in relevant completed programs)
        {
            $unwind: '$filteredPrograms'
        },
        // 5. Lookup submissions for the trainee within this specific (filtered) program
        {
            $lookup: {
                from: 'submissions',
                let: { traineeId: '$_id', programId: '$filteredPrograms._id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$trainee', '$$traineeId'] },
                                    { $eq: ['$program', '$$programId'] },
                                    { $eq: ['$status', 'Reviewed'] }, // Only count reviewed submissions for grade calculation
                                    { $ne: ['$grade', null] },
                                    { $ne: ['$grade', ''] }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            grade: { $convert: { input: '$grade', to: 'double', onError: null, onNull: 0 } } // Convert grade to number
                        }
                    },
                    {
                        $match: {
                            grade: { $ne: null } // Filter out submissions where grade conversion failed
                        }
                    }
                ],
                as: 'submissions'
            }
        },
        // 6. Lookup attendance records for the trainee within this specific (filtered) program
        {
            $lookup: {
                from: 'attendances',
                let: { traineeId: '$_id', programId: '$filteredPrograms._id' },
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
        },
        // 7. Group by trainee and program to consolidate their records within that program
        {
            $group: {
                _id: {
                    traineeId: '$_id',
                    programId: '$filteredPrograms._id'
                },
                name: { $first: '$name' },
                email: { $first: '$email' },
                program: { $first: '$filteredPrograms.name' },
                programEndDate: { $first: '$filteredPrograms.endDate' },
                submissions: { $push: '$submissions' }, // Push all submission arrays
                attendances: { $push: '$attendances' } // Push all attendance arrays
            }
        },
        // 8. Unwind submissions and attendances to flatten them for counting
        {
            $addFields: {
                flattenedSubmissions: { $reduce: { input: '$submissions', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } },
                flattenedAttendances: { $reduce: { input: '$attendances', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } }
            }
        },
        // 9. Calculate average grade and attendance rate
        {
            $addFields: {
                totalValidSubmissions: { $size: '$flattenedSubmissions' },
                sumGrades: { $sum: '$flattenedSubmissions.grade' },
                totalAttendanceRecords: { $size: '$flattenedAttendances' },
                presentAttendanceRecords: {
                    $size: {
                        $filter: {
                            input: '$flattenedAttendances',
                            as: 'att',
                            cond: { $in: ['$$att.status', ['Present', 'Late']] }
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                calculatedFinalScore: {
                    $cond: [
                        { $gt: ['$totalValidSubmissions', 0] },
                        { $divide: ['$sumGrades', '$totalValidSubmissions'] },
                        0
                    ]
                },
                calculatedAttendanceRate: {
                    $cond: [
                        { $gt: ['$totalAttendanceRecords', 0] },
                        { $multiply: [{ $divide: ['$presentAttendanceRecords', '$totalAttendanceRecords'] }, 100] },
                        0
                    ]
                }
            }
        },
        // 10. Determine eligibility and reason
        {
            $addFields: {
                isEligible: {
                    $and: [
                        { $gte: ['$calculatedFinalScore', MIN_FINAL_SCORE] },
                        { $gte: ['$calculatedAttendanceRate', MIN_ATTENDANCE_RATE] }
                    ]
                },
                eligibilityReason: {
                    $cond: {
                        if: { $gte: ['$calculatedFinalScore', MIN_FINAL_SCORE] },
                        then: {
                            $cond: {
                                if: { $gte: ['$calculatedAttendanceRate', MIN_ATTENDANCE_RATE] },
                                then: 'Eligible',
                                else: 'Attendance too low'
                            }
                        },
                        else: {
                            $cond: {
                                if: { $gte: ['$calculatedAttendanceRate', MIN_ATTENDANCE_RATE] },
                                then: 'Final score too low',
                                else: 'Score and attendance too low'
                            }
                        }
                    }
                }
            }
        },
        // 11. Project the final fields
        {
            $project: {
                _id: '$_id.traineeId', // Group back by trainee ID
                name: '$name',
                email: '$email',
                program: '$program',
                programId: '$_id.programId', // Include programId for issuing certificate
                finalScore: { $round: ['$calculatedFinalScore', 0] },
                attendanceRate: { $round: ['$calculatedAttendanceRate', 0] },
                completionDate: '$programEndDate',
                isEligible: '$isEligible',
                eligibilityReason: '$eligibilityReason'
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, studentsWithEligibility, "Students eligibility fetched."));
});



const getCertificateTemplates = asyncHandler(async (req, res) => {
    const templates = await CertificateTemplate.find().populate('createdBy', 'name email');
    return res.status(200).json(new ApiResponse(200, templates, "Templates fetched successfully."));
});


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
    template.isDefault = isDefault ?? template.isDefault; // Handled by pre-save/pre-findOneAndUpdate hook

    await template.save();

    return res.status(200).json(new ApiResponse(200, template, "Certificate template updated successfully."));
});


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


const downloadCertificate = asyncHandler(async (req, res) => {
    const { id } = req.params; // This is the certificate _id
    const userId = req.user._id;
    const userRole = req.user.role;

    const certificate = await Certificate.findById(id)
        .populate('trainee', 'name email')
        .populate({
            path: 'program',
            select: 'name programManager', // Select programManager for Program model
            populate: {
                path: 'programManager', // Populate the programManager field (User model)
                select: 'name'
            }
        })
        .lean(); // Use .lean() for performance when not modifying

    if (!certificate) {
        throw new ApiError(404, "Certificate not found.");
    }

    // --- Authorization Check ---
    let authorized = false;
    // 1. SuperAdmin can download any certificate
    if (userRole === 'SuperAdmin') {
        authorized = true;
    } 
    // 2. Trainee can download their own certificate
    else if (userRole === 'Trainee' && certificate.trainee._id.toString() === userId.toString()) {
        authorized = true;
    }
    // 3. Program Manager can download certificates for programs they manage
    else if (userRole === 'Program Manager' && certificate.program.programManager?._id.toString() === userId.toString()) { // Check programManager's ID
        authorized = true;
    }

    if (!authorized) {
        throw new ApiError(403, "Forbidden: You do not have permission to download this certificate.");
    }

    // Fetch the default template (or the one associated with the certificate, if stored)
    const template = await CertificateTemplate.findOne({ isDefault: true }) || await CertificateTemplate.findOne({}); // Get any template if no default

    if (!template) {
        throw new ApiError(404, "No certificate template found to render the certificate.");
    }

    // Fetch one SuperAdmin's name to act as "General Manager"
    const superAdmin = await User.findOne({ role: 'SuperAdmin', isActive: true }).select('name');
    const superAdminName = superAdmin ? superAdmin.name : 'Not Available';

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.trainee.name.replace(/\s/g, '_')}-${certificate.program.name.replace(/\s/g, '_')}.pdf"`);

    // Pass additional signature names to the PDF generation function
    generateCertificatePDF(
        certificate, 
        { ...template.toObject(), superAdminName }, // Pass superAdminName through templateData
        res
    );
});



const sendCertificateIssuanceNotification = async (certificate, issuerUser) => {
    const program = typeof certificate.program === 'object' ? certificate.program : await Program.findById(certificate.program).select('name');
    const trainee = typeof certificate.trainee === 'object' ? certificate.trainee : await User.findById(certificate.trainee).select('name email');

    if (!program || !trainee) {
        console.error(`Failed to send certificate notification: Program or Trainee not found for certificate ${certificate._id}`);
        return false;
    }

    try {
        const downloadLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/v1/certificates/${certificate._id}/download`; // Link for student to download

        await createNotification({
            recipient: trainee._id,
            sender: issuerUser._id, // The user triggering the notification (PM/SA)
            title: "Congratulations! You've Earned a Certificate!",
            message: `You have successfully completed the "${program.name}" program and earned a certificate! Click here to download it.`,
            link: downloadLink, // Direct link to download
            type: 'success'
        });

        // Optionally send email as well (using a new email service function if desired)
        // await sendCertificateIssuedEmail(trainee.email, trainee.name, program.name, downloadLink);

        console.log(`Notification sent to trainee ${trainee.name} for certificate in program ${program.name}.`);
        return true;
    } catch (notificationError) {
        console.error('Error sending certificate issuance notification:', notificationError);
        return false;
    }
};

const issueCertificate = asyncHandler(async (req, res) => {
    const { programId, traineeId } = req.body;
    const managerId = req.user._id;

    if (!programId || !traineeId) {
        throw new ApiError(400, "Program ID and Trainee ID are required.");
    }

    const program = await Program.findById(programId);
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }
    if (req.user.role === 'Program Manager' && program.programManager?.toString() !== managerId.toString()) {
        throw new ApiError(403, "Forbidden: You are not the manager of this program.");
    }

    const isTraineeEnrolled = program.trainees.some(t => t.toString() === traineeId);
    if (!isTraineeEnrolled) {
        throw new ApiError(400, "Trainee is not enrolled in this program.");
    }

    const existingCert = await Certificate.findOne({ program: programId, trainee: traineeId });
    if (existingCert) {
        throw new ApiError(409, "A certificate has already been issued to this trainee for this program.");
    }

    const certificate = await Certificate.create({
        program: programId,
        trainee: traineeId,
        issueDate: new Date(),
    });

    // Use the new helper function for notification
    await sendCertificateIssuanceNotification(certificate, req.user);

    return res.status(201).json(new ApiResponse(201, certificate, "Certificate issued successfully."));
});


const resendCertificateNotification = asyncHandler(async (req, res) => {
    const { id } = req.params; // Certificate _id
    const userId = req.user._id;
    const userRole = req.user.role;

    const certificate = await Certificate.findById(id)
        .populate('trainee', 'name email')
        .populate('program', 'name programManager') // Need programManager for auth
        .lean();

    if (!certificate) {
        throw new ApiError(404, "Certificate not found.");
    }

    // Authorization check (same as downloadCertificate)
    let authorized = false;
    if (userRole === 'SuperAdmin') {
        authorized = true;
    } else if (userRole === 'Program Manager' && certificate.program.programManager?.toString() === userId.toString()) {
        authorized = true;
    }

    if (!authorized) {
        throw new ApiError(403, "Forbidden: You do not have permission to resend notification for this certificate.");
    }

    const notificationSent = await sendCertificateIssuanceNotification(certificate, req.user);

    if (notificationSent) {
        return res.status(200).json(new ApiResponse(200, { success: true }, "Certificate notification resent successfully."));
    } else {
        throw new ApiError(500, "Failed to resend certificate notification.");
    }
});


export {
    issueCertificate,
    getAllCertificates,
    getMyCertificates,
    getStudentsEligibility, // Renamed from getEligibleStudents
    getCertificateTemplates,
    createCertificateTemplate,
    updateCertificateTemplate,
    deleteCertificateTemplate,
    downloadCertificate,
    resendCertificateNotification
};