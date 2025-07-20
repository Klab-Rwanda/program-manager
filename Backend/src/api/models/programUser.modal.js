import mongoose from 'mongoose';

const programUserSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
  role: { type: String },
  finalScore: Number,
  attendanceRate: Number,
  isEligible: Boolean,
  completionDate: Date
});

export const ProgramUser = mongoose.model('ProgramUser', programUserSchema);
