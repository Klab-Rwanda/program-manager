import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const commentSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['Hardware', 'Software', 'Network', 'Account', 'Other'],
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // IT Support user
    resolution: { type: String },
    comments: [commentSchema]
}, { timestamps: true });

ticketSchema.plugin(mongoosePaginate);

export const Ticket = mongoose.model('Ticket', ticketSchema);