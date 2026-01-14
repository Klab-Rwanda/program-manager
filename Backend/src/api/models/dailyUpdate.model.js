import mongoose from 'mongoose';

const dailyUpdateSchema = new mongoose.Schema({
    trainee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    workDone: {
        type: String,
        required: [true, 'Please describe what you worked on today'],
        trim: true,
        maxlength: [1000, 'Work description cannot exceed 1000 characters']
    },
    challenges: {
        type: String,
        trim: true,
        maxlength: [500, 'Challenges description cannot exceed 500 characters']
    },
    learnings: {
        type: String,
        trim: true,
        maxlength: [500, 'Learnings description cannot exceed 500 characters']
    },
    isReviewed: {
        type: Boolean,
        default: false
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    reviewComment: {
        type: String,
        trim: true,
        maxlength: [500, 'Review comment cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Compound index to ensure one update per trainee per program per day
dailyUpdateSchema.index({ trainee: 1, program: 1, date: 1 }, { unique: true });

// Index for efficient querying
dailyUpdateSchema.index({ program: 1, date: -1 });
dailyUpdateSchema.index({ trainee: 1, date: -1 });

export const DailyUpdate = mongoose.model('DailyUpdate', dailyUpdateSchema);
