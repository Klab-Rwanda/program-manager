import mongoose from 'mongoose';

const classSessionSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['physical', 'online'], 
        required: true 
    },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    facilitatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true, unique: true }, // UUID for online sessions
    title: { type: String, required: true },
    description: { type: String },
    
    
    // Location for physical classes
   location: { 
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String },
        radius: { type: Number, default: 50 } // in meters
    },
    
    // Session timing
    startTime: { type: Date, required: true },
    duration: { type: Number, default: 120 },
    endTime: { type: Date },
    expiresAt: { type: Date }, // For QR code expiration
    
    // Access links
    accessLink: { type: String }, // For attendance marking by link click
    videoCallLink: { type: String }, 
     meetingLink: { type: String },
    qrCodeData: { type: String }, // QR code data for online sessions
    
    // Status
    status: { 
        type: String, 
        enum: ['scheduled', 'active', 'completed', 'cancelled'], 
        default: 'scheduled' 
    },
    
    // Attendance tracking
    totalExpected: { type: Number, default: 0 },
    totalPresent: { type: Number, default: 0 },
    totalAbsent: { type: Number, default: 0 },
    
    // Settings
    allowLateAttendance: { type: Boolean, default: true },
    lateThreshold: { type: Number, default: 15 }, // minutes
    
    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
   
}, { timestamps: true });

// Index for efficient queries
classSessionSchema.index({ programId: 1, startTime: -1 });
classSessionSchema.index({ sessionId: 1 });
classSessionSchema.index({ facilitatorId: 1, status: 1 });

export const ClassSession = mongoose.model('ClassSession', classSessionSchema);