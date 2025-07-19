import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true },
    timestamp: { type: Date, required: true },
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
        enum: ['present', 'absent', 'excused'],
        default: 'present'
    },
    reason: { type: String }, // Reason for excused absence
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who marked this?
    deviceInfo: { type: String }, // Store device information
    ipAddress: { type: String }
}, { timestamps: true });

// Ensure a user can only have one attendance record per session
attendanceSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
attendanceSchema.plugin(mongoosePaginate); 

export const Attendance = mongoose.model('Attendance', attendanceSchema);