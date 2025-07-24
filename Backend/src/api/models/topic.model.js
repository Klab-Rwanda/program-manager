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
    duration: {
        type: String, // e.g., "3 hours"
        required: true
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