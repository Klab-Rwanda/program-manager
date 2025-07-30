import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const attendanceSchema = new mongoose.Schema({
    // --- The key relationships ---
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true },
    
    // --- Redundant but useful for quick queries without populating ---
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD format

    // --- The actual attendance data ---
    timestamp: { type: Date, required: true }, // The moment attendance was marked
    checkIn: { type: Date }, // Can be used for check-in/out systems
    checkOut: { type: Date },

    location: { 
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
    reason: { type: String },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deviceInfo: { type: String },
    ipAddress: { type: String }
}, { timestamps: true });

// --- THE CRITICAL FIX: Revert unique index to sessionId ---
attendanceSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
// --- END OF FIX ---

attendanceSchema.plugin(mongoosePaginate); 

export const Attendance = mongoose.model('Attendance', attendanceSchema);