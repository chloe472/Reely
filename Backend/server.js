import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import dotenv from 'dotenv';

import uploadRoutes, { uploadsDir } from './routes/uploads.js';
import pageRoutes from './routes/pages.js';
import authRoutes from './routes/auth.js';
import folderRoutes from './routes/folders.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use(pageRoutes);
app.use(authRoutes);
app.use(uploadRoutes);
app.use(folderRoutes);

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server after connecting to MongoDB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   Reely Backend is running!                  ║
║                                              ║
║   Local:  http://localhost:${PORT}             ║
║   Database: MongoDB Atlas                    ║
║                                              ║
║   Endpoints:                                 ║
║   GET  /          - Homepage                 ║
║   GET  /privacy   - Privacy Policy           ║
║   GET  /terms     - Terms of Service         ║
║   POST /upload    - Upload screenshot        ║
║   GET  /history   - Get all uploads          ║
║   GET  /upload/:id - Get single upload       ║
║   DEL  /upload/:id - Delete upload           ║
║                                              ║
╚══════════════════════════════════════════════╝
    `);
  });
});
