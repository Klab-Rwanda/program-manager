import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Project } from '../models/project.model.js';
import { ProjectTask } from '../models/projectTask.model.js';
import { Program } from '../models/program.model.js';

/**
 * Check if user can manage tasks (create/edit/delete) for a project
 * Returns true for Facilitator/PM with program access, or for the project's team lead
 */
const canManageTasks = async (userId, userRole, project) => {
    if (userRole === 'Program Manager') {
        const program = await Program.findOne({ _id: project.program, programManager: userId });
        return !!program;
    }
    if (userRole === 'Facilitator') {
        const program = await Program.findOne({ _id: project.program, facilitators: userId });
        return !!program;
    }
    if (userRole === 'Trainee') {
        return project.teamLead && project.teamLead.toString() === userId.toString();
    }
    return false;
};

/**
 * @desc    Create a task within a project
 * @route   POST /api/v1/projects/:id/tasks
 * @access  Private (Facilitator, PM, or Team Lead)
 */
export const createTask = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;
    const { title, description, assignedTo, dueDate } = req.body;

    if (!title) {
        throw new ApiError(400, "Task title is required.");
    }

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    const hasAccess = await canManageTasks(userId, userRole, project);
    if (!hasAccess) {
        throw new ApiError(403, "You are not authorized to create tasks for this project.");
    }

    // Verify assignedTo is one of the project's assigned trainees (if provided)
    if (assignedTo) {
        const isAssigned = project.assignedTrainees.some(t => t.toString() === assignedTo);
        if (!isAssigned) {
            throw new ApiError(400, "The selected trainee is not assigned to this project.");
        }
    }

    const task = await ProjectTask.create({
        project: id,
        title,
        description: description || '',
        assignedTo: assignedTo || null,
        createdBy: userId,
        dueDate: dueDate || undefined
    });

    const populated = await ProjectTask.findById(task._id)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name')
        .populate('comments.user', 'name email');

    return res.status(201).json(new ApiResponse(201, populated, "Task created successfully."));
});

/**
 * @desc    Get all tasks for a project
 * @route   GET /api/v1/projects/:id/tasks
 * @access  Private (Facilitator, PM, or assigned Trainee)
 */
export const getProjectTasks = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;
    const { assignedTo } = req.query;

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    // Access check
    if (userRole === 'Trainee') {
        const isAssigned = project.assignedTrainees.some(t => t.toString() === userId.toString());
        if (!isAssigned) {
            throw new ApiError(403, "You are not assigned to this project.");
        }
    } else {
        const hasAccess = await canManageTasks(userId, userRole, project);
        if (!hasAccess) {
            throw new ApiError(403, "You don't have access to this project.");
        }
    }

    const query = { project: id };
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await ProjectTask.find(query)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name')
        .populate('comments.user', 'name email')
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, tasks, "Tasks fetched successfully."));
});

/**
 * @desc    Get my tasks for a project (Trainee)
 * @route   GET /api/v1/projects/:id/my-tasks
 * @access  Private (Trainee)
 */
export const getMyTasks = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    const isAssigned = project.assignedTrainees.some(t => t.toString() === traineeId.toString());
    if (!isAssigned) {
        throw new ApiError(403, "You are not assigned to this project.");
    }

    const tasks = await ProjectTask.find({
        project: id,
        assignedTo: traineeId
    })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name')
    .populate('comments.user', 'name email')
    .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, tasks, "My tasks fetched successfully."));
});

/**
 * @desc    Update task completion percentage
 * @route   PATCH /api/v1/projects/tasks/:taskId/completion
 * @access  Private (assigned Trainee, Team Lead, Facilitator, PM)
 */
export const updateTaskCompletion = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { taskId } = req.params;
    const { completionPercentage, comment } = req.body;

    if (completionPercentage === undefined) {
        throw new ApiError(400, "Completion percentage is required.");
    }

    const task = await ProjectTask.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found.");
    }

    const project = await Project.findById(task.project);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    // Check access: assigned trainee, team lead, facilitator, or PM
    const isAssignee = task.assignedTo && task.assignedTo.toString() === userId.toString();
    const isTeamLead = project.teamLead && project.teamLead.toString() === userId.toString();

    if (!isAssignee && !isTeamLead) {
        if (userRole === 'Trainee') {
            throw new ApiError(403, "You can only update tasks assigned to you.");
        }
        const hasAccess = await canManageTasks(userId, userRole, project);
        if (!hasAccess) {
            throw new ApiError(403, "You don't have access to update this task.");
        }
    }

    task.completionPercentage = Math.min(100, Math.max(0, parseInt(completionPercentage)));

    if (comment && comment.trim()) {
        task.comments.push({
            user: userId,
            text: comment.trim(),
            completionPercentage: task.completionPercentage
        });
    }

    await task.save();

    const populated = await ProjectTask.findById(task._id)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name')
        .populate('comments.user', 'name email');

    return res.status(200).json(new ApiResponse(200, populated, "Task progress updated successfully."));
});

/**
 * @desc    Update task details (title, description, assignedTo, dueDate)
 * @route   PUT /api/v1/projects/tasks/:taskId
 * @access  Private (Team Lead, Facilitator, PM)
 */
export const updateTask = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { taskId } = req.params;
    const { title, description, assignedTo, dueDate } = req.body;

    const task = await ProjectTask.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found.");
    }

    const project = await Project.findById(task.project);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    const isAssignee = task.assignedTo && task.assignedTo.toString() === userId.toString();
    const hasAccess = await canManageTasks(userId, userRole, project);
    if (!hasAccess && !isAssignee) {
        throw new ApiError(403, "You are not authorized to edit this task.");
    }

    // Only team lead / facilitator / PM can reassign tasks
    if (assignedTo !== undefined && !hasAccess) {
        throw new ApiError(403, "Only team leads, facilitators, or program managers can reassign tasks.");
    }

    // Validate new assignee if changing
    if (assignedTo !== undefined) {
        const isAssigned = project.assignedTrainees.some(t => t.toString() === assignedTo);
        if (!isAssigned) {
            throw new ApiError(400, "The selected trainee is not assigned to this project.");
        }
        task.assignedTo = assignedTo;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate || undefined;

    await task.save();

    const populated = await ProjectTask.findById(task._id)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name')
        .populate('comments.user', 'name email');

    return res.status(200).json(new ApiResponse(200, populated, "Task updated successfully."));
});

/**
 * @desc    Delete a task (soft delete)
 * @route   DELETE /api/v1/projects/tasks/:taskId
 * @access  Private (Team Lead, Facilitator, PM)
 */
export const deleteTask = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { taskId } = req.params;

    const task = await ProjectTask.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found.");
    }

    const project = await Project.findById(task.project);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    const hasAccess = await canManageTasks(userId, userRole, project);
    if (!hasAccess) {
        throw new ApiError(403, "You are not authorized to delete this task.");
    }

    task.isDeleted = true;
    await task.save();

    return res.status(200).json(new ApiResponse(200, {}, "Task deleted successfully."));
});
