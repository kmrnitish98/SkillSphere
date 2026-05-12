import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

// ── Local Pub/Sub Integration ──────────────────────────────
import { initPubSub, subscribe, CHANNELS } from './services/pubsubService.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import seedAdmin from './utils/seedAdmin.js';

// Load env vars
dotenv.config();

// ── Initialize Database ────────────────────────────────────
connectDB().then(() => seedAdmin());

// Initialize Local Pub/Sub for real-time features
initPubSub().then(() => {
  try {
    // ── Subscribe to real-time channels ──────────────────
    // These handlers bridge Local Pub/Sub → Socket.io for
    // real-time client notifications

    subscribe(CHANNELS.COURSE_UPDATE, (payload) => {
      console.log('📡 Pub/Sub [COURSE_UPDATE]:', payload?.action, payload?.title);
      io.emit('courseUpdate', payload);
    });

    subscribe(CHANNELS.ENROLLMENT, (payload) => {
      console.log('📡 Pub/Sub [ENROLLMENT]:', payload);
      if (payload?.mentorId) {
        const mentorSocketId = onlineUsers.get(payload.mentorId);
        if (mentorSocketId) {
          io.to(mentorSocketId).emit('newEnrollment', payload);
        }
      }
    });

    subscribe(CHANNELS.NOTIFICATION, (payload) => {
      console.log('📡 Pub/Sub [NOTIFICATION]:', payload);
      if (payload?.userId) {
        const userSocketId = onlineUsers.get(payload.userId);
        if (userSocketId) {
          io.to(userSocketId).emit('notification', payload);
        }
      }
    });

    subscribe(CHANNELS.SYSTEM_ALERT, (payload) => {
      console.log('📡 Pub/Sub [SYSTEM_ALERT]:', payload);
      io.emit('systemAlert', payload);
    });
  } catch (err) {
    console.warn('⚠️ Pub/Sub setup skipped:', err.message);
  }
});


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Middlewares
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'];
app.use(cors({ origin: (origin, cb) => cb(null, allowedOrigins.includes(origin) || !origin), credentials: true }));

// ⚠️  Stripe webhook MUST come before express.json() 
//     so it can read the raw body for signature verification
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

// All other routes use JSON body parser
app.use(express.json());

// ── Redis: Global API Rate Limiter ───────────────────────
// Applies to all /api routes: 100 requests per minute per IP
app.use('/api', apiLimiter);

// Routes setup
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/mentor', mentorRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/certificates', certificateRoutes);

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Socket.io Logic
const onlineUsers = new Map();

io.on('connection', (socket) => {
  // Add user to online list
  socket.on('userOnline', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });

  // Handle joining a conversation room
  socket.on('joinChat', (conversationId) => {
    socket.join(conversationId);
  });

  // Handle typing indicator
  socket.on('typing', ({ conversationId, userId, isTyping }) => {
    socket.to(conversationId).emit('typing', { conversationId, userId, isTyping });
  });

  // Handle sending messages
  socket.on('sendMessage', (messageData) => {
    // messageData: { conversationId, sender, receiver, message, createdAt, ... }
    
    // Emit to conversation room (so sender/receiver inside it gets it)
    io.to(messageData.conversationId).emit('receiveMessage', messageData);
    
    // Also emit a notification to the receiver if they are online but not in the room
    const receiverSocketId = onlineUsers.get(messageData.receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessageNotification', messageData);
    }
  });

  // Handle read receipts
  socket.on('markSeen', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('messagesSeen', { conversationId, userId });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('onlineUsers', Array.from(onlineUsers.keys()));
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
