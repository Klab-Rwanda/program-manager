import qrcode from 'qrcode';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// In a real app, you would store this secret and the generated token in a temporary cache (like Redis)
// For simplicity, we'll just generate and expect it.
const qrSecret = 'a-secret-for-qr-codes';

// Store active sessions in memory (in production, use Redis)
const activeSessions = new Map();

/**
 * Generate a new QR code for an online session
 * @param {string} sessionId - Unique session identifier
 * @param {number} expirationMinutes - Minutes until QR code expires (default: 15)
 * @returns {Promise<string>} Base64 QR code image
 */
export const generateSessionQRCode = async (sessionId, expirationMinutes = 15) => {
    const timestamp = Date.now();
    const expiresAt = new Date(timestamp + (expirationMinutes * 60 * 1000));
    
    const dataToSign = `${sessionId}-${timestamp}`;
    const signature = crypto.createHmac('sha256', qrSecret).update(dataToSign).digest('hex');
    
    // The data includes the signature to prevent tampering
    const qrData = JSON.stringify({ 
        sessionId, 
        timestamp, 
        signature,
        type: 'attendance'
    });

    // Store session data
    activeSessions.set(sessionId, {
        qrData,
        expiresAt,
        createdAt: new Date(timestamp)
    });

    // Generate QR code image
    const qrCodeImage = await qrcode.toDataURL(qrData);
    
    return {
        qrCodeImage,
        qrData,
        sessionId,
        expiresAt
    };
};

/**
 * Verify a scanned QR code
 * @param {string} scannedData - The scanned QR code data
 * @returns {Object|null} Session data if valid, null if invalid
 */
export const verifySessionQRCode = (scannedData) => {
    try {
        const parsedData = JSON.parse(scannedData);
        const { sessionId, timestamp, signature, type } = parsedData;

        // Check if it's an attendance QR code
        if (type !== 'attendance') {
            console.log("Invalid QR code type.");
            return null;
        }

        // Verify the signature
        const expectedSignature = crypto.createHmac('sha256', qrSecret)
            .update(`${sessionId}-${timestamp}`)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.log("QR Code signature mismatch.");
            return null;
        }

        // Check if session exists and is active
        const sessionData = activeSessions.get(sessionId);
        if (!sessionData) {
            console.log("Session not found or expired.");
            return null;
        }

        // Check if the QR code is still valid
        if (new Date() > sessionData.expiresAt) {
            console.log("QR Code has expired.");
            activeSessions.delete(sessionId); // Clean up expired session
            return null;
        }

        return { 
            sessionId,
            timestamp,
            createdAt: sessionData.createdAt,
            expiresAt: sessionData.expiresAt
        };

    } catch (error) {
        console.error("Error verifying QR Code:", error);
        return null;
    }
};

/**
 * Generate a unique session ID
 * @returns {string} Unique session identifier
 */
export const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get active session data
 * @param {string} sessionId - Session identifier
 * @returns {Object|null} Session data if active
 */
export const getActiveSession = (sessionId) => {
    return activeSessions.get(sessionId) || null;
};

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = () => {
    const now = new Date();
    for (const [sessionId, sessionData] of activeSessions.entries()) {
        if (now > sessionData.expiresAt) {
            activeSessions.delete(sessionId);
        }
    }
};

// Legacy functions for backward compatibility
export const generateNewQRCode = (programId) => {
    const sessionId = generateSessionId();
    return generateSessionQRCode(sessionId);
};

export const verifyQRCode = (scannedData) => {
    const result = verifySessionQRCode(scannedData);
    return result ? { programId: result.sessionId } : null;
};