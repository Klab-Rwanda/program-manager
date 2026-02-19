import mongoose from 'mongoose';

const projectTaskSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    completionPercentage: {
        type: Number,
        default: 0,
        min: [0, 'Percentage cannot be less than 0'],
        max: [100, 'Percentage cannot exceed 100']
    },
    dueDate: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, 'Comment cannot exceed 500 characters']
        },
        completionPercentage: {
            type: Number,
            min: 0,
            max: 100
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Auto-filter deleted tasks
projectTaskSchema.pre(/^find/, function(next) {
    if (this.getQuery().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
    next();
});

// Indexes
projectTaskSchema.index({ project: 1, assignedTo: 1 });
projectTaskSchema.index({ project: 1, isDeleted: 1 });
projectTaskSchema.index({ assignedTo: 1 });

export const ProjectTask = mongoose.model('ProjectTask', projectTaskSchema);
