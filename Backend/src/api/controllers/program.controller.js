import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Program } from '../models/program.model.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { createLog } from '../../services/log.service.js';
import { Attendance } from '../models/attendance.model.js';

// --- HELPER FUNCTION with DEEP DEBUGGING ---
const canUserManageProgram = async (programId, user) => {
    if (!user || !user.role) {
        throw new ApiError(401, "Unauthorized: User information is missing.");
    }

    console.log(`--- [Auth Check for Program: ${programId}] ---`);
    console.log(`- User ID requesting access: ${user._id}, Role: "${user.role}"`);

    if (user.role === 'SuperAdmin') {
        console.log(`- Result: SUCCESS (User is a SuperAdmin)`);
        console.log(`-------------------------------------------`);
        return true; 
    }
    
    if (user.role === 'Program Manager') {
        const program = await Program.findById(programId);
        if (!program) {
            throw new ApiError(404, "Program not found.");
        }

        console.log(`- Program Managers on record: [${program.programManagers.map(id => id.toString()).join(', ')}]`);

        const isManager = program.programManagers.some(managerId => managerId.toString() === user._id.toString());
        
        if (isManager) {
            console.log(`- Result: SUCCESS (Manager ID ${user._id} was found in the program's manager list)`);
            console.log(`-------------------------------------------`);
            return true;
        } else {
            console.error(`- Result: FAILURE (Manager ID ${user._id} was NOT found in the program's manager list)`);
            console.log(`-------------------------------------------`);
            throw new ApiError(403, "Forbidden: You are not an assigned manager for this program.");
        }
    }
    
    console.warn(`- Result: FAILURE (User role "${user.role}" is not authorized for this action)`);
    console.log(`-------------------------------------------`);
    throw new ApiError(403, "Forbidden: Your role does not have permission to manage programs.");
};


// --- CONTROLLER FUNCTIONS ---

const createProgram = asyncHandler(async (req, res) => {
    const { name, description, startDate, endDate, category } = req.body;
    const creator = req.user;
    let programStatus = 'Draft';
    let managers = [];
    if (creator.role === 'Program Manager') {
        managers.push(creator._id);
    }
    const programDoc = await Program.create({ name, description, startDate, endDate, category, programManagers: managers, status: programStatus });
    const populatedProgram = await Program.findById(programDoc._id).populate('programManagers', 'name email');
    const message = creator.role === 'Program Manager' ? "Program created in Draft state." : "Program created.";
    return res.status(201).json(new ApiResponse(201, populatedProgram, message));
});

const requestApproval = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (req.user.role !== 'Program Manager') {
        throw new ApiError(403, "Forbidden: Only Program Managers can request approval.");
    }
    const program = await Program.findById(id);
    if (!program) throw new ApiError(404, "Program not found.");
    const isManager = program.programManagers.some(id => id.toString() === req.user._id.toString());
    if (!isManager) throw new ApiError(403, "Forbidden: Only an assigned manager can request approval.");
    const updatedProgram = await Program.findByIdAndUpdate(id, { status: 'PendingApproval' }, { new: true });
    await createLog({ user: req.user._id, action: 'PROGRAM_SUBMITTED_FOR_APPROVAL', details: `PM ${req.user.name} submitted program '${updatedProgram.name}' for approval.`, entity: { id: updatedProgram._id, model: 'Program' } });
    return res.status(200).json(new ApiResponse(200, updatedProgram, "Program submitted for approval."));
});

const enrollTrainee = asyncHandler(async (req, res) => {
    const { id: programId } = req.params;
    const { traineeId } = req.body;
    await canUserManageProgram(programId, req.user);
    const trainee = await User.findById(traineeId);
    if (!trainee || trainee.role !== 'Trainee') throw new ApiError(404, "Trainee not found or user is not a trainee.");
    const program = await Program.findByIdAndUpdate(programId, { $addToSet: { trainees: traineeId } }, { new: true });
    return res.status(200).json(new ApiResponse(200, program, "Trainee enrolled successfully."));
});

