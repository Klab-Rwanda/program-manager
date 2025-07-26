import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
    roadmap: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap',
        required: true
    },
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    startTime: {
        type: String, // e.g., "09:00"
        required: false
    },
    endTime: {
        type: String, // e.g., "12:00"
        required: false
    },
    duration: {
        type: String, // e.g., "3 hours" - kept for backward compatibility
        required: false
    },
    sessionType: {
        type: String,
        enum: ['in-person', 'online'],
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const Topic = mongoose.model('Topic', topicSchema);