import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Project } from '../models/project.model.js';
import { ProjectUpdate } from '../models/projectUpdate.model.js';
import { ProjectTask } from '../models/projectTask.model.js';
import { Program } from '../models/program.model.js';

const getStartOfDay = (date) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

const isEditable = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours < 24;
};

/**
 * Verify user has access to a program based on their role
 */
const verifyProgramAccess = async (userId, userRole, programId) => {
    if (userRole === 'Program Manager') {
        const program = await Program.findOne({ _id: programId, programManager: userId });
        return !!program;
    } else if (userRole === 'Facilitator') {
        const program = await Program.findOne({ _id: programId, facilitators: userId });
        return !!program;
    }
    return false;
};

/**
 * Get program IDs accessible to this user
 */
const getAccessibleProgramIds = async (userId, userRole) => {
    let programs = [];
    if (userRole === 'Program Manager') {
        programs = await Program.find({ programManager: userId }).select('_id');
    } else if (userRole === 'Facilitator') {
        programs = await Program.find({ facilitators: userId }).select('_id');
    }
    return programs.map(p => p._id);
};

// ============================================================
// PROJECT CRUD
// ============================================================

/**
 * @desc    Create a new project
 * @route   POST /api/v1/projects
 * @access  Private (Facilitator, Program Manager)
 */
export const createProject = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { title, description, program, companyName, companyAddress, companyContactPerson, companyContactPhone, startDate, dueDate } = req.body;

    // Normalize assignedTrainees from FormData (can be string, array, or undefined)
    let assignedTrainees = req.body.assignedTrainees || [];
    if (typeof assignedTrainees === 'string') {
        assignedTrainees = [assignedTrainees];
    }
    if (!Array.isArray(assignedTrainees)) {
        assignedTrainees = [];
    }

    if (!title || !program) {
        throw new ApiError(400, "Project title and program are required.");
    }

    const hasAccess = await verifyProgramAccess(userId, userRole, program);
    if (!hasAccess) {
        throw new ApiError(403, "You are not authorized to create projects for this program.");
    }

    // Validate that assigned trainees are enrolled in the program
    if (assignedTrainees.length > 0) {
        const programDoc = await Program.findById(program);
        const enrolledIds = (programDoc.trainees || []).map(t => t.toString());
        const invalidTrainees = assignedTrainees.filter(t => !enrolledIds.includes(t));
        if (invalidTrainees.length > 0) {
            throw new ApiError(400, "Some trainees are not enrolled in this program.");
        }
    }

    // Handle uploaded files
    const files = [];
    if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
            files.push({
                fileName: file.originalname,
                fileUrl: `uploads/${file.filename}`
            });
        });
    }

    // Validate teamLead if provided
    const teamLead = req.body.teamLead;
    if (teamLead && assignedTrainees.length > 0) {
        if (!assignedTrainees.includes(teamLead)) {
            throw new ApiError(400, "Team lead must be one of the assigned trainees.");
        }
    }

    const project = await Project.create({
        title,
        description,
        program,
        createdBy: userId,
        assignedTrainees: assignedTrainees || [],
        teamLead: teamLead || undefined,
        companyName,
        companyAddress,
        companyContactPerson,
        companyContactPhone,
        files,
        startDate,
        dueDate
    });

    const populated = await Project.findById(project._id)
        .populate('program', 'name')
        .populate('createdBy', 'name email')
        .populate('assignedTrainees', 'name email')
        .populate('teamLead', 'name email');

    return res.status(201).json(new ApiResponse(201, populated, "Project created successfully."));
});

/**
 * @desc    Get all projects (Facilitator/PM - for their programs)
 * @route   GET /api/v1/projects
 * @access  Private (Facilitator, Program Manager)
 */
export const getProjects = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { program, status } = req.query;

    const programIds = await getAccessibleProgramIds(userId, userRole);

    if (programIds.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No programs found."));
    }

    const query = { program: { $in: programIds } };

    if (program && programIds.map(p => p.toString()).includes(program)) {
        query.program = program;
    }
    if (status) {
        query.status = status;
    }

    const projects = await Project.find(query)
        .populate('program', 'name')
        .populate('createdBy', 'name email')
        .populate('assignedTrainees', 'name email')
        .populate('teamLead', 'name email')
        .sort({ createdAt: -1 });

    // For each project, calculate progress from tasks (fallback to old updates for legacy)
    const projectsWithProgress = await Promise.all(projects.map(async (project) => {
        const tasks = await ProjectTask.find({ project: project._id });

        let avgCompletion = 0;
        if (tasks.length > 0) {
            // Task-based progress
            avgCompletion = Math.round(tasks.reduce((sum, t) => sum + t.completionPercentage, 0) / tasks.length);
        } else {
            // Fallback to old ProjectUpdate-based calculation for legacy projects
            const latestUpdates = await ProjectUpdate.aggregate([
                { $match: { project: project._id } },
                { $sort: { date: -1 } },
                { $group: {
                    _id: '$trainee',
                    latestPercentage: { $first: '$completionPercentage' }
                }}
            ]);
            avgCompletion = latestUpdates.length > 0
                ? Math.round(latestUpdates.reduce((sum, u) => sum + (u.latestPercentage || 0), 0) / latestUpdates.length)
                : 0;
        }

        return {
            ...project.toObject(),
            averageCompletion: avgCompletion,
            totalTasks: tasks.length
        };
    }));

    return res.status(200).json(new ApiResponse(200, projectsWithProgress, "Projects fetched successfully."));
});

