import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTrainees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    teamLead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Company information
    companyName: {
        type: String,
        trim: true,
        maxlength: [200, 'Company name cannot exceed 200 characters']
    },
    companyAddress: {
        type: String,
        trim: true,
        maxlength: [500, 'Company address cannot exceed 500 characters']
    },
    companyContactPerson: {
        type: String,
        trim: true,
        maxlength: [200, 'Contact person name cannot exceed 200 characters']
    },
    companyContactPhone: {
        type: String,
        trim: true,
        maxlength: [30, 'Contact phone number cannot exceed 30 characters']
    },
    // Optional description files
    files: [{
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['active', 'completed', 'on_hold'],
        default: 'active'
    },
    startDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Auto-filter deleted projects
projectSchema.pre(/^find/, function(next) {
    if (this.getQuery().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
    next();
});

// Indexes
projectSchema.index({ program: 1, status: 1 });
projectSchema.index({ assignedTrainees: 1 });
projectSchema.index({ createdBy: 1 });

export const Project = mongoose.model('Project', projectSchema);
