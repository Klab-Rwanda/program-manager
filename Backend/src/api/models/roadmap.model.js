import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const topicSchema = new mongoose.Schema({
    day: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    topic: { type: String, required: true },
    duration: { type: String, default: '3 hours' },
    type: { type: String, enum: ['in-person', 'online'], default: 'in-person' },
});

const roadmapSchema = new mongoose.Schema({
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // Optional, can be program-level
    facilitator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true },
    startDate: { type: Date, required: true },
    objectives: [{ type: String }],
    topics: [topicSchema]
}, { timestamps: true });

roadmapSchema.plugin(mongoosePaginate);
roadmapSchema.index({ program: 1, weekNumber: 1 }, { unique: true }); // Ensure unique week per program

export const Roadmap = mongoose.model('Roadmap', roadmapSchema);