import mongoose from 'mongoose';

const certificateTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    // Visual style preferences (frontend interpretation)
    style: {
        type: String,
        enum: ['professional', 'modern', 'classic', 'minimalist'],
        default: 'professional'
    },
    colorScheme: {
        type: String,
        enum: ['blue', 'gray', 'black', 'green', 'purple', 'red'], // Extend as needed
        default: 'blue'
    },
    // HTML content for highly customizable templates (optional)
    htmlContent: {
        type: String,
        default: '' // Can store a full HTML template string
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Who created this template (e.g., SuperAdmin, Program Manager)
    }
}, { timestamps: true });

// Ensure only one default template can exist at a time
certificateTemplateSchema.pre('save', async function (next) {
    if (this.isModified('isDefault') && this.isDefault) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isDefault: true },
            { $set: { isDefault: false } }
        );
    }
    next();
});

certificateTemplateSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.isDefault === true) {
        // Unset isDefault for all other documents before setting it for this one
        await this.model.updateMany(
            { isDefault: true, _id: { $ne: this.getQuery()._id } }, // Use getQuery()._id for findOneAndUpdate
            { $set: { isDefault: false } }
        );
    }
    next();
});

export const CertificateTemplate = mongoose.model('CertificateTemplate', certificateTemplateSchema);