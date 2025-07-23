import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Roadmap } from '../models/roadmap.model.js';

// Create a new weekly plan
export const createWeekPlan = asyncHandler(async (req, res) => {
    const { program, weekNumber, title, startDate, objectives, topics } = req.body;
    if (!program || !weekNumber || !title || !startDate) {
        throw new ApiError(400, "Program, week number, title, and start date are required.");
    }

    const weekPlan = await Roadmap.create({
        program,
        weekNumber,
        title,
        startDate,
        objectives,
        topics
    });

    if (!weekPlan) {
        throw new ApiError(500, "Failed to create the weekly plan.");
    }

    return res.status(201).json(new ApiResponse(201, weekPlan, "Weekly plan created successfully."));
});

// Get all weekly plans for a specific program
export const getProgramRoadmap = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    if (!programId) {
        throw new ApiError(400, "Program ID is required.");
    }
    const roadmap = await Roadmap.find({ program: programId }).sort({ weekNumber: 'asc' });
    return res.status(200).json(new ApiResponse(200, roadmap, "Program roadmap fetched successfully."));
});

// Get a single weekly plan by ID
export const getWeekPlanById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new ApiError(400, "Week plan ID is required.");
    }
    
    const weekPlan = await Roadmap.findById(id);
    if (!weekPlan) {
        throw new ApiError(404, "Weekly plan not found.");
    }
    
    return res.status(200).json(new ApiResponse(200, weekPlan, "Weekly plan fetched successfully."));
});

// Update a weekly plan
export const updateWeekPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, startDate, objectives, topics } = req.body;
    
    if (!id) {
        throw new ApiError(400, "Week plan ID is required.");
    }
    
    const weekPlan = await Roadmap.findById(id);
    if (!weekPlan) {
        throw new ApiError(404, "Weekly plan not found.");
    }
    
    const updatedWeekPlan = await Roadmap.findByIdAndUpdate(
        id,
        {
            title,
            startDate,
            objectives,
            topics
        },
        { new: true }
    );
    
    return res.status(200).json(new ApiResponse(200, updatedWeekPlan, "Weekly plan updated successfully."));
});

// Delete a weekly plan
export const deleteWeekPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        throw new ApiError(400, "Week plan ID is required.");
    }
    
    const weekPlan = await Roadmap.findById(id);
    if (!weekPlan) {
        throw new ApiError(404, "Weekly plan not found.");
    }
    
    await Roadmap.findByIdAndDelete(id);
    
    return res.status(200).json(new ApiResponse(200, null, "Weekly plan deleted successfully."));
});

// Update topic completion status
export const updateTopicStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { topicIndex, completed } = req.body;
    
    if (!id) {
        throw new ApiError(400, "Week plan ID is required.");
    }
    
    if (topicIndex === undefined || completed === undefined) {
        throw new ApiError(400, "Topic index and completion status are required.");
    }
    
    const weekPlan = await Roadmap.findById(id);
    if (!weekPlan) {
        throw new ApiError(404, "Weekly plan not found.");
    }
    
    if (topicIndex < 0 || topicIndex >= weekPlan.topics.length) {
        throw new ApiError(400, "Invalid topic index.");
    }
    
    weekPlan.topics[topicIndex].completed = completed;
    await weekPlan.save();
    
    return res.status(200).json(new ApiResponse(200, weekPlan, "Topic status updated successfully."));
});

// Submit week plan for approval
export const submitForApproval = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        throw new ApiError(400, "Week plan ID is required.");
    }
    
    const weekPlan = await Roadmap.findById(id);
    if (!weekPlan) {
        throw new ApiError(404, "Weekly plan not found.");
    }
    
    weekPlan.status = 'pending_approval';
    await weekPlan.save();
    
    return res.status(200).json(new ApiResponse(200, weekPlan, "Week plan submitted for approval successfully."));
});

// Approve or reject week plan (Program Manager only)
export const approveWeekPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action, feedback } = req.body; // action: 'approve' or 'reject'
    
    if (!id) {
        throw new ApiError(400, "Week plan ID is required.");
    }
    
    if (!action || !['approve', 'reject'].includes(action)) {
        throw new ApiError(400, "Action must be 'approve' or 'reject'.");
    }
    
    const weekPlan = await Roadmap.findById(id);
    if (!weekPlan) {
        throw new ApiError(404, "Weekly plan not found.");
    }
    
    if (weekPlan.status !== 'pending_approval') {
        throw new ApiError(400, "Week plan is not pending approval.");
    }
    
    weekPlan.status = action === 'approve' ? 'approved' : 'rejected';
    weekPlan.feedback = feedback || '';
    
    if (action === 'approve') {
        weekPlan.approvedBy = req.user._id;
        weekPlan.approvedAt = new Date();
    }
    
    await weekPlan.save();
    
    return res.status(200).json(new ApiResponse(200, weekPlan, `Week plan ${action}d successfully.`));
});