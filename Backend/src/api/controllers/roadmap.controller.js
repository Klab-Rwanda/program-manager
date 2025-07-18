import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Roadmap } from '../models/roadmap.model.js';
import { Program } from '../models/program.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

// Helper to verify facilitator manages the program
const verifyFacilitatorAccess = async (programId, facilitatorId) => {
    const program = await Program.findOne({ _id: programId, facilitators: facilitatorId });
    if (!program) {
        throw new ApiError(403, "Forbidden: You are not a facilitator for this program.");
    }
    return program;
};

export const createRoadmap = asyncHandler(async (req, res) => {
    const { program, weekNumber, title, startDate, objectives, topics } = req.body;
    const facilitatorId = req.user._id;

    await verifyFacilitatorAccess(program, facilitatorId);

    const roadmap = await Roadmap.create({
        program,
        weekNumber,
        title,
        startDate,
        objectives,
        topics,
        facilitator: facilitatorId
    });

    return res.status(201).json(new ApiResponse(201, roadmap, "Weekly roadmap created successfully."));
});

export const getRoadmapsForProgram = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const facilitatorId = req.user._id;

    await verifyFacilitatorAccess(programId, facilitatorId);
    
    const roadmaps = await Roadmap.find({ program: programId }).sort({ weekNumber: 1 });

    return res.status(200).json(new ApiResponse(200, roadmaps, "Roadmaps fetched successfully."));
});