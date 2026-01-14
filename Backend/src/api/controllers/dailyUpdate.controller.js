import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { DailyUpdate } from '../models/dailyUpdate.model.js';
import { Program } from '../models/program.model.js';

/**
 * Helper to get start of day in UTC
 */
const getStartOfDay = (date) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

/**
 * Helper to check if update is within 24 hours (editable)
 */
const isEditable = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours < 24;
};

/**
 * @desc    Create a daily update (Trainee)
 * @route   POST /api/v1/daily-updates
 * @access  Private (Trainee)
 */
export const createDailyUpdate = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;
    const { program, workDone, challenges, learnings } = req.body;

    if (!program || !workDone) {
        throw new ApiError(400, "Program and 'What did you work on today?' are required.");
    }

    // Verify trainee is enrolled in this program
    const programDoc = await Program.findOne({ _id: program, trainees: traineeId });
    if (!programDoc) {
        throw new ApiError(403, "You are not enrolled in this program.");
    }

    // Get today's date (start of day)
    const today = getStartOfDay(new Date());

    // Check if trainee already submitted an update for today for this program
    const existingUpdate = await DailyUpdate.findOne({
        trainee: traineeId,
        program: program,
        date: today
    });

    if (existingUpdate) {
        throw new ApiError(400, "You have already submitted a daily update for today. You can edit it if it's within 24 hours.");
    }

    const dailyUpdate = await DailyUpdate.create({
        trainee: traineeId,
        program,
        date: today,
        workDone,
        challenges: challenges || '',
        learnings: learnings || ''
    });

    const populatedUpdate = await DailyUpdate.findById(dailyUpdate._id)
        .populate('trainee', 'name email')
        .populate('program', 'name');

    return res.status(201).json(new ApiResponse(201, populatedUpdate, "Daily update submitted successfully."));
});

/**
 * @desc    Update a daily update (Trainee - only within 24 hours)
 * @route   PUT /api/v1/daily-updates/:id
 * @access  Private (Trainee)
 */
export const updateDailyUpdate = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;
    const { id } = req.params;
    const { workDone, challenges, learnings } = req.body;

    const dailyUpdate = await DailyUpdate.findOne({ _id: id, trainee: traineeId });
    if (!dailyUpdate) {
        throw new ApiError(404, "Daily update not found or you don't have permission.");
    }

    // Check if within 24 hours
    if (!isEditable(dailyUpdate.createdAt)) {
        throw new ApiError(403, "You can only edit updates within 24 hours of submission.");
    }

    if (workDone) dailyUpdate.workDone = workDone;
    if (challenges !== undefined) dailyUpdate.challenges = challenges;
    if (learnings !== undefined) dailyUpdate.learnings = learnings;

    await dailyUpdate.save();

    const populatedUpdate = await DailyUpdate.findById(dailyUpdate._id)
        .populate('trainee', 'name email')
        .populate('program', 'name');

    return res.status(200).json(new ApiResponse(200, populatedUpdate, "Daily update updated successfully."));
});

/**
 * @desc    Get my daily updates (Trainee)
 * @route   GET /api/v1/daily-updates/my-updates
 * @access  Private (Trainee)
 */
export const getMyDailyUpdates = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;
    const { program, startDate, endDate, limit = 30 } = req.query;

    const query = { trainee: traineeId };

    if (program) {
        query.program = program;
    }

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = getStartOfDay(startDate);
        if (endDate) query.date.$lte = getStartOfDay(endDate);
    }

    const updates = await DailyUpdate.find(query)
        .populate('trainee', 'name email')
        .populate('program', 'name')
        .populate('reviewedBy', 'name')
        .sort({ date: -1 })
        .limit(parseInt(limit));

    // Add isEditable flag to each update
    const updatesWithEditableFlag = updates.map(update => ({
        ...update.toObject(),
        isEditable: isEditable(update.createdAt)
    }));

    return res.status(200).json(new ApiResponse(200, updatesWithEditableFlag, "Daily updates fetched successfully."));
});

