import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  message: { type: String, required: true },
  author: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const ticketSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, required: true },
  program: { type: String },
  description: { type: String, required: true },
  file: { type: String },
  submittedAt: { type: Date, default: Date.now },

  
  comments: [commentSchema],
});

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
