import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import Upload from '../models/Upload.js';
import { analyzeScreenshot, generateMapsUrl, generateStreetViewUrl, validateCoordinates } from '../services/gemini.js';
import { processVideo, getVideoMetadata } from '../services/videoProcessor.js';
import { authenticateToken } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();

// Initialize Supabase client for fetching user profiles
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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
    // Allow images and videos
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png',
      'video/mp4',
      'video/quicktime', // .mov files
      'video/x-msvideo',  // .avi files
      'video/webm'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG images and MP4, MOV, AVI, WEBM videos are allowed'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for videos
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

/**
 * Upload and analyze image endpoint
 * Processes image with Gemini Vision API to extract location coordinates
 * Returns coordinates for Street View and map guessing game
 */
router.post('/upload', authenticateToken, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'NO_FILE',
        message: 'No file uploaded' 
      });
    }

    const filePath = req.file.path;
    const isVideo = req.file.mimetype.startsWith('video/');

    console.log(`Processing ${isVideo ? 'video' : 'image'}: ${req.file.originalname} for user: ${req.user.userId}`);

    // Handle video files
    if (isVideo) {
      try {
        // Get video metadata
        const metadata = await getVideoMetadata(filePath);
        console.log(`Video metadata: ${Math.round(metadata.duration)}s duration, ${metadata.format}`);

        // Process video and extract locations
        const videoResult = await processVideo(filePath, {
          fps: 0.2,        // 1 frame every 5 seconds
          maxFrames: 15,   // Limit to 15 frames to avoid quota issues
          similarityThreshold: 0.7
        });

        // Save each unique location to database
        const savedUploads = [];
        for (let i = 0; i < videoResult.locations.length; i++) {
          const location = videoResult.locations[i];
          
          const mapsUrl = generateMapsUrl(
            location.location_name,
            location.address,
            location.city,
            location.country
          );

          const streetViewUrl = generateStreetViewUrl(
            location.latitude,
            location.longitude
          );

          const newUpload = new Upload({
            user_id: req.user.userId,
            user_email: req.user.email,
            user_name: req.user.fullName,
            filename: location.frameFilename || req.file.filename, // Use frame filename
            original_name: `${req.file.originalname} - Location ${i + 1} (${location.timestamp})`,
            location_name: location.location_name || 'Unknown Location',
            address: location.address || null,
            description: location.description || null,
            category: location.category || null,
            
            actual_coordinates: {
              latitude: location.latitude,
              longitude: location.longitude
            },
            
            latitude: location.latitude,
            longitude: location.longitude,
            
            confidence: location.confidence || 'low',
            confidence_reason: location.confidence_reason || null,
            has_error: false,
            error_type: null,
            error_message: null,
            
            google_maps_url: mapsUrl,
            street_view_url: streetViewUrl,
            raw_response: location
          });

          await newUpload.save();
          savedUploads.push(newUpload);
        }

        // Return video processing results
        return res.json({
          type: 'video',
          filename: req.file.filename,
          videoUrl: `/uploads/${req.file.filename}`,
          metadata: {
            duration: metadata.duration,
            format: metadata.format,
            dimensions: `${metadata.width}x${metadata.height}`
          },
          processing: {
            totalFrames: videoResult.totalFrames,
            analyzedFrames: videoResult.analyzedFrames,
            uniqueLocations: videoResult.uniqueLocations
          },
          locations: savedUploads.map((upload, index) => ({
            id: upload._id,
            imageUrl: `/uploads/${upload.filename}`, // Add imageUrl for frame screenshot
            coordinates: {
              lat: upload.latitude,
              lng: upload.longitude
            },
            location: {
              name: upload.location_name,
              address: upload.address,
              city: videoResult.locations[index]?.city,
              country: videoResult.locations[index]?.country,
              category: upload.category,
              description: upload.description
            },
            confidence: upload.confidence,
            timestamp: videoResult.locations[index]?.timestamp,
            google_maps_url: upload.google_maps_url,
            street_view_url: upload.street_view_url
          })),
          message: `Video processed successfully. Found ${videoResult.uniqueLocations} unique location(s)`
        });

      } catch (videoError) {
        console.error('Video processing error:', videoError);
        
        // Clean up video file on error
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        return res.status(500).json({
          error: 'VIDEO_PROCESSING_ERROR',
          message: 'Failed to process video',
          details: videoError.message
        });
      }
    }

    // Handle image files (existing logic)
    const imagePath = filePath;

    // Analyze with Gemini Vision API
    const analysis = await analyzeScreenshot(imagePath);

    console.log(`Analysis complete:`, {
      location: analysis.location_name,
      confidence: analysis.confidence,
      hasCoordinates: !!(analysis.latitude && analysis.longitude),
      error: analysis.error || 'none'
    });

    // Check for errors and handle accordingly
    if (analysis.error) {
      // Handle different error types
      if (analysis.error === 'NO_COORDINATES') {
        return res.status(400).json({
          error: 'NO_COORDINATES',
          message: 'Unable to detect a location with coordinates in this image',
          details: analysis.error_message,
          analysis: {
            location_name: analysis.location_name,
            description: analysis.description,
            confidence: analysis.confidence
          }
        });
      }

      if (analysis.error === 'API_FAILURE') {
        return res.status(500).json({
          error: 'API_FAILURE',
          message: 'Failed to analyze image',
          details: analysis.error_message
        });
      }

      // LOW_CONFIDENCE - we still proceed but warn the user
      if (analysis.error === 'LOW_CONFIDENCE') {
        console.warn('Low confidence detection:', analysis.confidence_reason);
      }
    }

    // Validate coordinates
    const coordsValid = validateCoordinates(analysis.latitude, analysis.longitude);
    if (!coordsValid) {
      return res.status(400).json({
        error: 'INVALID_COORDINATES',
        message: 'The detected coordinates are invalid or unreliable',
        details: `Coordinates: ${analysis.latitude}, ${analysis.longitude}`,
        analysis
      });
    }

    // Generate URLs
    const mapsUrl = generateMapsUrl(
      analysis.location_name,
      analysis.address,
      analysis.city,
      analysis.country
    );

    const streetViewUrl = generateStreetViewUrl(
      analysis.latitude,
      analysis.longitude
    );

    // Save to MongoDB with comprehensive data
    const newUpload = new Upload({
      user_id: req.user.userId,
      user_email: req.user.email, // Save email for leaderboard
      user_name: req.user.fullName, // Save full name from Google Auth
      filename: req.file.filename,
      original_name: req.file.originalname,
      location_name: analysis.location_name || 'Unknown Location',
      address: analysis.address || null,
      description: analysis.description || null,
      category: analysis.category || null,
      
      // Store actual coordinates from Gemini
      actual_coordinates: {
        latitude: analysis.latitude,
        longitude: analysis.longitude
      },
      
      // Legacy fields for backwards compatibility
      latitude: analysis.latitude,
      longitude: analysis.longitude,
      
      // Confidence tracking
      confidence: analysis.confidence || 'low',
      confidence_reason: analysis.confidence_reason || null,
      has_error: !!analysis.error,
      error_type: analysis.error || null,
      error_message: analysis.error_message || null,
      
      google_maps_url: mapsUrl,
      street_view_url: streetViewUrl,
      raw_response: analysis
    });

    await newUpload.save();

    // Return successful response with coordinates
    res.json({
      type: 'image',
      id: newUpload._id,
      filename: req.file.filename,
      imageUrl: `/uploads/${req.file.filename}`,
      
      // Return coordinates for frontend use
      coordinates: {
        lat: analysis.latitude,
        lng: analysis.longitude
      },
      
      // Location metadata
      location: {
        name: analysis.location_name,
        address: analysis.address,
        city: analysis.city,
        country: analysis.country,
        category: analysis.category,
        description: analysis.description
      },
      
      // Confidence and error info
      confidence: analysis.confidence,
      hasError: !!analysis.error,
      errorType: analysis.error || null,
      warningMessage: analysis.error === 'LOW_CONFIDENCE' ? analysis.error_message : null,
      
      // URLs
      google_maps_url: mapsUrl,
      street_view_url: streetViewUrl,
      
      // Full analysis for debugging
      analysis,
      
      message: 'Image analyzed successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'PROCESSING_ERROR',
      message: 'Failed to process image', 
      details: error.message 
    });
  }
});