/**
 * @desc    Get today's update for a specific program (Trainee)
 * @route   GET /api/v1/daily-updates/today/:programId
 * @access  Private (Trainee)
 */
export const getTodayUpdate = asyncHandler(async (req, res) => {
    const traineeId = req.user._id;
    const { programId } = req.params;

    const today = getStartOfDay(new Date());

    const update = await DailyUpdate.findOne({
        trainee: traineeId,
        program: programId,
        date: today
    })
    .populate('trainee', 'name email')
    .populate('program', 'name');

    if (update) {
        return res.status(200).json(new ApiResponse(200, {
            ...update.toObject(),
            isEditable: isEditable(update.createdAt)
        }, "Today's update found."));
    }

    return res.status(200).json(new ApiResponse(200, null, "No update for today yet."));
});

/**
 * @desc    Get all daily updates for programs (Facilitator/PM)
 * @route   GET /api/v1/daily-updates
 * @access  Private (Facilitator, Program Manager)
 */
export const getAllDailyUpdates = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { program, trainee, startDate, endDate, isReviewed, limit = 50, page = 1 } = req.query;

    // Get programs based on role
    let programIds = [];

    if (userRole === 'Program Manager') {
        const programs = await Program.find({ programManager: userId }).select('_id');
        programIds = programs.map(p => p._id);
    } else if (userRole === 'Facilitator') {
        const programs = await Program.find({ facilitators: userId }).select('_id');
        programIds = programs.map(p => p._id);
    } else {
        throw new ApiError(403, "Not authorized to view daily updates.");
    }

    if (programIds.length === 0) {
        return res.status(200).json(new ApiResponse(200, { updates: [], total: 0, page: 1, totalPages: 0 }, "No programs found."));
    }

    const query = { program: { $in: programIds } };

    // Apply filters
    if (program && programIds.map(p => p.toString()).includes(program)) {
        query.program = program;
    }

    if (trainee) {
        query.trainee = trainee;
    }

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = getStartOfDay(startDate);
        if (endDate) query.date.$lte = getStartOfDay(endDate);
    }

    if (isReviewed !== undefined) {
        query.isReviewed = isReviewed === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await DailyUpdate.countDocuments(query);

    const updates = await DailyUpdate.find(query)
        .populate('trainee', 'name email')
        .populate('program', 'name')
        .populate('reviewedBy', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    return res.status(200).json(new ApiResponse(200, {
        updates,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
    }, "Daily updates fetched successfully."));
});

/**
 * @desc    Mark update as reviewed / add comment (Facilitator/PM)
 * @route   PATCH /api/v1/daily-updates/:id/review
 * @access  Private (Facilitator, Program Manager)
 */
export const reviewDailyUpdate = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;
    const { reviewComment } = req.body;

    const dailyUpdate = await DailyUpdate.findById(id).populate('program');
    if (!dailyUpdate) {
        throw new ApiError(404, "Daily update not found.");
    }

    // Verify user has access to this program
    const programId = dailyUpdate.program._id;
    let hasAccess = false;

    if (userRole === 'Program Manager') {
        const program = await Program.findOne({ _id: programId, programManager: userId });
        hasAccess = !!program;
    } else if (userRole === 'Facilitator') {
        const program = await Program.findOne({ _id: programId, facilitators: userId });
        hasAccess = !!program;
    }

    if (!hasAccess) {
        throw new ApiError(403, "You don't have access to review this update.");
    }

    dailyUpdate.isReviewed = true;
    dailyUpdate.reviewedBy = userId;
    dailyUpdate.reviewedAt = new Date();
    if (reviewComment) {
        dailyUpdate.reviewComment = reviewComment;
    }

    await dailyUpdate.save();

    const populatedUpdate = await DailyUpdate.findById(dailyUpdate._id)
        .populate('trainee', 'name email')
        .populate('program', 'name')
        .populate('reviewedBy', 'name');

    return res.status(200).json(new ApiResponse(200, populatedUpdate, "Update marked as reviewed."));
});

