import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    // Using a unique key to ensure there's only ever one settings document
    singleton: {
        type: String,
        default: 'app-settings',
        unique: true,
    },
    // General Settings
    siteName: {
        type: String,
        default: 'KLab Program Manager',
    },
    siteLogoUrl: {
        type: String,
        default: '/logo.png', // Default logo path
    },
    // Program Settings
    defaultProgramDurationDays: {
        type: Number,
        default: 90, // e.g., 3 months
    },
    allowManagerProgramCreation: {
        type: Boolean,
        default: true,
    },
    // Notification Settings
    sendWelcomeEmail: {
        type: Boolean,
        default: true,
    },
    adminNotificationEmail: {
        type: String,
        trim: true,
        lowercase: true
    }
}, { timestamps: true });

export const Setting = mongoose.model('Setting', settingsSchema);