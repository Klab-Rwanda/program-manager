import { Notification } from '../api/models/notification.model.js';
import { io } from '../../index.js'; // Import the exported io instance

/**
 * Creates and saves a notification, then pushes it to the recipient via WebSocket.
 * @param {object} options
 * @param {string} options.recipient - The ObjectId of the user who should receive the notification.
 * @param {string} options.title - The title of the notification.
 * @param {string} options.message - The main content of the notification.
 * @param {string} [options.sender] - The ObjectId of the user who triggered the action.
 * @param {string} [options.link] - A URL for the user to click.
 * @param {'info'|'success'|'warning'|'error'|'approval'} [options.type='info'] - The type of notification.
 */
export const createNotification = async ({
    recipient,
    title,
    message,
    sender,
    link,
    type = 'info'
}) => {
    try {
        // 1. Save the notification to the database
        const notification = await Notification.create({
            recipient,
            sender,
            title,
            message,
            link,
            type,
        });

        // 2. Push the notification in real-time via WebSocket
        // We emit to a "room" named after the user's ID.
        // The frontend will need to listen in this room.
        io.to(recipient.toString()).emit('new_notification', notification);
        
        console.log(`Notification sent to user ${recipient}`);
        return notification;

    } catch (error) {
        console.error("Failed to create or send notification:", error);
    }
};