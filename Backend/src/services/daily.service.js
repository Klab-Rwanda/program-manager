import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';

const dailyApi = axios.create({
    baseURL: process.env.DAILY_API_URL || 'https://api.daily.co/v1',
    headers: {
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
    }
});

/**
 * Creates a new room on Daily.co for a session.
 * @param {string} sessionId - The unique ID of our internal session.
 * @returns {Promise<string>} The URL of the newly created Daily.co room.
 */
export const createDailyRoom = async (sessionId) => {
    if (!process.env.DAILY_API_KEY) {
        throw new ApiError(500, "Daily.co API key is not configured on the server.");
    }
    
    try {
        const roomName = `klab-class-${sessionId}-${Date.now()}`;
        
        // --- THIS IS THE FIX ---
        // We are removing the 'enable_recording' property, which is not available on the free plan.
        const response = await dailyApi.post('/rooms', {
            name: roomName,
            privacy: 'public',
            properties: {
                exp: Math.floor(Date.now() / 1000) + (60 * 60 * 4), // Room expires in 4 hours
                enable_chat: true,
                enable_screenshare: true,
                // REMOVED: enable_recording: 'cloud' 
            }
        });
        // --- END OF FIX ---
        
        console.log("Daily.co room created successfully:", response.data.url);
        return response.data.url;

    } catch (error) {
        console.error("Error creating Daily.co room:", error.response?.data || error.message);
        throw new ApiError(500, 'Failed to create the video conference room.');
    }
};