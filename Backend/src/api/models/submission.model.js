import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    assignment: { // NEW FIELD: Link directly to Assignment model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true }, // URL to the uploaded project file
    submittedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['Submitted', 'Reviewed', 'NeedsRevision', 'Graded'], // Added 'Graded' for clarity
        default: 'Submitted'
    },
    feedback: { type: String },
    grade: { type: mongoose.Schema.Types.Mixed } // Changed to Mixed to allow numbers/strings for grades
}, { timestamps: true });

export const Submission = mongoose.model('Submission', submissionSchema);