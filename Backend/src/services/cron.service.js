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


const markAbsentStudents = async () => {
    console.log('Running scheduled job: Marking absent students...');
    try {
        const now = new Date();
        // Find sessions that completed recently (e.g., in the last hour) and have not yet been processed for absenteeism
        // You'd need a field like 'absenteeismProcessed: Boolean' on ClassSession to avoid re-processing
        const recentlyCompletedSessions = await ClassSession.find({
            status: 'completed',
            endTime: { $lte: now, $gt: new Date(now.getTime() - 3600 * 1000) }, // Completed in last hour
            absenteeismProcessed: { $ne: true } // Assuming you add this field to ClassSession model
        }).populate('programId', 'trainees'); // Populate trainees from program

        if (recentlyCompletedSessions.length === 0) {
            console.log('No recently completed sessions to process for absenteeism.');
            return;
        }

        for (const session of recentlyCompletedSessions) {
            console.log(`Processing absenteeism for session: ${session.title} (ID: ${session._id})`);

            if (!session.programId || !session.programId.trainees || session.programId.trainees.length === 0) {
                console.log(`No trainees found for program ${session.programId?.name || session.programId._id}. Skipping absenteeism check.`);
                // Mark as processed anyway if no trainees
                await ClassSession.findByIdAndUpdate(session._id, { absenteeismProcessed: true });
                continue;
            }

            const enrolledTraineeIds = session.programId.trainees.map(t => t.toString());
            
            // Find attendance records for this session
            const attendedRecords = await Attendance.find({ sessionId: session._id }).select('userId');
            const attendedTraineeIds = new Set(attendedRecords.map(rec => rec.userId.toString()));

            const absentTraineeIds = enrolledTraineeIds.filter(id => !attendedTraineeIds.has(id));

            if (absentTraineeIds.length > 0) {
                const absentRecords = absentTraineeIds.map(traineeId => ({
                    userId: traineeId,
                    sessionId: session._id,
                    programId: session.programId._id,
                    date: new Date(session.startTime).toISOString().split('T')[0],
                    timestamp: new Date(), // When marked absent
                    method: 'system_absent', // New method type
                    status: 'Absent',
                    markedBy: null, // No specific user, marked by system
                    reason: 'Automatically marked absent (no check-in record)'
                }));

                // Use insertMany for efficiency
                await Attendance.insertMany(absentRecords, { ordered: false }) // ordered: false to continue on errors
                    .then(docs => console.log(`Marked ${docs.length} trainees absent for session ${session.title}.`))
                    .catch(err => console.error(`Error marking absent for session ${session.title}:`, err.message));
                
                // You might also want to send notifications to absent trainees
                const absentUsers = await User.find({ _id: { $in: absentTraineeIds } }).select('_id name');
                const notificationPromises = absentUsers.map(user =>
                    createNotification({
                        recipient: user._id,
                        sender: null, // System sender
                        title: `Attendance Status: Absent for ${session.title}`,
                        message: `You were marked absent for the session "${session.title}" in program "${session.programId.name}" on ${new Date(session.startTime).toLocaleDateString()}.`,
                        link: `/dashboard/Trainee/my-attendance-history`,
                        type: 'warning'
                    })
                );
                await Promise.allSettled(notificationPromises);
            } else {
                console.log(`All trainees attended session ${session.title}.`);
            }

            // Mark session as processed to prevent re-running
            await ClassSession.findByIdAndUpdate(session._id, { absenteeismProcessed: true });

        }
    } catch (error) {
        console.error('Error in markAbsentStudents cron job:', error);
    }
};
