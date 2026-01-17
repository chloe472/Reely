import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeScreenshot } from './gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Extract frames from video at specified intervals
 * @param {string} videoPath - Path to video file
 * @param {string} outputDir - Directory to save extracted frames
 * @param {number} fps - Frames per second to extract (default: 0.2 = 1 frame every 5 seconds)
 * @returns {Promise<string[]>} Array of frame file paths
 */
async function extractFrames(videoPath, outputDir, fps = 0.2) {
  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const framePattern = path.join(outputDir, 'frame-%04d.jpg');
    const extractedFrames = [];

    ffmpeg(videoPath)
      .outputOptions([
        `-vf fps=${fps}`,  // Extract frames at specified fps
        '-q:v 2'           // High quality JPEG (1-31, lower is better)
      ])
      .output(framePattern)
      .on('end', () => {
        // Get all extracted frame files
        const files = fs.readdirSync(outputDir)
          .filter(file => file.startsWith('frame-') && file.endsWith('.jpg'))
          .sort()
          .map(file => path.join(outputDir, file));
        
        console.log(` Extracted ${files.length} frames from video`);
        resolve(files);
      })
      .on('error', (err) => {
        console.error('Frame extraction error:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Calculate similarity between two location analysis results
 * @param {Object} loc1 - First location analysis
 * @param {Object} loc2 - Second location analysis
 * @returns {number} Similarity score (0-1, higher means more similar)
 */
function calculateLocationSimilarity(loc1, loc2) {
  // If either location has no coordinates, consider them different
  if (!loc1.latitude || !loc2.latitude || !loc1.longitude || !loc2.longitude) {
    return 0;
  }

  // Calculate distance between coordinates using Haversine formula
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(loc2.latitude - loc1.latitude);
  const dLon = toRad(loc2.longitude - loc1.longitude);

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.latitude)) * Math.cos(toRad(loc2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  // If locations are within 500m, consider them the same location
  if (distance < 0.5) {
    return 1;
  }

  // If locations are more than 5km apart, definitely different
  if (distance > 5) {
    return 0;
  }

  // Return similarity based on distance (0.5-5km range)
  return 1 - (distance / 5);
}

/**
 * Filter out duplicate locations based on similarity
 * @param {Array} locations - Array of location analysis results
 * @param {number} threshold - Similarity threshold (default: 0.7)
 * @returns {Array} Filtered unique locations
 */
function filterUniqueLocations(locations, threshold = 0.7) {
  const uniqueLocations = [];

  for (const location of locations) {
    let isDuplicate = false;

    // Check if this location is similar to any existing unique location
    for (const uniqueLocation of uniqueLocations) {
      const similarity = calculateLocationSimilarity(location, uniqueLocation);
      if (similarity >= threshold) {
        isDuplicate = true;
        break;
      }
    }

    // Only add if it's not a duplicate
    if (!isDuplicate) {
      uniqueLocations.push(location);
    }
  }

  console.log(` Filtered ${locations.length} locations to ${uniqueLocations.length} unique locations`);
  return uniqueLocations;
}

/**
 * Process video file and extract unique locations from different scenes
 * @param {string} videoPath - Path to video file
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing results with unique locations
 */
export async function processVideo(videoPath, options = {}) {
  const {
    fps = 0.2,              // Extract 1 frame every 5 seconds by default
    maxFrames = 20,         // Maximum frames to analyze (to avoid quota issues)
    similarityThreshold = 0.7
  } = options;

  console.log(`\n Processing video: ${path.basename(videoPath)}`);
  console.log(`   - FPS: ${fps} (1 frame every ${Math.round(1/fps)} seconds)`);
  console.log(`   - Max frames: ${maxFrames}`);

  // Create temporary directory for frames
  const videoBasename = path.basename(videoPath, path.extname(videoPath));
  const framesDir = path.join(__dirname, '../uploads/frames', `${videoBasename}-${Date.now()}`);

  try {
    // Step 1: Extract frames from video
    console.log(' Extracting frames...');
    let framePaths = await extractFrames(videoPath, framesDir, fps);

    // Limit number of frames to analyze
    if (framePaths.length > maxFrames) {
      console.log(`️  Limiting analysis to ${maxFrames} frames (extracted ${framePaths.length})`);
      // Sample frames evenly across the video
      const step = Math.floor(framePaths.length / maxFrames);
      framePaths = framePaths.filter((_, index) => index % step === 0).slice(0, maxFrames);
    }

    // Step 2: Analyze each frame with Gemini
    console.log(` Analyzing ${framePaths.length} frames...`);
    const analysisResults = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < framePaths.length; i++) {
      const framePath = framePaths[i];
      console.log(`   [${i + 1}/${framePaths.length}] Analyzing ${path.basename(framePath)}...`);

      try {
        const analysis = await analyzeScreenshot(framePath);
        
        // Only include frames with valid locations
        if (analysis && analysis.latitude && analysis.longitude && !analysis.has_error) {
          // Copy frame to uploads directory with permanent name
          const permanentFrameName = `frame-${Date.now()}-${i}.jpg`;
          const permanentFramePath = path.join(__dirname, '../uploads', permanentFrameName);
          fs.copyFileSync(framePath, permanentFramePath);
          
          analysisResults.push({
            ...analysis,
            frameNumber: i + 1,
            framePath: permanentFramePath,
            frameFilename: permanentFrameName,
            timestamp: (i / fps).toFixed(1) + 's'
          });
          successCount++;
          console.log(`       Found: ${analysis.location_name} (${analysis.confidence} confidence)`);
        } else {
          failCount++;
          console.log(`       No valid location detected`);
        }

        // Add delay between requests to avoid rate limiting (1 request per 4 seconds = 15 RPM)
        if (i < framePaths.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 4000));
        }
      } catch (error) {
        failCount++;
        console.error(`       Error analyzing frame: ${error.message}`);
      }
    }

    console.log(`\n Analysis complete:`);
    console.log(`   - Success: ${successCount} frames`);
    console.log(`   - Failed: ${failCount} frames`);

    // Step 3: Filter unique locations
    const uniqueLocations = filterUniqueLocations(analysisResults, similarityThreshold);

    // Step 4: Clean up frame files
    console.log(` Cleaning up temporary files...`);
    framePaths.forEach(framePath => {
      try {
        fs.unlinkSync(framePath);
      } catch (err) {
        console.error(`Warning: Could not delete ${framePath}`);
      }
    });

    // Remove frames directory
    try {
      fs.rmdirSync(framesDir);
    } catch (err) {
      console.error(`Warning: Could not remove frames directory`);
    }

    return {
      success: true,
      totalFrames: framePaths.length,
      analyzedFrames: analysisResults.length,
      uniqueLocations: uniqueLocations.length,
      locations: uniqueLocations,
      processingTime: new Date().toISOString()
    };

  } catch (error) {
    console.error('Video processing error:', error);
    
    // Clean up on error
    try {
      if (fs.existsSync(framesDir)) {
        fs.rmSync(framesDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr);
    }

    throw error;
  }
}

/**
 * Get video metadata (duration, dimensions, etc.)
 * @param {string} videoPath - Path to video file
 * @returns {Promise<Object>} Video metadata
 */
export function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        resolve({
          duration: metadata.format.duration,
          size: metadata.format.size,
          format: metadata.format.format_name,
          width: videoStream?.width,
          height: videoStream?.height,
          fps: videoStream?.r_frame_rate
        });
      }
    });
  });
}