/**
 * @desc    Get a single project by ID
 * @route   GET /api/v1/projects/:id
 * @access  Private (Facilitator, PM, or assigned Trainee)
 */
export const getProjectById = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;

    const project = await Project.findById(id)
        .populate('program', 'name')
        .populate('createdBy', 'name email')
        .populate('assignedTrainees', 'name email')
        .populate('teamLead', 'name email');

    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    // Access check
    if (userRole === 'Trainee') {
        const isAssigned = project.assignedTrainees.some(t => t._id.toString() === userId.toString());
        if (!isAssigned) {
            throw new ApiError(403, "You are not assigned to this project.");
        }
    } else {
        const hasAccess = await verifyProgramAccess(userId, userRole, project.program._id);
        if (!hasAccess) {
            throw new ApiError(403, "You don't have access to this project.");
        }
    }

    // Get tasks for this project
    const tasks = await ProjectTask.find({ project: project._id })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });

    // Get per-trainee progress from updates (legacy)
    const traineeProgress = await ProjectUpdate.aggregate([
        { $match: { project: project._id } },
        { $sort: { date: -1 } },
        { $group: {
            _id: '$trainee',
            latestPercentage: { $first: '$completionPercentage' },
            latestDescription: { $first: '$description' },
            latestDate: { $first: '$date' },
            totalUpdates: { $sum: 1 }
        }}
    ]);

    return res.status(200).json(new ApiResponse(200, {
        ...project.toObject(),
        traineeProgress,
        tasks
    }, "Project fetched successfully."));
});

/**
 * @desc    Update a project
 * @route   PUT /api/v1/projects/:id
 * @access  Private (Facilitator, Program Manager)
 */
export const updateProject = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;
    const { title, description, companyName, companyAddress, companyContactPerson, companyContactPhone, status, startDate, dueDate } = req.body;

    // Normalize assignedTrainees from FormData
    let assignedTrainees = req.body.assignedTrainees;
    if (assignedTrainees !== undefined) {
        if (typeof assignedTrainees === 'string') {
            assignedTrainees = [assignedTrainees];
        }
        if (!Array.isArray(assignedTrainees)) {
            assignedTrainees = [];
        }
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    const hasAccess = await verifyProgramAccess(userId, userRole, project.program);
    if (!hasAccess) {
        throw new ApiError(403, "You don't have access to update this project.");
    }

    // Validate new trainees if changing assignment
    if (assignedTrainees) {
        const programDoc = await Program.findById(project.program);
        const enrolledIds = (programDoc.trainees || []).map(t => t.toString());
        const invalidTrainees = assignedTrainees.filter(t => !enrolledIds.includes(t));
        if (invalidTrainees.length > 0) {
            throw new ApiError(400, "Some trainees are not enrolled in this program.");
        }
    }

    // Handle newly uploaded files (append to existing)
    if (req.files && req.files.length > 0) {
        const newFiles = req.files.map(file => ({
            fileName: file.originalname,
            fileUrl: `uploads/${file.filename}`
        }));
        project.files = [...(project.files || []), ...newFiles];
    }

    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (assignedTrainees !== undefined) project.assignedTrainees = assignedTrainees;
    if (companyName !== undefined) project.companyName = companyName;
    if (companyAddress !== undefined) project.companyAddress = companyAddress;
    if (companyContactPerson !== undefined) project.companyContactPerson = companyContactPerson;
    if (companyContactPhone !== undefined) project.companyContactPhone = companyContactPhone;
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;

    // Handle teamLead
    const teamLead = req.body.teamLead;
    if (teamLead !== undefined) {
        if (!teamLead || teamLead === 'none') {
            project.teamLead = undefined;
        } else {
            const finalTrainees = (assignedTrainees || project.assignedTrainees).map(t => t.toString());
            if (!finalTrainees.includes(teamLead)) {
                throw new ApiError(400, "Team lead must be one of the assigned trainees.");
            }
            project.teamLead = teamLead;
        }
    }

    await project.save();

    const populated = await Project.findById(project._id)
        .populate('program', 'name')
        .populate('createdBy', 'name email')
        .populate('assignedTrainees', 'name email')
        .populate('teamLead', 'name email');

    return res.status(200).json(new ApiResponse(200, populated, "Project updated successfully."));
});