/**
 * Save user's guessed coordinates after map game
 * Calculates distance and points earned
 */
router.patch('/upload/:id/guess', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, distance, points } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'MISSING_COORDINATES',
        message: 'Latitude and longitude are required' 
      });
    }

    // Validate coordinates
    if (!validateCoordinates(latitude, longitude)) {
      return res.status(400).json({
        error: 'INVALID_COORDINATES',
        message: 'Invalid latitude or longitude values'
      });
    }

    const uploadDoc = await Upload.findById(req.params.id);

    if (!uploadDoc) {
      return res.status(404).json({ 
        error: 'NOT_FOUND',
        message: 'Upload not found' 
      });
    }

    // Verify user owns this upload
    if (uploadDoc.user_id !== req.user.userId) {
      return res.status(403).json({ 
        error: 'FORBIDDEN',
        message: 'You do not have permission to update this upload' 
      });
    }

    // Update guessed coordinates and game results
    uploadDoc.guessed_coordinates = {
      latitude,
      longitude
    };
    
    if (distance !== undefined) {
      uploadDoc.distance_km = distance;
    }
    
    if (points !== undefined) {
      uploadDoc.points = points;
    }

    await uploadDoc.save();

    res.json({
      message: 'Guess saved successfully',
      id: uploadDoc._id,
      guessed_coordinates: uploadDoc.guessed_coordinates,
      distance_km: uploadDoc.distance_km,
      points: uploadDoc.points
    });

  } catch (error) {
    console.error('Guess save error:', error);
    res.status(500).json({ 
      error: 'SAVE_ERROR',
      message: 'Failed to save guess', 
      details: error.message 
    });
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

/**
 * Leaderboard endpoint - Get all registered users with their game stats
 * Fetches user profiles from Supabase profiles table and matches with MongoDB game data
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100; // Get more users initially

    console.log(' Fetching leaderboard...');

    // Fetch all user profiles from Supabase public.profiles table
    const { data: profiles, error: supabaseError } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .order('created_at', { ascending: false });
    
    console.log(' Supabase profiles response:');
    console.log('  - Error:', supabaseError);
    console.log('  - Profiles count:', profiles?.length || 0);
    if (profiles && profiles.length > 0) {
      console.log('  - Sample profile:', JSON.stringify(profiles[0], null, 2));
    }
    
    if (supabaseError) {
      console.error('️ Supabase profiles error:', supabaseError);
    }

    // Aggregate game stats from MongoDB
    const gameStats = await Upload.aggregate([
      // Include all uploads, not just those with points
      {
        $group: {
          _id: '$user_id',
          userEmail: { $first: '$user_email' },
          userName: { $first: '$user_name' },
          totalPoints: { 
            $sum: { 
              $cond: [{ $ifNull: ['$points', false] }, '$points', 0] 
            } 
          },
          gamesPlayed: {
            $sum: {
              $cond: [{ $ifNull: ['$points', false] }, 1, 0]
            }
          },
          bestScore: { $max: '$points' },
          averageDistance: { 
            $avg: { 
              $cond: [{ $ifNull: ['$distance_km', false] }, '$distance_km', null] 
            } 
          }
        }
      }
    ]);

    // Create a map of user stats
    const statsMap = new Map();
    gameStats.forEach(stat => {
      statsMap.set(stat._id, {
        totalPoints: stat.totalPoints || 0,
        gamesPlayed: stat.gamesPlayed || 0,
        bestScore: stat.bestScore || 0,
        averageDistance: stat.averageDistance ? Math.round(stat.averageDistance * 100) / 100 : 0
      });
    });

    // Build leaderboard with all users from Supabase
    let leaderboard = [];

    if (profiles && profiles.length > 0) {
      // Use Supabase profile data
      leaderboard = profiles.map(profile => {
        const stats = statsMap.get(profile.id) || {
          totalPoints: 0,
          gamesPlayed: 0,
          bestScore: 0,
          averageDistance: 0
        };

        return {
          userId: profile.id,
          userEmail: profile.email,
          userName: profile.full_name,
          avatarUrl: profile.avatar_url,
          displayName: profile.full_name || profile.email?.split('@')[0] || 'Anonymous',
          ...stats
        };
      });
    } else {
      // Fallback: use MongoDB data only
      leaderboard = gameStats.map(stat => ({
        userId: stat._id,
        userEmail: stat.userEmail,
        userName: stat.userName,
        displayName: stat.userName || stat.userEmail?.split('@')[0] || 'Anonymous',
        totalPoints: stat.totalPoints || 0,
        gamesPlayed: stat.gamesPlayed || 0,
        bestScore: stat.bestScore || 0,
        averageDistance: stat.averageDistance ? Math.round(stat.averageDistance * 100) / 100 : 0
      }));
    }

    // Sort by total points descending (users with 0 points will be at the end)
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    // Limit results
    const requestedLimit = parseInt(req.query.limit) || 10;
    leaderboard = leaderboard.slice(0, requestedLimit);

    console.log(' Leaderboard generated:');
    console.log(`  - Total users: ${leaderboard.length}`);
    if (leaderboard.length > 0) {
      console.log('  - Sample entry:', JSON.stringify(leaderboard[0], null, 2));
    }

    res.json({
      leaderboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ 
      error: 'LEADERBOARD_ERROR',
      message: 'Failed to fetch leaderboard',
      details: error.message
    });
  }
});