const enrollFacilitator = asyncHandler(async (req, res) => {
    const { id: programId } = req.params;
    const { facilitatorId } = req.body;
    await canUserManageProgram(programId, req.user);
    const facilitator = await User.findById(facilitatorId);
    if (!facilitator || facilitator.role !== 'Facilitator') throw new ApiError(404, "Facilitator not found or user is not a facilitator.");
    const program = await Program.findByIdAndUpdate(programId, { $addToSet: { facilitators: facilitatorId } }, { new: true });
    return res.status(200).json(new ApiResponse(200, program, "Facilitator enrolled successfully."));
});

const updateProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, startDate, endDate, category } = req.body;
    await canUserManageProgram(id, req.user);
    const updatedProgram = await Program.findByIdAndUpdate(id, { $set: { name, description, startDate, endDate, category } }, { new: true, runValidators: true });
    if (!updatedProgram) throw new ApiError(404, "Program not found");
    return res.status(200).json(new ApiResponse(200, updatedProgram, "Program updated successfully."));
});

// The rest of the functions are mostly fine, but let's include them for completeness.
const approveProgram = asyncHandler(async (req, res) => { const { id } = req.params; const program = await Program.findByIdAndUpdate(id, { status: 'Active', rejectionReason: null }, { new: true }); if (!program) throw new ApiError(404, "Program not found"); await createLog({ user: req.user._id, action: 'PROGRAM_APPROVED', details: `SuperAdmin ${req.user.name} approved program '${program.name}'.`, entity: { id: program._id, model: 'Program' } }); return res.status(200).json(new ApiResponse(200, program, "Program approved and is now Active.")); });
const rejectProgram = asyncHandler(async (req, res) => { const { id } = req.params; const { reason } = req.body; if (!reason) throw new ApiError(400, "A reason for rejection is required."); const program = await Program.findByIdAndUpdate(id, { status: 'Rejected', rejectionReason: reason }, { new: true }); if (!program) throw new ApiError(404, "Program not found"); await createLog({ user: req.user._id, action: 'PROGRAM_REJECTED', details: `SuperAdmin ${req.user.name} rejected program '${program.name}'. Reason: ${reason}.`, entity: { id: program._id, model: 'Program' } }); return res.status(200).json(new ApiResponse(200, program, "Program has been rejected.")); });
const getAllPrograms = asyncHandler(async (req, res) => { let query = {}; const { role, _id } = req.user; if (role === 'Program Manager') query.programManagers = _id; else if (role === 'Facilitator') query.facilitators = _id; else if (role === 'Trainee') query.trainees = _id; const programs = await Program.find(query).populate('programManagers', 'name email'); return res.status(200).json(new ApiResponse(200, programs, "Programs fetched successfully.")); });
const getProgramById = asyncHandler(async (req, res) => { const { id } = req.params; const program = await Program.findById(id).populate([ { path: 'programManagers', select: 'name email' }, { path: 'facilitators', select: 'name email' }, { path: 'trainees', select: 'name email' } ]); if (!program) throw new ApiError(404, "Program not found"); return res.status(200).json(new ApiResponse(200, program, "Program details fetched successfully.")); });
const deleteProgram = asyncHandler(async (req, res) => { const { id } = req.params; const program = await Program.findByIdAndUpdate(id, { isActive: false }, { new: true }); if (!program) throw new ApiError(404, "Program not found"); await createLog({ user: req.user._id, action: 'PROGRAM_DEACTIVATED', details: `SuperAdmin ${req.user.name} deactivated program '${program.name}'.`, entity: { id: program._id, model: 'Program' } }); return res.status(200).json(new ApiResponse(200, {}, "Program has been deactivated.")); });
const updateProgramManagers = asyncHandler(async (req, res) => { const { id } = req.params; const { managerId, action } = req.body; if (!['add', 'remove'].includes(action)) throw new ApiError(400, "Invalid action."); const manager = await User.findOne({ _id: managerId, role: 'Program Manager' }); if (!manager) throw new ApiError(404, "Not a valid Program Manager."); const operator = action === 'add' ? '$addToSet' : '$pull'; const program = await Program.findByIdAndUpdate(id, { [operator]: { programManagers: managerId } }, { new: true }).populate('programManagers', 'name email'); if (!program) throw new ApiError(404, "Program not found."); const message = `Program Manager ${action === 'add' ? 'added' : 'removed'}.`; return res.status(200).json(new ApiResponse(200, program, message)); });
const generateProgramReport = asyncHandler(async (req, res) => { const { generateProgramReportPDF } = await import('../../services/pdf.service.js'); const { id } = req.params; const program = await Program.findById(id).populate('programManagers', 'name'); if (!program) throw new ApiError(404, "Program not found"); const attendanceRecords = await Attendance.find({ program: id }).populate('user', 'name'); res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename=program-report-${id}.pdf`); generateProgramReportPDF(program, attendanceRecords, res); });
const assignManager = asyncHandler(async (req, res) => { const { id } = req.params; const { managerId } = req.body; if (!managerId || managerId === '') { const program = await Program.findByIdAndUpdate(id, { $set: { programManagers: [] } }, { new: true }); if (!program) throw new ApiError(404, "Program not found."); return res.status(200).json(new ApiResponse(200, program, "All managers unassigned.")); } const manager = await User.findOne({ _id: managerId, role: 'Program Manager' }); if (!manager) throw new ApiError(404, "The selected user is not a valid Program Manager."); const program = await Program.findByIdAndUpdate( id, { programManagers: [managerId] }, { new: true }).populate('programManagers', 'name email'); if (!program) throw new ApiError(404, "Program not found."); return res.status(200).json(new ApiResponse(200, program, "Program Manager assigned successfully.")); });
function getWeekdayCount(startDate, endDate) { let count = 0; const curDate = new Date(startDate.getTime()); while (curDate <= endDate) { const dayOfWeek = curDate.getDay(); if (dayOfWeek !== 0 && dayOfWeek !== 6) count++; curDate.setDate(curDate.getDate() + 1); } return count; }
const getProgramStats = asyncHandler(async (req, res) => { const { id } = req.params; const program = await Program.findById(id); if (!program) throw new ApiError(404, "Program not found."); const attendanceRecords = await Attendance.find({ program: id }); const presentCount = attendanceRecords.filter(a => a.status === 'Present').length; const excusedCount = attendanceRecords.filter(a => a.status === 'Excused').length; const today = new Date(); const programStartDate = new Date(program.startDate); const effectiveEndDate = today < new Date(program.endDate) ? today : new Date(program.endDate); let totalEligibleDays = 0; if (programStartDate <= effectiveEndDate) { totalEligibleDays = getWeekdayCount(programStartDate, effectiveEndDate); } const totalRequiredDays = totalEligibleDays - excusedCount; let overallAttendancePercentage = 0; if (totalRequiredDays > 0) { overallAttendancePercentage = (presentCount / totalRequiredDays) * 100; } const stats = { totalEnrolled: program.trainees.length, totalFacilitators: program.facilitators.length, overallAttendancePercentage: Math.round(overallAttendancePercentage * 100) / 100, totalPresentDays: presentCount, totalExcusedDays: excusedCount, totalEligibleDays: totalEligibleDays, }; return res.status(200).json(new ApiResponse(200, stats, "Program statistics fetched successfully.")); });

export {
    createProgram, requestApproval, approveProgram, rejectProgram, enrollTrainee, enrollFacilitator,
    getAllPrograms, getProgramById, updateProgram, deleteProgram, updateProgramManagers,
    generateProgramReport, getProgramStats, assignManager,
};