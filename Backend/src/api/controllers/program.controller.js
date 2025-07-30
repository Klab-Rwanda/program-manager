// src/api/controllers/program.controller.js
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Program } from '../models/program.model.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { createLog } from '../../services/log.service.js';
import { Course } from '../models/course.model.js';
import { Attendance } from '../models/attendance.model.js';
import { Submission } from '../models/submission.model.js';
import { createNotification } from '../../services/notification.service.js';

// --- HELPER FUNCTION ---
const verifyManagerAccess = async (programId, managerId) => {
    // Use findById with a condition to bypass the pre-find middleware for permission checks
    const program = await Program.findById(programId).where({ isActive: { $ne: false } });
    if (!program) throw new ApiError(404, "Program not found.");
    
    const isManager = program.programManager && program.programManager.toString() === managerId.toString();
    
    if (!isManager && managerId.toString() !== 'SuperAdmin') { // SuperAdmin always has access
        throw new ApiError(403, "Forbidden: You are not a manager of this program.");
    }
    return program;
};

// --- CONTROLLER FUNCTIONS ---

const createProgram = asyncHandler(async (req, res) => {
    const { name, description, startDate, endDate } = req.body;
    const creator = req.user;

    let programStatus = 'Draft';
    let managers = [];

    if (creator.role === 'SuperAdmin') {
        programStatus = 'PendingApproval';
    } else if (creator.role === 'Program Manager') {
        managers.push(creator._id);
    }

    // Step 1: Create the program document
    const programDoc = await Program.create({
        name,
        description,
        startDate,
        endDate,
        programManager: managers.length > 0 ? managers[0] : null,
        status: programStatus,
    });

    // --- THIS IS THE FIX ---
    // Step 2: Fetch the newly created program again, but this time populate the manager details.
    const populatedProgram = await Program.findById(programDoc._id).populate('programManager', 'name email');
    // --- END OF FIX ---

    const message = creator.role === 'SuperAdmin' 
        ? "Program created and is now pending your approval." 
        : "Program created in Draft state.";

   
         if (creator.role === 'Program Manager') {
        const superAdmins = await User.find({ role: 'SuperAdmin' }).select('_id name');
        for (const admin of superAdmins) {
            await createNotification({
                recipient: admin._id,
                sender: creator._id,
                title: "New Program Drafted",
                message: `Program Manager ${creator.name} created program "${populatedProgram.name}" as a draft.`,
                link: `/dashboard/Manager/programs`, // Link to PM's program list
                type: 'info'
            });
        }
    }
    return res.status(201).json(new ApiResponse(201, populatedProgram, message));
});

const requestApproval = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await verifyManagerAccess(id, req.user._id);
    const program = await Program.findByIdAndUpdate(id, { status: 'PendingApproval' }, { new: true });
     await createLog({
        user: req.user._id,
        action: 'PROGRAM_SUBMITTED_FOR_APPROVAL',
        details: `PM ${req.user.name} submitted program '${program.name}' for approval.`,
        entity: { id: program._id, model: 'Program' }
    });
     const superAdmins = await User.find({ role: 'SuperAdmin' });
    
    // 2. Create a notification for each SuperAdmin
    for (const admin of superAdmins) {
        await createNotification({
            recipient: admin._id,
            sender: req.user._id,
            title: "New Program for Approval",
            message: `Program Manager ${req.user.name} has submitted the program "${program.name}" for your approval.`,
            link: `/dashboard/SuperAdmin/program-approval/${program._id}`
        });
    }
    return res.status(200).json(new ApiResponse(200, program, "Program submitted for approval."));
});

const approveProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const program = await Program.findByIdAndUpdate(id, { status: 'Active', rejectionReason: null }, { new: true });
    if (!program) throw new ApiError(404, "Program not found");
     if (program.programManager) {
        await createNotification({
            recipient: program.programManager._id,
            sender: req.user._id,
            title: "Program Approved!",
            message: `Your program "${program.name}" has been approved by a Super Admin and is now Active.`,
            link: `/dashboard/Manager/programs`, // Link to their programs list
            type: 'success'
        });
    }
     await createLog({
        user: req.user._id,
        action: 'PROGRAM_APPROVED',
        details: `SuperAdmin ${req.user.name} approved program '${program.name}'.`,
        entity: { id: program._id, model: 'Program' }
    });
    return res.status(200).json(new ApiResponse(200, program, "Program approved and is now Active."));
});

const rejectProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) throw new ApiError(400, "A reason for rejection is required.");
    const program = await Program.findByIdAndUpdate(id, { status: 'Rejected', rejectionReason: reason }, { new: true });
    if (!program) throw new ApiError(404, "Program not found");
     if (program.programManager) {
        await createNotification({
            recipient: program.programManager._id,
            sender: req.user._id,
            title: "Action Required: Program Rejected",
            message: `Your program "${program.name}" was rejected. Reason: ${reason}. Please review the feedback.`,
            link: `/dashboard/Manager/programs`,
            type: 'warning'
        });
    }
     await createLog({
        user: req.user._id,
        action: 'PROGRAM_REJECTED',
        details: `SuperAdmin ${req.user.name} rejected program '${program.name}'. Reason: ${reason}.`,
        entity: { id: program._id, model: 'Program' }
    });
    return res.status(200).json(new ApiResponse(200, program, "Program has been rejected."));
});

const enrollTrainee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { traineeId } = req.body;
    await verifyManagerAccess(id, req.user._id);
    const trainee = await User.findById(traineeId);
    if (!trainee || trainee.role !== 'Trainee') throw new ApiError(404, "Trainee not found or user is not a trainee.");
    const program = await Program.findByIdAndUpdate(id, { $addToSet: { trainees: traineeId } }, { new: true });
      await createNotification({
        recipient: traineeId,
        sender: req.user._id, // The Program Manager who enrolled them
        title: "You've been enrolled!",
        message: `You have been enrolled in the "${program.name}" program.`,
        link: `/dashboard/Trainee/my-learning`, 
        type: 'info'
    });
     await createLog({
        user: req.user._id,
        action: 'TRAINEE_ENROLLED',
        details: `${req.user.name} enrolled trainee '${trainee.name}' into program '${program.name}'.`,
        entity: { id: program._id, model: 'Program' }
    });
    return res.status(200).json(new ApiResponse(200, program, "Trainee enrolled successfully."));
});

const enrollFacilitator = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { facilitatorId } = req.body;
    await verifyManagerAccess(id, req.user._id);
    const facilitator = await User.findById(facilitatorId);
    if (!facilitator || facilitator.role !== 'Facilitator') throw new ApiError(404, "Facilitator not found or user is not a facilitator.");
    const program = await Program.findByIdAndUpdate(id, { $addToSet: { facilitators: facilitatorId } }, { new: true });
      await createNotification({
        recipient: facilitatorId,
        sender: req.user._id,
        title: "You've been assigned a program!",
        message: `You have been assigned as a facilitator for the "${program.name}" program.`,
        link: `/dashboard/Facilitator/fac-programs`, // Link to their programs list
        type: 'info'
    });
     await createLog({
        user: req.user._id,
        action: 'FACILITATOR_ENROLLED',
        details: `${req.user.name} assigned facilitator '${facilitator.name}' to program '${program.name}'.`,
        entity: { id: program._id, model: 'Program' }
    });

    return res.status(200).json(new ApiResponse(200, program, "Facilitator enrolled successfully."));
});

