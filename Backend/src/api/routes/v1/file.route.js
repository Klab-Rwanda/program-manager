// Updated file.route.js
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { pathToFileURL } from 'url';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { Router } from 'express';

const router = Router();

// Custom middleware for file serving that supports both header and query token
const verifyJWTForFiles = asyncHandler(async (req, res, next) => {
    try {
        // First try to get token from Authorization header (normal case)
        let token = req.header("Authorization")?.replace("Bearer ", "");
        
        // If no token in header, try to get it from query parameter (iframe case)
        if (!token && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // You might need to fetch user data here depending on your setup
        // For now, assuming the token contains the necessary user info
        req.user = decodedToken;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

// Apply the custom JWT verification for file serving
router.use(verifyJWTForFiles);

/**
 * @desc    Serves a file from the backend's public/uploads directory.
 * @route   GET /api/v1/files/serve?path=uploads/filename.pdf&token=jwt_token
 * @access  Private (Authenticated Users)
 */
router.route('/serve').get(asyncHandler(async (req, res) => {
    const filePathFromQuery = req.query.path;

    if (!filePathFromQuery) {
        throw new ApiError(400, "File path is required.");
    }

    // Construct the absolute path for the base uploads directory
    const baseUploadsDir = path.resolve('./public/uploads'); 

    // Normalize and sanitize the requested file path to prevent directory traversal
    const normalizedFilePathFromQuery = path.normalize(filePathFromQuery).replace(/^(\.\.[\/\\])+/, '');

    // Construct the full absolute path to the requested file
    const finalAbsoluteFilePath = path.join(baseUploadsDir, normalizedFilePathFromQuery);

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
        // console.log('File stream ended successfully');
    });
}));

export default router;