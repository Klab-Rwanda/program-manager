import { ClassSession } from '../api/models/classSession.model.js';

/**
 * Finds active sessions whose duration has passed and updates their status to 'completed'.
 */
const completeExpiredSessions = async () => {
    console.log('Running scheduled job: Checking for expired sessions...');
    try {
        const now = new Date();
        
        // Find all 'active' sessions
        const activeSessions = await ClassSession.find({ status: 'active' });

        if (activeSessions.length === 0) {
            console.log('No active sessions to check.');
            return;
        }

        const sessionsToComplete = [];

        for (const session of activeSessions) {
            // Calculate the session's expected end time
            const startTime = new Date(session.startTime);
            const durationInMs = (session.duration || 120) * 60 * 1000; // Default to 120 mins if not set
            const endTime = new Date(startTime.getTime() + durationInMs);

            // If the current time is past the expected end time, mark for completion
            if (now > endTime) {
                sessionsToComplete.push(session._id);
            }
        }

        if (sessionsToComplete.length > 0) {
            const result = await ClassSession.updateMany(
                { _id: { $in: sessionsToComplete } },
                { $set: { status: 'completed' } }
            );
            console.log(`Successfully completed ${result.modifiedCount} expired sessions.`);
        } else {
            console.log('No sessions have expired yet.');
        }

    } catch (error) {
        console.error('Error in completeExpiredSessions job:', error);
    }
};


/**
 * Starts the cron job to run at a set interval.
 */
export const startCronJobs = () => {
    // Run the check every 5 minutes (300,000 milliseconds)
    setInterval(completeExpiredSessions, 300000); 
    
    // Run it once on server start as well
    completeExpiredSessions();
};