/**
 * @desc    Delete a project (soft delete)
 * @route   DELETE /api/v1/projects/:id
 * @access  Private (Facilitator, Program Manager)
 */
export const deleteProject = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    const hasAccess = await verifyProgramAccess(userId, userRole, project.program);
    if (!hasAccess) {
        throw new ApiError(403, "You don't have access to delete this project.");
    }

    project.isDeleted = true;
    await project.save();

    return res.status(200).json(new ApiResponse(200, {}, "Project deleted successfully."));
});

/**
 * @desc    Remove a file from a project
 * @route   DELETE /api/v1/projects/:id/files/:fileIndex
 * @access  Private (Facilitator, Program Manager)
 */
export const removeProjectFile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { id, fileIndex } = req.params;

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    const hasAccess = await verifyProgramAccess(userId, userRole, project.program);
    if (!hasAccess) {
        throw new ApiError(403, "You don't have access to modify this project.");
    }

    const idx = parseInt(fileIndex);
    if (isNaN(idx) || idx < 0 || idx >= (project.files || []).length) {
        throw new ApiError(400, "Invalid file index.");
    }

    project.files.splice(idx, 1);
    await project.save();

    return res.status(200).json(new ApiResponse(200, project, "File removed successfully."));
});

// ============================================================
// TRAINEE: MY PROJECTS
// ============================================================

/**
 * @desc    Get projects assigned to the current trainee
 * @route   GET /api/v1/projects/my-projects
 * @access  Private (Trainee)
 */
export const getMyProjects = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;
    const { status } = req.query;

    const query = { assignedTrainees: traineeId };
    if (status) query.status = status;

    const projects = await Project.find(query)
        .populate('program', 'name')
        .populate('createdBy', 'name email')
        .populate('assignedTrainees', 'name email')
        .populate('teamLead', 'name email')
        .sort({ createdAt: -1 });

    // Calculate progress from tasks (fallback to old updates for legacy)
    const projectsWithProgress = await Promise.all(projects.map(async (project) => {
        const myTasks = await ProjectTask.find({
            project: project._id,
            assignedTo: traineeId
        });

        let myAvgCompletion = 0;
        if (myTasks.length > 0) {
            myAvgCompletion = Math.round(myTasks.reduce((sum, t) => sum + t.completionPercentage, 0) / myTasks.length);
        } else {
            // Fallback to old ProjectUpdate-based calculation
            const latestUpdate = await ProjectUpdate.findOne({
                project: project._id,
                trainee: traineeId
            }).sort({ date: -1 });
            myAvgCompletion = latestUpdate ? (latestUpdate.completionPercentage || 0) : 0;
        }

        return {
            ...project.toObject(),
            myLatestCompletion: myAvgCompletion,
            myTaskCount: myTasks.length
        };
    }));

    return res.status(200).json(new ApiResponse(200, projectsWithProgress, "My projects fetched successfully."));
});

// ============================================================
// PROJECT UPDATES (Trainee daily progress)
// ============================================================

/**
 * @desc    Create a project update (Trainee)
 * @route   POST /api/v1/projects/:id/updates
 * @access  Private (Trainee)
 */
export const createProjectUpdate = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;
    const { id } = req.params;
    const { description, completionPercentage, blockers } = req.body;

    if (!description) {
        throw new ApiError(400, "Description is required.");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    // Verify trainee is assigned
    const isAssigned = project.assignedTrainees.some(t => t.toString() === traineeId.toString());
    if (!isAssigned) {
        throw new ApiError(403, "You are not assigned to this project.");
    }

    const today = getStartOfDay(new Date());

    // Check for existing update today
    const existing = await ProjectUpdate.findOne({
        project: id,
        trainee: traineeId,
        date: today
    });

    if (existing) {
        throw new ApiError(400, "You have already submitted an update for this project today. You can edit it if it's within 24 hours.");
    }

    const updateData = {
        project: id,
        trainee: traineeId,
        date: today,
        description,
        blockers: blockers || ''
    };
    if (completionPercentage !== undefined) {
        updateData.completionPercentage = Math.min(100, Math.max(0, parseInt(completionPercentage)));
    }

    const update = await ProjectUpdate.create(updateData);

    const populated = await ProjectUpdate.findById(update._id)
        .populate('trainee', 'name email')
        .populate('project', 'title');

    return res.status(201).json(new ApiResponse(201, populated, "Project update submitted successfully."));
});

/**
 * @desc    Update an existing project update (Trainee - within 24h)
 * @route   PUT /api/v1/projects/updates/:updateId
 * @access  Private (Trainee)
 */
