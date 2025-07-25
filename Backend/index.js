import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http'; // Import the native http module
import { Server } from 'socket.io'; // Import Socket.io Server
import connectDB from './src/config/db.js';
import mainApiRouter from './src/api/routes/v1/index.route.js';
import { startCronJobs } from './src/services/cron.service.js';

import programRoutes from './src/api/routes/v1/program.route.js';
import userRoutes from './src/api/routes/v1/user.route.js';
import authRoutes from './src/api/routes/v1/auth.route.js';
import dashboardRoutes from './src/api/routes/v1/dashboard.route.js';
import attendanceRoutes from './src/api/routes/v1/attendance.route.js';
import certificateRoutes from './src/api/routes/v1/certificate.route.js';
import ticketRoutes from './src/api/routes/v1/tickets.route.js';
import reportRoutes from './src/api/routes/v1/report.route.js';
import courseRoutes from './src/api/routes/v1/course.route.js';
import roadmapRoutes from './src/api/routes/v1/roadmap.route.js';
import submissionRoutes from './src/api/routes/v1/submission.route.js';
import quizRoutes from './src/api/routes/v1/quiz.route.js';
import departmentRoutes from './src/api/routes/v1/department.route.js';
import exportRoutes from './src/api/routes/v1/export.route.js';
import notificationRoutes from './src/api/routes/v1/notification.route.js';
import jitsiRoutes from './src/api/routes/v1/jitsi.route.js';
import programUserRoutes from './src/api/routes/v1/programUser.route.js';
import initializeSocket from './src/socket/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app); // Create an HTTP server from the Express app

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Pass the 'io' instance to our socket configuration
initializeSocket(io);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the public directory
app.use('/public', express.static('public'));

// API Routes
app.use('/api/v1/programs', programRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/roadmap', roadmapRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/exports', exportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/jitsi', jitsiRoutes);
app.use('/api/v1/program-users', programUserRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle JWT token errors
  if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Token expired or invalid. Please login again.',
      success: false,
      message: err.message
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation error',
      success: false,
      message: err.message
    });
  }
  
  // Handle duplicate key errors
  if (err.code === 11000) {
    return res.status(409).json({ 
      error: 'Duplicate entry found',
      success: false,
      message: 'This record already exists'
    });
  }
  
  res.status(err.statusCode || 500).json({ 
    error: err.message || 'Something went wrong!',
    success: false
  });
});

// 404 handler
app.use('*', (req, res) => res.status(404).json({ error: 'Route not found' }));

const startServer = async () => {
  try {
    await connectDB();
     startCronJobs();
    server.listen(PORT, () => {
      console.log(`🚀 Server & WebSocket running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();