import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    facilitator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contentUrl: { type: String, required: true }, // URL to the uploaded document
    type: { type: String }, // File type (pdf, mp4, etc.)
    status: {
        type: String,
        enum: ['Draft', 'PendingApproval', 'Approved', 'Rejected'], 
        default: 'Draft' ,
        rejectionReason: { type: String }
    }
     
}, { timestamps: true });

export const Course = mongoose.model('Course', courseSchema);