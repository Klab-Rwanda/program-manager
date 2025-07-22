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