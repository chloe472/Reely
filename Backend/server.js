import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize SQLite database
const db = new Database('reely.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    original_name TEXT,
    location_name TEXT,
    address TEXT,
    description TEXT,
    category TEXT,
    latitude REAL,
    longitude REAL,
    google_maps_url TEXT,
    raw_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const uploadsDir = join(__dirname, 'uploads');
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

// Serve uploaded images
app.use('/uploads', express.static(uploadsDir));

// Analyze image with Gemini
async function analyzeScreenshot(imagePath) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString('base64');
  
  // Detect mime type from file extension
  const ext = imagePath.split('.').pop().toLowerCase();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  const mimeType = mimeTypes[ext] || 'image/jpeg';

  const prompt = `Analyze this TikTok screenshot and extract location information.
  
This appears to be a screenshot from TikTok showing a place someone is recommending to visit.
Please identify:
1. The name of the place/location shown
2. The full address if visible or can be determined
3. A brief description of what kind of place it is
4. The category (restaurant, cafe, bar, attraction, park, store, hotel, etc.)
5. The city and country if identifiable

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "location_name": "Name of the place",
  "address": "Full address if known, or city/area if partial",
  "city": "City name",
  "country": "Country name",
  "description": "Brief description of what this place is and why it might be recommended",
  "category": "Type of place (restaurant, cafe, bar, attraction, etc.)",
  "confidence": "high/medium/low",
  "additional_info": "Any other relevant details like hours, price range, specialties"
}

If you cannot identify a specific location, provide your best guess with "low" confidence.`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: base64Image
      }
    }
  ]);

  const response = result.response.text();

  // Extract JSON from response (handle potential markdown wrapping)
  let jsonStr = response;
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  } else {
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse Gemini response:', response);
    return {
      location_name: 'Unknown Location',
      description: response,
      confidence: 'low',
      parse_error: true
    };
  }
}

// Generate Google Maps URL
function generateMapsUrl(locationName, address, city, country) {
  const query = [locationName, address, city, country]
    .filter(Boolean)
    .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload and analyze screenshot
app.post('/api/upload', upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imagePath = req.file.path;

    console.log(`Processing: ${req.file.originalname}`);

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

    // Save to database
    const stmt = db.prepare(`
      INSERT INTO uploads (
        filename, original_name, location_name, address, 
        description, category, google_maps_url, raw_response
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.file.filename,
      req.file.originalname,
      analysis.location_name || null,
      analysis.address || null,
      analysis.description || null,
      analysis.category || null,
      mapsUrl,
      JSON.stringify(analysis)
    );

    res.json({
      id: result.lastInsertRowid,
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

// Get upload history
app.get('/api/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const uploads = db.prepare(`
      SELECT * FROM uploads 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM uploads').get();

    // Parse raw_response JSON for each upload
    const processed = uploads.map(upload => ({
      ...upload,
      imageUrl: `/uploads/${upload.filename}`,
      analysis: upload.raw_response ? JSON.parse(upload.raw_response) : null
    }));

    res.json({
      uploads: processed,
      total: total.count,
      limit,
      offset
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get single upload by ID
app.get('/api/upload/:id', (req, res) => {
  try {
    const upload = db.prepare('SELECT * FROM uploads WHERE id = ?').get(req.params.id);

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.json({
      ...upload,
      imageUrl: `/uploads/${upload.filename}`,
      analysis: upload.raw_response ? JSON.parse(upload.raw_response) : null
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch upload' });
  }
});

// Delete upload
app.delete('/api/upload/:id', (req, res) => {
  try {
    const upload = db.prepare('SELECT filename FROM uploads WHERE id = ?').get(req.params.id);

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Delete file
    const filePath = join(uploadsDir, upload.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    db.prepare('DELETE FROM uploads WHERE id = ?').run(req.params.id);

    res.json({ message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete upload' });
  }
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

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   Reely Backend is running!                  ║
║                                              ║
║   Local:  http://localhost:${PORT}             ║
║                                              ║
║   Endpoints:                                 ║
║   POST /api/upload     - Upload screenshot   ║
║   GET  /api/history    - Get all uploads     ║
║   GET  /api/upload/:id - Get single upload   ║
║   DEL  /api/upload/:id - Delete upload       ║
║                                              ║
╚══════════════════════════════════════════════╝
  `);
});
