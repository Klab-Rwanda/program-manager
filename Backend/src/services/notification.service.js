import { Notification } from '../api/models/notification.model.js';

/**
 * Creates a new notification for a user.
 * @param {object} options - The notification details.
 * @param {string} options.userId - The ID of the user to notify.
 * @param {string} options.title - The title of the notification.
 * @param {string} options.message - The notification message.
 * @param {string} [options.type='info'] - The type of notification.
 * @param {string} [options.link] - An optional link for the notification.
 */
export const createNotification = async ({ userId, title, message, type = 'info', link }) => {
    try {
        if (!userId || !title || !message) {
            console.warn("Missing required fields for notification creation.");
            return;
        }
        await Notification.create({
            user: userId,
            title,
            message,
            type,
            link
        });
    } catch (error) {
        // We don't want a notification failure to crash the main operation.
        console.error("Failed to create notification:", error);
    }
};