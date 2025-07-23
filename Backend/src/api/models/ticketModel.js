import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, required: true },
  program: { type: String },
  description: { type: String, required: true },
  file: { type: String }, // store filename or path
  submittedAt: { type: Date, default: Date.now },
});

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