const getAllPrograms = asyncHandler(async (req, res) => {
    let query = {};
    const { role, _id } = req.user;
    
    console.log('🔍 getAllPrograms Debug:');
    console.log('User Role:', role);
    console.log('User ID:', _id);
    
    if (role === 'Program Manager') {
        query.programManager = _id;
        console.log('Query for Program Manager:', query);
    } else if (role === 'Facilitator') {
        // Facilitators might only see programs they are assigned to, or just active ones
        query.facilitators = _id; // This is what the frontend expects
        console.log('Query for Facilitator:', query);
    } else if (role === 'Trainee') {
        // Trainees only see programs they are enrolled in
        query.trainees = _id;
        console.log('Query for Trainee:', query);
    } else if (role === 'SuperAdmin') {
        // SuperAdmin can see all programs
        console.log('Query for SuperAdmin: all programs');
    }
    
    const programs = await Program.find(query)
        .populate('programManager', 'name email') // Already populated for managers
        .populate('facilitators', 'name email') // <-- ADD THIS LINE to populate facilitators
        .populate('trainees', 'name email'); // Already populated for trainees

    console.log('Found programs count:', programs.length);
    // console.log('Sample program (first one):', programs[0]); // Debug populated data
    
    return res.status(200).json(new ApiResponse(200, programs, "Programs fetched successfully."));
});

 const getProgramById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role, _id } = req.user;

    // Use Promise.all to fetch the program and its associated courses simultaneously
    const [program, courses] = await Promise.all([
        Program.findById(id).populate([
            { path: 'programManager', select: 'name email' },
            { path: 'facilitators', select: 'name email role status isActive' },
            { path: 'trainees', select: 'name email role status isActive' }
        ]).lean(), // .lean() makes the query faster as it returns a plain JS object
        Course.find({ program: id }).populate('facilitator', 'name').lean()
    ]);

    if (!program) {
        throw new ApiError(404, "Program not found");
    }

    // Check if user has access to this program based on their role
    let hasAccess = false;
    if (role === 'SuperAdmin') {
        hasAccess = true; // SuperAdmin can access all programs
    } else if (role === 'Program Manager' && program.programManager?._id?.toString() === _id.toString()) {
        hasAccess = true; // Program Manager can access their own programs
    } else if (role === 'Facilitator' && program.facilitators?.some(f => f._id?.toString() === _id.toString())) {
        hasAccess = true; // Facilitator can access programs they're enrolled in
    } else if (role === 'Trainee' && program.trainees?.some(t => t._id?.toString() === _id.toString())) {
        hasAccess = true; // Trainee can access programs they're enrolled in
    }

    if (!hasAccess) {
        throw new ApiError(403, "You don't have permission to access this program");
    }

    // Combine the results
    const programDetails = {
        ...program,
        courses: courses // Attach the courses to the program object
    };

    return res.status(200).json(new ApiResponse(200, programDetails, "Program details fetched successfully."));
});

const updateProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, startDate, endDate } = req.body;
    if (req.user.role === 'Program Manager') await verifyManagerAccess(id, req.user._id);
    const updatedProgram = await Program.findByIdAndUpdate(id, { $set: { name, description, startDate, endDate } }, { new: true, runValidators: true });
    if (!updatedProgram) throw new ApiError(404, "Program not found");
    return res.status(200).json(new ApiResponse(200, updatedProgram, "Program updated successfully."));
});

const deleteProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    console.log("=== DELETE PROGRAM DEBUG ===");
    console.log("Program ID:", id);
    console.log("User:", req.user);
    console.log("User Role:", req.user.role);
    console.log("User ID:", req.user._id);
    console.log("=============================");
    
    try {
        // Mark program as deleted (permanent removal)
        const program = await Program.findByIdAndUpdate(
            id, 
            { isDeleted: true, isActive: false }, 
            { new: true, runValidators: false }
        );
        
        if (!program) {
            console.log("Program not found");
            throw new ApiError(404, "Program not found");
        }
        
        console.log("Program found and deleted:", program.name);
        
        // Create log entry
        await createLog({
            user: req.user._id,
            action: 'PROGRAM_DELETED',
            details: `${req.user.role} ${req.user.name} permanently deleted program '${program.name}'.`,
            entity: { id: program._id, model: 'Program' }
        });
        
        console.log("Log entry created successfully");
        return res.status(200).json(new ApiResponse(200, {}, "Program has been permanently deleted."));
        
    } catch (error) {
        console.error("Error in deleteProgram:", error);
        throw error;
    }
});

