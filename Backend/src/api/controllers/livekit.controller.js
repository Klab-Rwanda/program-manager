import { AccessToken } from 'livekit-server-sdk';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';


export const generateLiveKitToken = asyncHandler(async (req, res) => {
    const { roomName } = req.query;
    const user = req.user;

    if (!roomName) {
        throw new ApiError(400, "Room name is required.");
    }
    if (!user) {
        throw new ApiError(401, "User not authenticated.");
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new ApiError(500, "LiveKit service is not configured on the server.");
    }
    
    
    const at = new AccessToken(apiKey, apiSecret, {
        identity: user._id.toString(), // A unique ID for the user (e.g., MongoDB ObjectId)
        name: user.name,               // The display name that will appear in the call
    });

    // 2. Define the specific permissions for this user in this room.
    const permissions = {
        room: roomName,           // The specific room they are allowed to join
        roomJoin: true,           // Allow them to join the room
        canPublish: true,         // Allow them to publish their audio/video
        canSubscribe: true,       // Allow them to subscribe to others' audio/video
        canPublishData: true,     // Allow them to send data messages (like chat)
    };
    
    // 3. Add the grant (the set of permissions) to the token.
    at.addGrant(permissions);
    
    // 4. Generate the final JWT string.
    const token = at.toJwt();
    
    // --- END OF CORRECT IMPLEMENTATION ---

    return res.status(200).json(
        new ApiResponse(200, { token }, "LiveKit token generated successfully.")
    );
});