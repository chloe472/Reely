import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Upload from '../models/Upload.js';
import { analyzeScreenshot, generateMapsUrl } from '../services/gemini.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const uploadsDir = join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Upload and analyze screenshot
router.post('/upload', authenticateToken, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imagePath = req.file.path;

    console.log(`Processing: ${req.file.originalname} for user: ${req.user.userId}`);

    // Analyze with Gemini
    const analysis = await analyzeScreenshot(imagePath);

    console.log(`Analysis complete:`, analysis.location_name);

    // Generate Google Maps URL
    const mapsUrl = generateMapsUrl(
      analysis.location_name,
      analysis.address,
      analysis.city,
      analysis.country
    );

    // Save to MongoDB with user association
    const newUpload = new Upload({
      user_id: req.user.userId,
      filename: req.file.filename,
      original_name: req.file.originalname,
      location_name: analysis.location_name || null,
      address: analysis.address || null,
      description: analysis.description || null,
      category: analysis.category || null,
      google_maps_url: mapsUrl,
      raw_response: analysis
    });

    await newUpload.save();

    res.json({
      id: newUpload._id,
      filename: req.file.filename,
      imageUrl: `/uploads/${req.file.filename}`,
      analysis,
      google_maps_url: mapsUrl,
      message: 'Screenshot analyzed successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process screenshot', details: error.message });
  }
});

// Get upload history (only for authenticated user)
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.offset) || 0;

    // Only fetch uploads for the authenticated user
    const uploads = await Upload.find({ user_id: req.user.userId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Upload.countDocuments({ user_id: req.user.userId });

    // Format response
    const processed = uploads.map(upload => ({
      id: upload._id,
      filename: upload.filename,
      original_name: upload.original_name,
      location_name: upload.location_name,
      address: upload.address,
      description: upload.description,
      category: upload.category,
      google_maps_url: upload.google_maps_url,
      created_at: upload.created_at,
      imageUrl: `/uploads/${upload.filename}`,
      analysis: upload.raw_response
    }));

    res.json({
      uploads: processed,
      total,
      limit,
      offset: skip
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get single upload by ID
router.get('/upload/:id', async (req, res) => {
  try {
    const uploadDoc = await Upload.findById(req.params.id);

    if (!uploadDoc) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.json({
      id: uploadDoc._id,
      filename: uploadDoc.filename,
      original_name: uploadDoc.original_name,
      location_name: uploadDoc.location_name,
      address: uploadDoc.address,
      description: uploadDoc.description,
      category: uploadDoc.category,
      google_maps_url: uploadDoc.google_maps_url,
      created_at: uploadDoc.created_at,
      imageUrl: `/uploads/${uploadDoc.filename}`,
      analysis: uploadDoc.raw_response
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch upload' });
  }
});

// Delete upload
router.delete('/upload/:id', async (req, res) => {
  try {
    const uploadDoc = await Upload.findById(req.params.id);

    if (!uploadDoc) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Delete file
    const filePath = join(uploadsDir, uploadDoc.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await Upload.findByIdAndDelete(req.params.id);

    res.json({ message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete upload' });
  }
});

// Export router and uploadsDir for static file serving
export { uploadsDir };
export default router;
