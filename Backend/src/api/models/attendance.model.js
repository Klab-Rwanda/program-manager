import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true },
    
    // The date of the attendance record in YYYY-MM-DD format
    date: { type: String, required: true },

    timestamp: { type: Date, required: true }, // General timestamp of the action
    checkIn: { type: Date },
    checkOut: { type: Date },

    locationCheckIn: { 
        lat: { type: Number },
        lng: { type: Number }
    },
    locationCheckOut: {
        lat: { type: Number },
        lng: { type: Number }
    },
    method: { 
        type: String, 
        enum: ['geolocation', 'qr_code', 'manual'], 
        required: true 
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Excused', 'Late'],
        default: 'Present'
    },
    reason: { type: String }, // For excused absence
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deviceInfo: { type: String },
    ipAddress: { type: String }
}, { timestamps: true });

// --- THIS IS THE CRITICAL INDEX THAT WAS CAUSING THE DUPLICATE KEY ERROR ---
// It ensures one user can only have one attendance document per program per day.
attendanceSchema.index({ userId: 1, programId: 1, date: 1 }, { unique: true });

// We can keep the old index for session-specific queries if needed, but it should not be unique.
attendanceSchema.index({ userId: 1, sessionId: 1 });

attendanceSchema.plugin(mongoosePaginate); 

export const Attendance = mongoose.model('Attendance', attendanceSchema);