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

    const userPrograms = await Program.find(programQuery).select('_id');
    if (userPrograms.length === 0) {
        return res.status(200).json(new ApiResponse(200, []));
    }
    const programIds = userPrograms.map(p => p._id);

    const roadmaps = await Roadmap.find({ program: { $in: programIds } })
        .populate('program', 'name')
        .sort({ startDate: 1 });
        
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