/**
 * @desc    Get trainees for a program (for filter dropdown)
 * @route   GET /api/v1/daily-updates/trainees/:programId
 * @access  Private (Facilitator, Program Manager)
 */
export const getTraineesForProgram = asyncHandler(async (req, res) => {
    const { programId } = req.params;

    const program = await Program.findById(programId)
        .populate('trainees', 'name email');

    if (!program) {
        throw new ApiError(404, "Program not found.");
    }

    return res.status(200).json(new ApiResponse(200, program.trainees || [], "Trainees fetched successfully."));
});

/**
 * @desc    Get today's submission status for all trainees (Facilitator/PM)
 * @route   GET /api/v1/daily-updates/today-status/:programId
 * @access  Private (Facilitator, Program Manager)
 */
export const getTodaySubmissionStatus = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { programId } = req.params;

    // Verify user has access to this program
    let hasAccess = false;
    if (userRole === 'Program Manager') {
        const program = await Program.findOne({ _id: programId, programManager: userId });
        hasAccess = !!program;
    } else if (userRole === 'Facilitator') {
        const program = await Program.findOne({ _id: programId, facilitators: userId });
        hasAccess = !!program;
    }

    if (!hasAccess) {
        throw new ApiError(403, "You don't have access to this program.");
    }

    // Get all trainees in the program
    const program = await Program.findById(programId)
        .populate('trainees', 'name email');

    if (!program) {
        throw new ApiError(404, "Program not found.");
    }

    const allTrainees = program.trainees || [];
    const today = getStartOfDay(new Date());

    // Get today's updates for this program
    const todayUpdates = await DailyUpdate.find({
        program: programId,
        date: today
    }).populate('trainee', 'name email');

    // Create a map of trainee IDs who submitted
    const submittedTraineeIds = new Set(
        todayUpdates.map(update => update.trainee._id.toString())
    );

    // Build the status list
    const traineeStatuses = allTrainees.map(trainee => {
        const hasSubmitted = submittedTraineeIds.has(trainee._id.toString());
        const update = todayUpdates.find(u => u.trainee._id.toString() === trainee._id.toString());

        return {
            trainee: {
                _id: trainee._id,
                name: trainee.name,
                email: trainee.email
            },
            hasSubmitted,
            update: hasSubmitted ? {
                _id: update._id,
                workDone: update.workDone,
                isReviewed: update.isReviewed,
                createdAt: update.createdAt
            } : null
        };
    });

    // Sort: not submitted first, then by name
    traineeStatuses.sort((a, b) => {
        if (a.hasSubmitted === b.hasSubmitted) {
            return a.trainee.name.localeCompare(b.trainee.name);
        }
        return a.hasSubmitted ? 1 : -1;
    });

    const submittedCount = traineeStatuses.filter(t => t.hasSubmitted).length;
    const notSubmittedCount = traineeStatuses.filter(t => !t.hasSubmitted).length;

    return res.status(200).json(new ApiResponse(200, {
        date: today,
        program: {
            _id: program._id,
            name: program.name
        },
        totalTrainees: allTrainees.length,
        submittedCount,
        notSubmittedCount,
        trainees: traineeStatuses
    }, "Today's submission status fetched successfully."));
});

/**
 * @desc    Export daily updates to CSV (Facilitator/PM)
 * @route   GET /api/v1/daily-updates/export
 * @access  Private (Facilitator, Program Manager)
 */
