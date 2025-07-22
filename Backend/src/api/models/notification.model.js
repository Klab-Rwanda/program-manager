import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: { // The user who will receive the notification
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error'],
        default: 'info'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    link: { // Optional: A URL to navigate to when the notification is clicked
        type: String
    }
}, { timestamps: true });

// Index for efficient querying of unread notifications for a user
notificationSchema.index({ user: 1, isRead: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);