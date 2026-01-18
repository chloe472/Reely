import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

let storage = null;
let bucket = null;

function initializeStorage() {
  if (!storage) {
    try {
      storage = new Storage({
        projectId: process.env.GCP_PROJECT_ID,
        // Credentials are automatically picked up from Cloud Run service account
        // For local dev, you can set GOOGLE_APPLICATION_CREDENTIALS env var
      });
      
      const bucketName = process.env.GCS_BUCKET_NAME;
      if (!bucketName) {
        console.warn('GCS_BUCKET_NAME not set, using local storage');
        return null;
      }
      
      bucket = storage.bucket(bucketName);
      console.log(`GCS initialized with bucket: ${bucketName}`);
    } catch (error) {
      console.error('GCS initialization error:', error);
      console.warn('Falling back to local storage');
      return null;
    }
  }
  return bucket;
}

/**
 * Get content type from file extension
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Upload file to Google Cloud Storage
 * @param {string} localFilePath - Path to local file
 * @param {string} destinationPath - Path in bucket (e.g., 'uploads/filename.jpg')
 * @returns {Promise<string>} Public URL of uploaded file
 */
export async function uploadToGCS(localFilePath, destinationPath) {
  const bucket = initializeStorage();
  
  // If GCS not configured, return local path (for local dev)
  if (!bucket) {
    return `/uploads/${path.basename(localFilePath)}`;
  }
  
  try {
    const file = bucket.file(destinationPath);
    
    // Upload file
    await file.save(fs.readFileSync(localFilePath), {
      metadata: {
        contentType: getContentType(localFilePath),
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    // Make file publicly readable
    await file.makePublic();
    
    // Return public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
    console.log(`Uploaded to GCS: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('GCS upload error:', error);
    throw error;
  }
}

/**
 * Delete file from GCS
 * @param {string} filePath - Path in bucket (e.g., 'uploads/filename.jpg') or full URL
 * @returns {Promise<void>}
 */
export async function deleteFromGCS(filePath) {
  const bucket = initializeStorage();
  if (!bucket) return;
  
  try {
    // Extract path from full URL if needed
    let gcsPath = filePath;
    if (filePath.startsWith('https://storage.googleapis.com/')) {
      const urlParts = filePath.replace('https://storage.googleapis.com/', '').split('/');
      gcsPath = urlParts.slice(1).join('/'); // Remove bucket name
    }
    
    await bucket.file(gcsPath).delete();
    console.log(`Deleted from GCS: ${gcsPath}`);
  } catch (error) {
    // Don't throw if file doesn't exist (might have been deleted already)
    if (error.code !== 404) {
      console.error('GCS delete error:', error);
    }
  }
}

/**
 * Check if GCS is configured
 * @returns {boolean}
 */
export function isGCSConfigured() {
  return !!process.env.GCS_BUCKET_NAME;
}

/**
 * Get file URL - returns GCS URL if configured, otherwise local path
 * @param {string} filename - Filename
 * @returns {string} File URL
 */
export function getFileUrl(filename) {
  if (isGCSConfigured() && process.env.GCS_BUCKET_NAME) {
    return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/uploads/${filename}`;
  }
  return `/uploads/${filename}`;
}
