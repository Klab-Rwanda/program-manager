import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http'; // Import the native http module
import { Server } from 'socket.io'; // Import Socket.io Server
import connectDB from './src/config/db.js';
import mainApiRouter from './src/api/routes/v1/index.route.js';
import { startCronJobs } from './src/services/cron.service.js';

// Import the function to configure WebSocket events
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

// API Routes
app.use('/api/v1', mainApiRouter);

// Basic route
app.get('/', (req, res) => res.json({ message: 'API is running!' }));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ error: err.message || 'Something went wrong!' });
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