import mongoose from 'mongoose';

const dailyTopicSchema = new mongoose.Schema({
    day: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    topic: { type: String, required: true },
    duration: { type: String },
    type: { type: String, enum: ['in-person', 'online'], default: 'in-person' },
    completed: { type: Boolean, default: false }
});

const roadmapSchema = new mongoose.Schema({
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true },
    startDate: { type: Date, required: true },
    objectives: [{ type: String }],
    topics: [dailyTopicSchema]
}, { timestamps: true });

// Ensure a program can only have one plan per week number
roadmapSchema.index({ program: 1, weekNumber: 1 }, { unique: true });

export const Roadmap = mongoose.model('Roadmap', roadmapSchema);