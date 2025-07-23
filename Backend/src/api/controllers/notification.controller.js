import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Notification } from '../models/notification.model.js';

// Get all unread notifications for the logged-in user

const getUnreadNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({
        user: req.user._id, // <--- THE BUG IS LIKELY HERE
        isRead: false
    }).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, notifications, "Unread notifications fetched successfully."));
});
// Mark all notifications as read for the logged-in user
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    return res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read."));
});

export { getUnreadNotifications, markAllAsRead };