import mongoose from 'mongoose';

const roadmapSchema = new mongoose.Schema({
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    facilitator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true },
    startDate: { type: Date, required: true },
    objectives: [{ type: String }],
    status: { 
        type: String, 
        enum: ['draft', 'pending_approval', 'approved', 'rejected'], 
        default: 'draft' 
    },
    feedback: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date }
}, { timestamps: true });

// Ensure a program can only have one roadmap for a specific week
roadmapSchema.index({ program: 1, weekNumber: 1 }, { unique: true });

export const Roadmap = mongoose.model('Roadmap', roadmapSchema);