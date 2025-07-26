import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
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
    return res.status(200).json(new ApiResponse(200, { unreadCount: 0 }, "All notifications marked as read."));
});

export const markOneAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
        { _id: id, recipient: req.user._id },
        { $set: { isRead: true } },
        { new: true }
    );
    if (!notification) {
        throw new ApiError(404, "Notification not found.");
    }
    return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read."));
});