const getArchivedPrograms = asyncHandler(async (req, res) => {
    let query = { isArchived: true }; // Get only archived programs
    const { role, _id } = req.user;
    
    // Filter by user role - Program Managers can only see their own archived programs
    if (role === 'Program Manager') {
        query.programManager = _id;
    }
    // SuperAdmin can see all archived programs
    
    const programs = await Program.find(query)
        .populate('programManager', 'name email')
        .populate('facilitators', 'name email')
        .populate('trainees', 'name email')
        .sort({ updatedAt: -1 }); // Most recently archived first
    
    return res.status(200).json(new ApiResponse(200, programs, "Archived programs fetched successfully."));
});

const archiveProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if user has permission to archive this program
    if (req.user.role === 'Program Manager') {
        await verifyManagerAccess(id, req.user._id);
    }
    
    const program = await Program.findByIdAndUpdate(
        id, 
        { isArchived: true, isActive: false }, 
        { new: true, runValidators: false }
    );
    
    if (!program) {
        throw new ApiError(404, "Program not found");
    }
    
    // Create log entry
    await createLog({
        user: req.user._id,
        action: 'PROGRAM_ARCHIVED',
        details: `${req.user.role} ${req.user.name} archived program '${program.name}'.`,
        entity: { id: program._id, model: 'Program' }
    });

     if (program.programManager && req.user.role === 'SuperAdmin' && req.user._id.toString() !== program.programManager._id.toString()) {
        await createNotification({
            recipient: program.programManager._id,
            sender: req.user._id, // The SuperAdmin
            title: "Program Archived",
            message: `Your program "${program.name}" has been archived by a Super Admin.`,
            link: `/dashboard/Manager/archive`, // Link to PM's archive page
            type: 'warning'
        });
    }
    // If a Program Manager archived their own program: Notify SuperAdmins.
    if (req.user.role === 'Program Manager') {
        const superAdmins = await User.find({ role: 'SuperAdmin' });
        for (const admin of superAdmins) {
            await createNotification({
                recipient: admin._id,
                sender: req.user._id,
                title: "Program Archived by Manager",
                message: `Program Manager ${req.user.name} archived program "${program.name}".`,
                link: `/dashboard/Manager/archive`,
                type: 'info'
            });
        }
    }
    
    return res.status(200).json(new ApiResponse(200, program, "Program has been archived."));
});

const unarchiveProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if user has permission to unarchive this program
    if (req.user.role === 'Program Manager') {
        // For unarchiving, we need to check the archived program
        const program = await Program.findById(id).where({ isArchived: true });
        if (!program) throw new ApiError(404, "Archived program not found.");
        
        const isManager = program.programManager && program.programManager.toString() === req.user._id.toString();
        if (!isManager) {
            throw new ApiError(403, "Forbidden: You are not a manager of this program.");
        }
    }
    
    const program = await Program.findByIdAndUpdate(
        id, 
        { isArchived: false, isActive: true }, 
        { new: true, runValidators: false }
    );
    
    if (!program) {
        throw new ApiError(404, "Program not found");
    }
    
    // Create log entry
     await createLog({
        user: req.user._id,
        action: 'PROGRAM_UNARCHIVED',
        details: `${req.user.role} ${req.user.name} unarchived program '${program.name}'.`,
        entity: { id: program._id, model: 'Program' }
    });
    
     if (program.programManager && req.user.role === 'SuperAdmin' && req.user._id.toString() !== program.programManager._id.toString()) {
        await createNotification({
            recipient: program.programManager._id,
            sender: req.user._id,
            title: "Program Unarchived",
            message: `Your program "${program.name}" has been unarchived by a Super Admin and is now active.`,
            link: `/dashboard/Manager/programs`, // Link to PM's programs list
            type: 'info'
        });
    }
    // If a Program Manager unarchived their own program: Notify SuperAdmins.
    if (req.user.role === 'Program Manager') {
        const superAdmins = await User.find({ role: 'SuperAdmin' });
        for (const admin of superAdmins) {
            await createNotification({
                recipient: admin._id,
                sender: req.user._id,
                title: "Program Unarchived by Manager",
                message: `Program Manager ${req.user.name} unarchived program "${program.name}".`,
                link: `/dashboard/Manager/programs`,
                type: 'info'
            });
        }
    }

    return res.status(200).json(new ApiResponse(200, program, "Program has been unarchived."));
});

