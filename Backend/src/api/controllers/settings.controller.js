import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Setting } from '../models/setting.model.js';

/**
 * @desc    Get the current application settings. Creates default settings if none exist.
 * @route   GET /api/v1/settings
 * @access  Private (SuperAdmin)
 */
export const getSettings = asyncHandler(async (req, res) => {
    // Find the single settings document. If it doesn't exist, create it.
    let settings = await Setting.findOneAndUpdate(
        { singleton: 'app-settings' },
        { $setOnInsert: { singleton: 'app-settings' } },
        { upsert: true, new: true, runValidators: true }
    );
    return res.status(200).json(new ApiResponse(200, settings, "Settings fetched successfully."));
});

/**
 * @desc    Update application settings.
 * @route   PATCH /api/v1/settings
 * @access  Private (SuperAdmin)
 */
export const updateSettings = asyncHandler(async (req, res) => {
    const updates = req.body;
    
    // Find the single settings document and update it with the provided data.
    const settings = await Setting.findOneAndUpdate(
        { singleton: 'app-settings' },
        { $set: updates },
        { new: true, runValidators: true }
    );
    
    return res.status(200).json(new ApiResponse(200, settings, "Settings updated successfully."));
});