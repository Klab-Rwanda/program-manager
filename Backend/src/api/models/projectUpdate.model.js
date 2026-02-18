import mongoose from 'mongoose';

const projectUpdateSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    trainee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: [true, 'Please describe what you are going to work on today'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    completionPercentage: {
        type: Number,
        min: [0, 'Percentage cannot be less than 0'],
        max: [100, 'Percentage cannot exceed 100']
    },
    blockers: {
        type: String,
        trim: true,
        maxlength: [500, 'Blockers description cannot exceed 500 characters']
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

// One update per trainee per project per day
projectUpdateSchema.index({ project: 1, trainee: 1, date: 1 }, { unique: true });

// Efficient querying
projectUpdateSchema.index({ project: 1, date: -1 });
projectUpdateSchema.index({ trainee: 1, date: -1 });

export const ProjectUpdate = mongoose.model('ProjectUpdate', projectUpdateSchema);