export const editProjectUpdate = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;
    const { updateId } = req.params;
    const { description, completionPercentage, blockers } = req.body;

    const update = await ProjectUpdate.findOne({ _id: updateId, trainee: traineeId });
    if (!update) {
        throw new ApiError(404, "Project update not found or you don't have permission.");
    }

    if (!isEditable(update.createdAt)) {
        throw new ApiError(403, "You can only edit updates within 24 hours of submission.");
    }

    if (description) update.description = description;
    if (completionPercentage !== undefined) {
        update.completionPercentage = Math.min(100, Math.max(0, parseInt(completionPercentage)));
    }
    if (blockers !== undefined) update.blockers = blockers;

    await update.save();

    const populated = await ProjectUpdate.findById(update._id)
        .populate('trainee', 'name email')
        .populate('project', 'title');

    return res.status(200).json(new ApiResponse(200, {
        ...populated.toObject(),
        isEditable: true
    }, "Project update edited successfully."));
});

/**
 * @desc    Get my updates for a specific project (Trainee)
 * @route   GET /api/v1/projects/:id/my-updates
 * @access  Private (Trainee)
 */
export const getMyProjectUpdates = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;
    const { id } = req.params;
    const { limit = 30 } = req.query;

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    const isAssigned = project.assignedTrainees.some(t => t.toString() === traineeId.toString());
    if (!isAssigned) {
        throw new ApiError(403, "You are not assigned to this project.");
    }

    const updates = await ProjectUpdate.find({
        project: id,
        trainee: traineeId
    })
    .populate('reviewedBy', 'name')
    .sort({ date: -1 })
    .limit(parseInt(limit));

    const updatesWithEditable = updates.map(u => ({
        ...u.toObject(),
        isEditable: isEditable(u.createdAt)
    }));

    return res.status(200).json(new ApiResponse(200, updatesWithEditable, "Project updates fetched successfully."));
});

/**
 * @desc    Get today's project update (Trainee)
 * @route   GET /api/v1/projects/:id/today-update
 * @access  Private (Trainee)
 */
export const getTodayProjectUpdate = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;
    const { id } = req.params;

    const today = getStartOfDay(new Date());

    const update = await ProjectUpdate.findOne({
        project: id,
        trainee: traineeId,
        date: today
    }).populate('reviewedBy', 'name');

    if (update) {
        return res.status(200).json(new ApiResponse(200, {
            ...update.toObject(),
            isEditable: isEditable(update.createdAt)
        }, "Today's project update found."));
    }

    return res.status(200).json(new ApiResponse(200, null, "No update for today yet."));
});

// ============================================================
// FACILITATOR/PM: VIEW PROJECT UPDATES
// ============================================================

/**
 * @desc    Get all updates for a project (Facilitator/PM)
 * @route   GET /api/v1/projects/:id/updates
 * @access  Private (Facilitator, Program Manager)
 */
export const getProjectUpdates = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;
    const { trainee, startDate, endDate, limit = 50, page = 1 } = req.query;

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    const hasAccess = await verifyProgramAccess(userId, userRole, project.program);
    if (!hasAccess) {
        throw new ApiError(403, "You don't have access to this project's updates.");
    }

    const query = { project: id };
    if (trainee) query.trainee = trainee;
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = getStartOfDay(startDate);
        if (endDate) query.date.$lte = getStartOfDay(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ProjectUpdate.countDocuments(query);

    const updates = await ProjectUpdate.find(query)
        .populate('trainee', 'name email')
        .populate('project', 'title')
        .populate('reviewedBy', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    return res.status(200).json(new ApiResponse(200, {
        updates,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
    }, "Project updates fetched successfully."));
});

/**
 * @desc    Review a project update (Facilitator/PM)
 * @route   PATCH /api/v1/projects/updates/:updateId/review
 * @access  Private (Facilitator, Program Manager)
 */
export const reviewProjectUpdate = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { updateId } = req.params;
    const { reviewComment } = req.body;

    const update = await ProjectUpdate.findById(updateId).populate('project');
    if (!update) {
        throw new ApiError(404, "Project update not found.");
    }

    const hasAccess = await verifyProgramAccess(userId, userRole, update.project.program);
    if (!hasAccess) {
        throw new ApiError(403, "You don't have access to review this update.");
    }

    update.isReviewed = true;
    update.reviewedBy = userId;
    update.reviewedAt = new Date();
    if (reviewComment) update.reviewComment = reviewComment;

    await update.save();

    const populated = await ProjectUpdate.findById(update._id)
        .populate('trainee', 'name email')
        .populate('project', 'title')
        .populate('reviewedBy', 'name');

    return res.status(200).json(new ApiResponse(200, populated, "Update reviewed successfully."));
});
