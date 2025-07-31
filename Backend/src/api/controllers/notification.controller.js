import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js'; // Ensure ApiError is imported
import { Notification } from '../models/notification.model.js';

export const getMyNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        lean: true,
    };

    const notifications = await Notification.paginate({ recipient: req.user._id }, options);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    
    const responseData = {
        ...notifications,
        unreadCount,
    };
    
    return res.status(200).json(new ApiResponse(200, responseData, "Notifications fetched."));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );
    // After marking all as read, the unread count is 0
    return res.status(200).json(new ApiResponse(200, { unreadCount: 0 }, "All notifications marked as read."));
});

// Renamed and modified to toggle read status
export const toggleNotificationReadStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isRead: newReadStatus } = req.body; // Expect new status in body, optional

    const notification = await Notification.findOne({ _id: id, recipient: req.user._id });
    if (!notification) {
        throw new ApiError(404, "Notification not found.");
    }

    // If newReadStatus is provided in body, use it. Otherwise, toggle current status.
    notification.isRead = (typeof newReadStatus === 'boolean') ? newReadStatus : !notification.isRead;
    
    await notification.save();

    // Recalculate unread count to return the most up-to-date value
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    return res.status(200).json(new ApiResponse(200, { notification, unreadCount }, "Notification status updated."));
});

// New function to delete a single notification
export const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({ _id: id, recipient: req.user._id });
    if (!notification) {
        throw new ApiError(404, "Notification not found or you don't have permission to delete it.");
    }

    // Recalculate unread count after deletion
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    return res.status(200).json(new ApiResponse(200, { unreadCount }, "Notification deleted successfully."));
});