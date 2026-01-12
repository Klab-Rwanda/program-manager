import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    targetAudience: {
        type: String,
        enum: ['all', 'trainees', 'facilitators'],
        default: 'all'
    },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date }, // Optional expiration date
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Track who has read
}, { timestamps: true });

// Index for efficient queries
announcementSchema.index({ program: 1, isActive: 1, createdAt: -1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);
