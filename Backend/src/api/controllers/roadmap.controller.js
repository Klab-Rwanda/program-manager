import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Roadmap } from '../models/roadmap.model.js';
import { Topic } from '../models/topic.model.js';
import { Program } from '../models/program.model.js';

/**
 * @desc    Create a new weekly roadmap with its daily topics.
 * @route   POST /api/v1/roadmaps
 * @access  Private (Facilitator)
 */
export const createOrUpdateRoadmap = asyncHandler(async (req, res) => {
    const { program, weekNumber, title, startDate, objectives, topics } = req.body;
    const facilitatorId = req.user._id;

    // Verify facilitator is assigned to this program
    const programDoc = await Program.findOne({ _id: program, facilitators: facilitatorId });
    if (!programDoc) {
        throw new ApiError(403, "You are not authorized to manage the roadmap for this program.");
    }
    
    // --- THIS IS THE UPSERT LOGIC ---
    // Try to find an existing roadmap for this program and week.
    // If it exists, update it. If not, create a new one.
    const roadmapData = {
        program,
        weekNumber,
        title,
        startDate,
        objectives: objectives.split('\n').filter(o => o.trim() !== ''),
        facilitator: facilitatorId,
    };
    
    const roadmap = await Roadmap.findOneAndUpdate(
        { program: program, weekNumber: weekNumber }, // The unique key to find by
        { $set: roadmapData }, // The data to set on create or update
        { new: true, upsert: true, runValidators: true } // Options: return the new doc, create if not found
    );
    // --- END OF UPSERT LOGIC ---


    // Now, handle the topics. First, delete any old topics for this roadmap.
    await Topic.deleteMany({ roadmap: roadmap._id });

    // Then, insert the new topics.
    if (topics && topics.length > 0) {
        const topicDocs = topics
            .filter(topic => topic.title && topic.title.trim() !== '') // Only insert topics with a title
            .map(topic => ({
                ...topic,
                roadmap: roadmap._id,
            }));
        
        if (topicDocs.length > 0) {
            await Topic.insertMany(topicDocs);
        }
    }

    const fullRoadmap = await getFullRoadmapById(roadmap._id);
    const message = "Roadmap saved successfully.";
    
    return res.status(201).json(new ApiResponse(201, fullRoadmap, message));
});


const getFullRoadmapById = async (roadmapId) => {
    const roadmap = await Roadmap.findById(roadmapId).populate('program', 'name').lean();
    if (!roadmap) return null;
    const topics = await Topic.find({ roadmap: roadmapId }).sort({ createdAt: 1 });
    return { ...roadmap, topics };
};

/**
 * @desc    Get all roadmaps for the logged-in facilitator, populated with topics.
 * @route   GET /api/v1/roadmaps/my-roadmaps
 * @access  Private (Facilitator)
 */
export const getMyRoadmaps = asyncHandler(async (req, res) => {
    let programQuery = {};
    if (req.user.role === 'Facilitator') {
        programQuery = { facilitators: req.user._id };
    } else if (req.user.role === 'Trainee') {
        programQuery = { trainees: req.user._id };
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