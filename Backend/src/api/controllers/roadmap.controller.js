import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Roadmap } from '../models/roadmap.model.js';
import { Topic } from '../models/topic.model.js';
import { Program } from '../models/program.model.js';

/**
 * @desc    Create or update a weekly roadmap and its topics
 * @route   POST /api/v1/roadmap
 * @access  Private (Facilitator)
 */
export const createWeekPlan = asyncHandler(async (req, res) => {
    const { program, weekNumber, title, startDate, objectives, topics } = req.body;
    const facilitatorId = req.user._id;

    const programDoc = await Program.findOne({ _id: program, facilitators: facilitatorId });
    if (!programDoc) {
        throw new ApiError(403, "You are not authorized to manage the roadmap for this program.");
    }

    const roadmapData = {
        program,
        weekNumber,
        title,
        startDate,
        objectives: objectives.split('\n').filter(o => o.trim() !== ''),
        facilitator: facilitatorId,
    };

    const roadmap = await Roadmap.findOneAndUpdate(
        { program, weekNumber },
        { $set: roadmapData },
        { new: true, upsert: true, runValidators: true }
    );

    await Topic.deleteMany({ roadmap: roadmap._id });

    if (topics && topics.length > 0) {
        const topicDocs = topics
            .filter(topic => topic.title?.trim())
            .map(topic => ({
                ...topic,
                roadmap: roadmap._id,
            }));

        if (topicDocs.length > 0) {
            await Topic.insertMany(topicDocs);
        }
    }

    const fullRoadmap = await getFullRoadmapById(roadmap._id);
    return res.status(201).json(new ApiResponse(201, fullRoadmap, "Roadmap saved successfully."));
});

const getFullRoadmapById = async (roadmapId) => {
    const roadmap = await Roadmap.findById(roadmapId).populate('program', 'name').lean();
    if (!roadmap) return null;
    const topics = await Topic.find({ roadmap: roadmapId }).sort({ createdAt: 1 });
    return { ...roadmap, topics };
};

/**
 * @desc Get all roadmaps for the logged-in facilitator
 * @route GET /api/v1/roadmap/:programId
 */
export const getProgramRoadmap = asyncHandler(async (req, res) => {
    const { programId } = req.params;

    if (!programId) {
        throw new ApiError(400, "Program ID is required.");
    }

    const roadmap = await Roadmap.find({ program: programId }).sort({ weekNumber: 1 });
    return res.status(200).json(new ApiResponse(200, roadmap, "Program roadmap fetched successfully."));
});

/**
 * @desc Get a single weekly plan by ID
 * @route GET /api/v1/roadmap/week/:id
 */
export const getWeekPlanById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const weekPlan = await Roadmap.findById(id);
    if (!weekPlan) throw new ApiError(404, "Weekly plan not found.");
    return res.status(200).json(new ApiResponse(200, weekPlan, "Weekly plan fetched successfully."));
});

/**
 * @desc Update a weekly plan
 * @route PUT /api/v1/roadmap/week/:id
 */
export const updateWeekPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, startDate, objectives } = req.body;

    const weekPlan = await Roadmap.findById(id);
    if (!weekPlan) throw new ApiError(404, "Weekly plan not found.");

    weekPlan.title = title || weekPlan.title;
    weekPlan.startDate = startDate || weekPlan.startDate;
    weekPlan.objectives = objectives || weekPlan.objectives;

    await weekPlan.save();
    return res.status(200).json(new ApiResponse(200, weekPlan, "Weekly plan updated successfully."));
});

/**
 * @desc Delete a weekly plan
 * @route DELETE /api/v1/roadmap/week/:id
 */
export const deleteWeekPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const weekPlan = await Roadmap.findById(id);
    if (!weekPlan) throw new ApiError(404, "Weekly plan not found.");
    await Roadmap.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, null, "Weekly plan deleted successfully."));
});

/**
 * @desc Update topic status (if embedded, else this needs new logic)
 * @route PATCH /api/v1/roadmap/week/:id/topic-status
 */
export const updateTopicStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { topicId, completed } = req.body;

    const topic = await Topic.findOne({ _id: topicId, roadmap: id });
    if (!topic) throw new ApiError(404, "Topic not found.");

    topic.isCompleted = completed;
    await topic.save();

    return res.status(200).json(new ApiResponse(200, topic, "Topic status updated successfully."));
});

/**
 * @desc Submit roadmap for approval
 * @route POST /api/v1/roadmap/week/:id/submit
 */
export const submitForApproval = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const weekPlan = await Roadmap.findById(id);
    if (!weekPlan) throw new ApiError(404, "Weekly plan not found.");

    weekPlan.status = 'pending_approval';
    await weekPlan.save();

    return res.status(200).json(new ApiResponse(200, weekPlan, "Week plan submitted for approval successfully."));
});

/**
 * @desc Approve or reject a roadmap
 * @route POST /api/v1/roadmap/week/:id/approve
 */
export const approveWeekPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action, feedback } = req.body;

    if (!['approve', 'reject'].includes(action)) {
        throw new ApiError(400, "Action must be either 'approve' or 'reject'.");
    }

    const weekPlan = await Roadmap.findById(id);
    if (!weekPlan) throw new ApiError(404, "Weekly plan not found.");
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