const updateProgramManagers = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { managerId, action } = req.body;
    if (!['add', 'remove'].includes(action)) throw new ApiError(400, "Invalid action.");
    const manager = await User.findOne({ _id: managerId, role: { $regex: /program\s*manager/i } });
    if (!manager) throw new ApiError(404, "Not a valid Program Manager.");
    
    let updateOperation;
    if (action === 'add') {
        updateOperation = { programManager: managerId };
    } else {
        updateOperation = { $unset: { programManager: "" } };
    }
    
    const program = await Program.findByIdAndUpdate(id, updateOperation, { new: true }).populate('programManager', 'name email');
    if (!program) throw new ApiError(404, "Program not found.");

     await createLog({
        user: currentUserId,
        action: logAction,
        details: `${req.user.name} ${action}d Program Manager ${manager ? `'${manager.name}'` : 'N/A'} ${action === 'add' ? 'to' : 'from'} program '${updatedProgram.name}'.`,
        entity: { id: updatedProgram._id, model: 'Program' }
    });

    // Send notification to the affected manager
    if (managerId) { // Only send if a manager was involved (not unsetting empty)
        await createNotification({
            recipient: managerId,
            sender: currentUserId,
            title: notificationTitle,
            message: notificationMessage,
            link: `/dashboard/Manager/programs`,
            type: 'info'
        });
    }
    const message = `Program Manager ${action === 'add' ? 'added' : 'removed'}.`;
    return res.status(200).json(new ApiResponse(200, program, message));
});

