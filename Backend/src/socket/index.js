import { ClassSession } from '../api/models/classSession.model.js';
import { User } from '../api/models/user.model.js';
import { generateSessionQRCode } from '../services/qr.service.js';

// Using a simple in-memory store. For production, consider Redis for scalability.
const sessionParticipants = new Map();

const initializeSocket = (io) => {
  
  io.on('connection', (socket) => {
    console.log(`A user connected via WebSocket: ${socket.id}`);

    // When a user's browser connects to the classroom page
    socket.on('join_session_room', async ({ sessionId, userId }) => {
      if (!sessionId || !userId) {
        console.warn('join_session_room event received with missing data');
        return;
      }
      
      socket.join(sessionId);
      
      // Add user to the participant list for this session
      if (!sessionParticipants.has(sessionId)) {
          sessionParticipants.set(sessionId, new Map());
      }
      const user = await User.findById(userId).select('name role').lean(); // .lean() for performance
      if (user) {
          sessionParticipants.get(sessionId).set(userId, user);
      }

      // Broadcast the updated participant list to everyone in the room
      const participants = Array.from(sessionParticipants.get(sessionId).values());
      io.to(sessionId).emit('participant_list_updated', participants);

      console.log(`User ${user?.name || userId} joined WebSocket room: ${sessionId}`);
    });

    // When a facilitator clicks "Share Link"
    socket.on('facilitator_share_link', async ({ sessionId, link }) => {
      try {
        await ClassSession.findOneAndUpdate({ sessionId }, { $set: { meetingLink: link } });
        socket.to(sessionId).emit('meeting_link_updated', link);
        console.log(`Link saved and shared in room ${sessionId}`);
      } catch (error) {
        console.error(`Error sharing meeting link for session ${sessionId}:`, error);
      }
    });

    // When a facilitator clicks "Take Attendance"
    socket.on('facilitator_start_attendance', async ({ sessionId }, callback) => {
      try {
        console.log(`Facilitator starting attendance for room ${sessionId}`);
        const session = await ClassSession.findOne({ sessionId });
        if (!session) {
          return callback({ error: 'Session not found on server.' });
        }

        const qrResult = await generateSessionQRCode(session.sessionId, 5); // 5-minute expiry
        session.qrCodeData = qrResult.qrData;
        await session.save();
        
        io.to(sessionId).emit('attendance_started', { qrCodeImage: qrResult.qrCodeImage });
        
        callback({ success: true, qrCodeImage: qrResult.qrCodeImage });
      } catch (error) {
        console.error("Error starting attendance:", error);
        callback({ error: 'Failed to start attendance check.' });
      }
    });
    
    // When a facilitator closes their QR modal
    socket.on('facilitator_end_attendance', ({ sessionId }) => {
        console.log(`Facilitator ending attendance for room ${sessionId}`);
        io.to(sessionId).emit('attendance_ended');
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // Note: A robust production implementation would handle removing users
      // from the sessionParticipants map on disconnect.
    });
  });
};

export default initializeSocket;