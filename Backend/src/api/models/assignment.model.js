import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    roadmap: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap',
        required: true
    },
    facilitator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    maxGrade: {
        type: Number,
        default: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sentToTrainees: {
        type: Boolean,
        default: false
    },
    sentToTraineesAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

assignmentSchema.plugin(mongoosePaginate);

export const Assignment = mongoose.model('Assignment', assignmentSchema);