const generateProgramReport = asyncHandler(async (req, res) => {
    const { generateProgramReportPDF } = await import('../../services/pdf.service.js');
    const { Attendance } = await import('../models/attendance.model.js');
    const { id } = req.params;
    const program = await Program.findById(id).populate('programManager', 'name');
    if (!program) throw new ApiError(404, "Program not found");
    const attendanceRecords = await Attendance.find({ program: id }).populate('user', 'name');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=program-report-${id}.pdf`);
    generateProgramReportPDF(program, attendanceRecords, res);
});

export const assignManager = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { managerId } = req.body;

    const program = await Program.findById(id).populate('programManager', 'name email'); 
    if (!program) throw new ApiError(404, "Program not found.");

    const oldManagerId = program.programManager?._id;
    let newManager = null;
    let message = "";
    let notificationRecipientId = null;
    let notificationTitle = "";
    let notificationMessage = "";
    let notificationType = 'info';

    
    if (!managerId || managerId === 'unassign') {
        if (oldManagerId) {
            program.programManager = undefined; 
            message = "Program Manager unassigned successfully.";
            notificationRecipientId = oldManagerId; 
            notificationTitle = "Program Manager Assignment Removed";
            notificationMessage = `You have been unassigned as the manager for the program "${program.name}".`;
            notificationType = 'warning';
        } else {
            return res.status(200).json(new ApiResponse(200, program, "No manager was assigned to unassign."));
        }
    } else {
        
        newManager = await User.findOne({ _id: managerId, role: 'Program Manager' });
        if (!newManager) {
            throw new ApiError(404, "The selected user is not a valid Program Manager.");
        }

        program.programManager = newManager._id;
        message = "Program Manager assigned successfully.";
        notificationRecipientId = newManager._id; 
        notificationTitle = "New Program Manager Assignment";
        notificationMessage = `You have been assigned as the manager for the program "${program.name}".`;
        notificationType = 'success';
    }

    await program.save({ validateBeforeSave: false }); 

    
    if (notificationRecipientId) {
        await createNotification({
            recipient: notificationRecipientId,
            sender: req.user._id, 
            title: notificationTitle,
            message: notificationMessage,
            link: `/dashboard/Manager/programs`, 
            type: notificationType
        });
    }


    if (oldManagerId && managerId && oldManagerId.toString() !== managerId.toString()) {
        await createNotification({
            recipient: oldManagerId,
            sender: req.user._id,
            title: "Program Manager Assignment Changed",
            message: `You are no longer the manager for the program "${program.name}". It has been reassigned to ${newManager?.name || 'a new manager'}.`,
            link: `/dashboard/Manager/programs`,
            type: 'warning'
        });
    }
    // --- END NEW NOTIFICATION ---

    // Re-populate the programManager for the response, ensuring accurate data is sent back
    const updatedProgram = await Program.findById(id).populate('programManager', 'name email');
    return res.status(200).json(new ApiResponse(200, updatedProgram, message));
});

function getWeekdayCount(startDate, endDate) {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++; // 0=Sunday, 6=Saturday
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}



export const getProgramStats = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const program = await Program.findById(id).select('trainees startDate endDate');
    if (!program) throw new ApiError(404, "Program not found.");
    
    const traineeIds = program.trainees;

    // This is a simplified calculation. A real system might be more complex.
    const [
        totalPresent,
        totalPossibleAttendanceDays, // Placeholder
        completedSubmissions,
        totalSubmissions, // Placeholder
    ] = await Promise.all([
        Attendance.countDocuments({ programId: id, status: 'Present' }),
        Attendance.countDocuments({ programId: id }),
        Submission.countDocuments({ program: id, status: 'Reviewed' }),
        Submission.countDocuments({ program: id }),
    ]);

    const attendanceRate = totalPossibleAttendanceDays > 0 ? Math.round((totalPresent / totalPossibleAttendanceDays) * 100) : 0;
    const completionRate = totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 0;

    const stats = {
        enrolledTrainees: traineeIds.length,
        attendanceRate: attendanceRate,
        completionRate: completionRate,
    };

    return res.status(200).json(new ApiResponse(200, stats, "Program stats fetched successfully."));
});

const getProgramStudentCount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const program = await Program.findById(id);
    if (!program) throw new ApiError(404, "Program not found");
    const count = program.trainees ? program.trainees.length : 0;
    return res.status(200).json(new ApiResponse(200, { count }, "Student count fetched successfully."));
});


/**
 * @desc    Program Manager or SuperAdmin marks a program as 'Completed'.
 * @route   PATCH /api/v1/programs/:id/complete
 * @access  Private (Program Manager, SuperAdmin)
 */
 const markProgramAsCompleted = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { user } = req; // Current user

    // Verify access: Program Manager must manage the program, SuperAdmin has universal access
    if (user.role === 'Program Manager') {
        await verifyManagerAccess(id, user._id);
    } else if (user.role !== 'SuperAdmin') {
        throw new ApiError(403, "Forbidden: Only Program Managers or SuperAdmins can mark programs as completed.");
    }

    const program = await Program.findById(id);
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }

    if (program.status === 'Completed') {
        throw new ApiError(400, "Program is already marked as completed.");
    }
    
    // Check if the program's end date has passed, or allow force complete
    // For simplicity, we'll allow completing it regardless of date for now,
    // but in production, you might add:
    // if (new Date(program.endDate) > new Date()) {
    //     throw new ApiError(400, "Program cannot be marked completed before its end date.");
    // }

    program.status = 'Completed';
    program.isActive = false; // A completed program is typically no longer active
    await program.save({ validateBeforeSave: false }); // Bypass validation if status change conflicts with other rules

    await createLog({
        user: user._id,
        action: 'PROGRAM_COMPLETED',
        details: `${user.role} ${user.name} marked program '${program.name}' as completed.`,
        entity: { id: program._id, model: 'Program' }
    });

    // Notify program manager if a SuperAdmin marked it completed
    if (user.role === 'SuperAdmin' && program.programManager && program.programManager.toString() !== user._id.toString()) {
        await createNotification({
            recipient: program.programManager,
            sender: user._id,
            title: "Program Marked Complete",
            message: `The program "${program.name}" has been marked as completed.`,
            link: `/dashboard/Manager/programs`,
            type: 'info'
        });
    }

    return res.status(200).json(new ApiResponse(200, program, "Program marked as completed successfully."));
});


const reactivateProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newEndDate } = req.body; // Expecting newEndDate from frontend

    if (!newEndDate) {
        throw new ApiError(400, "A new end date is required to reactivate the program.");
    }

    // Validate newEndDate is a valid future date
    const parsedNewEndDate = new Date(newEndDate);
    if (isNaN(parsedNewEndDate.getTime())) {
        throw new ApiError(400, "Invalid new end date provided.");
    }
    if (parsedNewEndDate <= new Date()) { // New end date must be strictly in the future
        throw new ApiError(400, "New end date must be in the future.");
    }

    // Find the program. Note: The pre('find') middleware might filter it if it's archived/deleted.
    // If you explicitly want to find archived programs, you'd need to modify the query or the middleware.
    // For this specific case (reactivating from 'Completed'), it should typically be non-archived.
    const program = await Program.findById(id); 
    if (!program) {
        throw new ApiError(404, "Program not found.");
    }

    // Verify access: Program Manager owns it OR is SuperAdmin
    const isManager = program.programManager && program.programManager.toString() === req.user._id.toString();
    if (!isManager && req.user.role !== 'SuperAdmin') {
        throw new ApiError(403, "Forbidden: You do not have permission to reactivate this program.");
    }

    // Only allow reactivation if status is 'Completed'
    if (program.status !== 'Completed') {
        throw new ApiError(400, `Program cannot be reactivated from status '${program.status}'. Only 'Completed' programs can be reactivated here.`);
    }

    // Update program fields
    program.status = 'Active';
    program.isActive = true; // Ensure it's active
    program.endDate = parsedNewEndDate; // Set the new end date
    // Optionally, if the program was also 'isArchived: true' when completed, you might set isArchived: false here too.
    // However, the `archiveProgram` controller handles setting isArchived: true, and `unarchiveProgram` handles reversing that.
    // So, 'Completed' programs usually aren't archived unless explicitly done so by a separate action.

    await program.save({ validateBeforeSave: false }); // Bypass schema validation for status/isActive changes

    await createLog({
        user: req.user._id,
        action: 'PROGRAM_REACTIVATED',
        details: `${req.user.role} ${req.user.name} reactivated program '${program.name}' until ${parsedNewEndDate.toLocaleDateString()}.`,
        entity: { id: program._id, model: 'Program' }
    });

    return res.status(200).json(new ApiResponse(200, program, "Program reactivated successfully."));
});



export {
    createProgram,
    requestApproval,
    approveProgram,
    rejectProgram,
    enrollTrainee,
    enrollFacilitator,
    getAllPrograms,
    getProgramById,
    updateProgram,
    deleteProgram,
    updateProgramManagers,
    generateProgramReport,
    getArchivedPrograms,
    archiveProgram,
    unarchiveProgram,
    getProgramStudentCount,
    markProgramAsCompleted,
    reactivateProgram,
};