import mongoose from 'mongoose';

const roadmapSchema = new mongoose.Schema({
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: true
    },
    weekNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    objectives: {
        type: [String], // An array of objective strings
        default: []
    },
    facilitator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Ensure a program can only have one roadmap for a specific week
roadmapSchema.index({ program: 1, weekNumber: 1 }, { unique: true });

export const Roadmap = mongoose.model('Roadmap', roadmapSchema);