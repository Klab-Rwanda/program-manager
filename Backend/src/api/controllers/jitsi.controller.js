import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export const generateJitsiToken = asyncHandler(async (req, res) => {
    // Simply return success - no authentication needed for public Jitsi
    return res.status(200).json(
        new ApiResponse(200, {
            message: "Public Jitsi access - no token required",
            domain: "8x8.vc",
            roomName: req.params.roomName
        }, "Access granted")
    );
});