// src/services/sessionReminder.service.js
import schedule from 'node-schedule';
import { User } from '../api/models/user.model.js';
import { ClassSession } from '../api/models/classSession.model.js';
import { Program } from '../api/models/program.model.js';
import { sendSessionReminderEmail } from './email.service.js';
import { createNotification } from './notification.service.js'; // For in-app notifications

/**
 * Schedules an email and in-app notification reminder for a session 10 minutes before its start time.
 * @param {Object} session - The session object from the database.
 * @param {string} session.title - Session title.
 * @param {Date} session.startTime - Session start time.
 * @param {string} session.sessionId - Unique ID for online session link.
 * @param {mongoose.Types.ObjectId} session.programId - Program ID.
 * @param {mongoose.Types.ObjectId} session.facilitatorId - Facilitator ID.
 */
export const scheduleSessionReminder = async (session) => {
    const reminderTime = new Date(session.startTime.getTime() - 10 * 60 * 1000); // 10 minutes before

    // Ensure the reminder is scheduled for a future time
    if (reminderTime < new Date()) {
        console.warn(`Session "${session.title}" is too close to start (${session.startTime}). Skipping reminder scheduling.`);
        return;
    }

    console.log(`Scheduling reminder for session "${session.title}" at ${reminderTime}`);

    schedule.scheduleJob(reminderTime, async () => {
        try {
            console.log(`Executing reminder for session "${session.title}"`);

            // Fetch populated program and facilitator details for the email/notification
            const populatedSession = await ClassSession.findById(session._id)
                                            .populate('programId', 'name trainees')
                                            .populate('facilitatorId', 'name');

            if (!populatedSession) {
                console.error(`Reminder job: Session ${session._id} not found.`);
                return;
            }

            // Get all trainees enrolled in this program
            const trainees = await User.find({ 
                _id: { $in: populatedSession.programId.trainees },
                role: 'Trainee'
            }).select('name email');

            if (trainees.length === 0) {
                console.log(`No trainees found for program ${populatedSession.programId.name}. Skipping reminder emails/notifications.`);
                return;
            }

            const sessionLink = populatedSession.type === 'online' 
                ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/classroom/${populatedSession.sessionId}`
                : `/dashboard/Trainee/Trattendance`; // For physical, direct them to their attendance page

            const emailPromises = [];
            const notificationPromises = [];

            for (const trainee of trainees) {
                // Send email reminder
                emailPromises.push(
                    sendSessionReminderEmail(
                        trainee.email,
                        trainee.name,
                        populatedSession.title,
                        populatedSession.programId.name,
                        populatedSession.startTime,
                        populatedSession.facilitatorId?.name || 'N/A',
                        sessionLink
                    )
                );

                // Send in-app notification
                notificationPromises.push(
                    createNotification({
                        recipient: trainee._id,
                        sender: populatedSession.facilitatorId._id,
                        title: `Session Starting Soon: ${populatedSession.title}`,
                        message: `Your session for "${populatedSession.programId.name}" starts in 10 minutes!`,
                        link: sessionLink,
                        type: 'info'
                    })
                );
            }

            await Promise.allSettled(emailPromises);
            await Promise.allSettled(notificationPromises);

            console.log(`Reminders sent for session "${session.title}" to ${trainees.length} trainees.`);

        } catch (error) {
            console.error(`Error in session reminder job for session "${session.title}":`, error);
        }
    });
};