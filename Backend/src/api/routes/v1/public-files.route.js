// Create a new route: src/api/routes/v1/public-files.route.js
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { Router } from 'express';

const router = Router();

// Store for temporary access tokens (in production, use Redis or database)
const tempTokenStore = new Map();

/**
 * @desc    Serves a file publicly using a temporary signed URL
 * @route   GET /api/v1/public-files/serve?token=signed_url_token
 * @access  Public (but requires valid signed token)
 */
router.route('/serve').get(asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
        throw new ApiError(400, "Access token is required.");
    }

    // Verify the temporary token
    const tokenData = tempTokenStore.get(token);
    if (!tokenData) {
        throw new ApiError(401, "Invalid or expired access token.");
    }

    // Check if token has expired (tokens valid for 1 hour)
    if (Date.now() > tokenData.expiresAt) {
        tempTokenStore.delete(token);
        throw new ApiError(401, "Access token has expired.");
    }

    const { filePath } = tokenData;

    // Construct the absolute path for the base uploads directory
    const baseUploadsDir = path.resolve('./public/uploads');
    const finalAbsoluteFilePath = path.join(baseUploadsDir, filePath);

    // Security check: Ensure the resolved path is actually within the designated uploads directory
    if (!finalAbsoluteFilePath.startsWith(baseUploadsDir)) {
        throw new ApiError(403, "Forbidden: Invalid file path or outside allowed directory.");
    }

    // Check if file exists
    if (!fs.existsSync(finalAbsoluteFilePath)) {
        throw new ApiError(404, "File not found on server.");
    }

    // Determine content type based on file extension
    const fileExtension = path.extname(finalAbsoluteFilePath).toLowerCase();
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv',
        '.flv': 'video/x-flv',
        '.webm': 'video/webm',
        '.mkv': 'video/x-matroska',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.txt': 'text/plain',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.tar': 'application/x-tar',
        '.gz': 'application/gzip',
        '.7z': 'application/x-7z-compressed'
    };
    
    let contentType = mimeTypes[fileExtension] || 'application/octet-stream';

    // Set headers for inline viewing
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(finalAbsoluteFilePath)}"`);
    
    // Add CORS headers to allow iframe embedding
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");

    // Stream the file
    const fileStream = fs.createReadStream(finalAbsoluteFilePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
        console.error('File stream error:', err);
        if (!res.headersSent) {
            res.status(500).send('Failed to serve file.');
        }
    });

    fileStream.on('end', () => {
        // Optional: Remove token after use for single-use URLs
        // tempTokenStore.delete(token);
    });
}));

// Helper function to generate signed URLs (call this from your protected routes)
export const generateSignedFileUrl = (filePath, expirationMinutes = 60) => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (expirationMinutes * 60 * 1000);
    
    tempTokenStore.set(token, {
        filePath,
        expiresAt
    });

    // Clean up expired tokens periodically
    setTimeout(() => {
        tempTokenStore.delete(token);
    }, expirationMinutes * 60 * 1000);

    return token;
};

export default router;