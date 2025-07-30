// src/socket/index.js
import { ClassSession } from '../api/models/classSession.model.js';
import { User } from '../api/models/user.model.js';
import { generateSessionQRCode } from '../services/qr.service.js';
import jwt from 'jsonwebtoken'; // Import jwt to verify token
import dotenv from 'dotenv'; // Import dotenv to access JWT_SECRET

dotenv.config(); // Load environment variables

const sessionParticipants = new Map(); // Store participants for classroom sessions

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`A user connected via WebSocket: ${socket.id}`);

    // --- NEW: Authenticate and join personal notification room ---
    socket.on('authenticate', async (data) => {
      try {
        const token = data.token;
        if (!token) {
          throw new Error('Authentication token missing.');
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedToken._id).select('_id name role');

        if (!user) {
          throw new Error('User not found.');
        }

        socket.join(user._id.toString()); // User joins their personal notification room
        socket.userId = user._id.toString(); // Attach user ID to socket for later use
        console.log(`Socket ${socket.id} authenticated for user ${user.name} and joined room ${user._id.toString()}`);
        socket.emit('authenticated', { status: 'success', userId: user._id.toString() });

      } catch (error) {
        console.error(`Socket authentication failed for ${socket.id}:`, error.message);
        socket.emit('unauthorized', { message: 'Authentication failed.' });
        socket.disconnect(); // Disconnect unauthorized sockets
      }
    });
    // --- END NEW AUTHENTICATION LOGIC ---


    // When a user's browser connects to the classroom page (still relevant for classroom hub)
    // NOTE: This event is specific to the classroom. For general notifications, use 'authenticate'
    socket.on('join_session_room', async ({ sessionId, userId }) => {
      if (!sessionId || !userId) {
        console.warn('join_session_room event received with missing data');
        return;
      }
      
      // This is the classroom room, distinct from the user's personal notification room
      socket.join(sessionId); 
      
      // Add user to the participant list for this specific classroom session
      if (!sessionParticipants.has(sessionId)) {
          sessionParticipants.set(sessionId, new Map());
      }
      const user = await User.findById(userId).select('name role').lean();
      if (user) {
          sessionParticipants.get(sessionId).set(userId, user);
      }

      // Broadcast the updated participant list to everyone in this classroom room
      const participants = Array.from(sessionParticipants.get(sessionId).values());
      io.to(sessionId).emit('participant_list_updated', participants);

      console.log(`User ${user?.name || userId} joined WebSocket room: ${sessionId} (classroom)`);
    });

    // When a facilitator clicks "Share Link"
    socket.on('facilitator_share_link', async ({ sessionId, link }) => {
      try {
        // Only allow if the socket is associated with a facilitator and has joined the session room
        // (You might want more robust verification here against session.facilitatorId)
        if (!socket.userId) { // Ensure socket is authenticated
            console.warn('Unauthorized facilitator_share_link attempt.');
            return;
        }

        await ClassSession.findOneAndUpdate({ sessionId }, { $set: { meetingLink: link } });
        io.to(sessionId).emit('meeting_link_updated', link); // Broadcast to classroom participants
        console.log(`Link saved and shared in room ${sessionId}`);
      } catch (error) {
        console.error(`Error sharing meeting link for session ${sessionId}:`, error);
      }
    });

    // When a facilitator clicks "Take Attendance"
    socket.on('facilitator_start_attendance', async ({ sessionId }, callback) => {
      try {
        if (!socket.userId) { // Ensure socket is authenticated
            console.warn('Unauthorized facilitator_start_attendance attempt.');
            return callback({ error: 'Unauthorized.' });
        }
        console.log(`Facilitator starting attendance for room ${sessionId}`);
        const session = await ClassSession.findOne({ sessionId });
        if (!session) {
          return callback({ error: 'Session not found on server.' });
        }
        // Basic check that the current authenticated user is the facilitator of this session
        if (session.facilitatorId.toString() !== socket.userId) {
             return callback({ error: 'Forbidden: Not the facilitator of this session.' });
        }


        const qrResult = await generateSessionQRCode(session.sessionId, 5); // 5-minute expiry
        session.qrCodeData = qrResult.qrData;
        await session.save();
        
        io.to(sessionId).emit('attendance_started', { qrCodeImage: qrResult.qrCodeImage }); // Broadcast to classroom participants
        
        callback({ success: true, qrCodeImage: qrResult.qrCodeImage });
      } catch (error) {
        console.error("Error starting attendance:", error);
        callback({ error: 'Failed to start attendance check.' });
      }
    });
    
    // When a facilitator closes their QR modal
    socket.on('facilitator_end_attendance', ({ sessionId }) => {
        if (!socket.userId) { // Ensure socket is authenticated
            console.warn('Unauthorized facilitator_end_attendance attempt.');
            return;
        }
        console.log(`Facilitator ending attendance for room ${sessionId}`);
        io.to(sessionId).emit('attendance_ended'); // Broadcast to classroom participants
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // On disconnect, a user leaves all rooms automatically.
      // If using sessionParticipants map for classroom:
      // You'd need to iterate through sessionParticipants to remove this socket.userId from any maps.
      // For general users, no manual removal from rooms needed if they just joined their userId room.
    });
  });
};

export default initializeSocket;