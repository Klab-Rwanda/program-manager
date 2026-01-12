import express from 'express';
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

// Setup Socket.io - allow all origins
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// Pass the 'io' instance to our socket configuration
initializeSocket(io);
export { io };

const PORT = process.env.PORT || 6000;

// Simple CORS - allow all origins
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow any origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Configure helmet to not interfere with CORS
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(express.static('public'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/v1', mainApiRouter);

// Basic route
app.get('/', (req, res) => res.json({ message: 'API is running!' }));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.statusCode || 500)
    .json({ error: err.message || 'Something went wrong!' });
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