export const exportDailyUpdates = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { program, startDate, endDate } = req.query;

    // Get programs based on role
    let programQuery = {};
    if (userRole === 'Program Manager') {
        programQuery = { programManager: userId };
    } else if (userRole === 'Facilitator') {
        programQuery = { facilitators: userId };
    } else {
        throw new ApiError(403, "Not authorized to export daily updates.");
    }

    // If specific program is selected, filter by it
    if (program) {
        programQuery._id = program;
    }

    const programs = await Program.find(programQuery)
        .populate('trainees', 'name email')
        .select('_id name trainees');

    if (programs.length === 0) {
        throw new ApiError(404, "No programs found.");
    }

    // Determine date range
    let dateStart, dateEnd;
    if (startDate) {
        dateStart = getStartOfDay(startDate);
    } else {
        // Default to 30 days ago if no start date
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateStart = getStartOfDay(thirtyDaysAgo);
    }

    if (endDate) {
        dateEnd = getStartOfDay(endDate);
    } else {
        dateEnd = getStartOfDay(new Date());
    }

    // Get all updates in the date range for these programs
    const programIds = programs.map(p => p._id);
    const updates = await DailyUpdate.find({
        program: { $in: programIds },
        date: { $gte: dateStart, $lte: dateEnd }
    })
    .populate('trainee', 'name email')
    .populate('program', 'name')
    .populate('reviewedBy', 'name');

    // Create a map for quick lookup: programId -> date -> traineeId -> update
    const updateMap = new Map();
    updates.forEach(update => {
        const programId = update.program._id.toString();
        const dateKey = update.date.toISOString().split('T')[0];
        const traineeId = update.trainee._id.toString();

        if (!updateMap.has(programId)) {
            updateMap.set(programId, new Map());
        }
        if (!updateMap.get(programId).has(dateKey)) {
            updateMap.get(programId).set(dateKey, new Map());
        }
        updateMap.get(programId).get(dateKey).set(traineeId, update);
    });

    // Generate all dates in range
    const dates = [];
    const currentDate = new Date(dateStart);
    while (currentDate <= dateEnd) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate CSV
    const csvRows = [];

    // Header row
    csvRows.push([
        'Date',
        'Trainee Name',
        'Trainee Email',
        'Program',
        'Submitted',
        'What They Worked On',
        'Challenges',
        'What They Learned',
        'Reviewed',
        'Reviewed By',
        'Review Comment',
        'Submitted At'
    ].join(','));

    // For each program, for each date, for each trainee - create a row
    programs.forEach(prog => {
        const trainees = prog.trainees || [];

        dates.forEach(date => {
            const dateKey = date.toISOString().split('T')[0];
            const dateDisplay = date.toLocaleDateString();

            trainees.forEach(trainee => {
                const traineeId = trainee._id.toString();
                const update = updateMap.get(prog._id.toString())?.get(dateKey)?.get(traineeId);

                if (update) {
                    // Trainee submitted for this date
                    const row = [
                        dateDisplay,
                        `"${(trainee.name || 'N/A').replace(/"/g, '""')}"`,
                        trainee.email || 'N/A',
                        `"${(prog.name || 'N/A').replace(/"/g, '""')}"`,
                        'Yes',
                        `"${(update.workDone || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                        `"${(update.challenges || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                        `"${(update.learnings || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                        update.isReviewed ? 'Yes' : 'No',
                        `"${(update.reviewedBy?.name || '').replace(/"/g, '""')}"`,
                        `"${(update.reviewComment || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                        new Date(update.createdAt).toLocaleString()
                    ];
                    csvRows.push(row.join(','));
                } else {
                    // Trainee did NOT submit for this date - blank row
                    const row = [
                        dateDisplay,
                        `"${(trainee.name || 'N/A').replace(/"/g, '""')}"`,
                        trainee.email || 'N/A',
                        `"${(prog.name || 'N/A').replace(/"/g, '""')}"`,
                        'No',
                        '', // workDone
                        '', // challenges
                        '', // learnings
                        '', // reviewed
                        '', // reviewedBy
                        '', // reviewComment
                        ''  // submittedAt
                    ];
                    csvRows.push(row.join(','));
                }
            });
        });
    });

    const csvContent = csvRows.join('\n');

    // Set response headers for file download
    const filename = `daily-updates-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(csvContent);
});
