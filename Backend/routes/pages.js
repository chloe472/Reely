import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// Homepage
router.get('/', (req, res) => {
  res.json({
    name: 'Reely',
    description: 'Transform TikTok screenshots into location information',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /upload - Upload a screenshot for analysis',
      history: 'GET /history - Get upload history',
      single: 'GET /upload/:id - Get single upload',
      delete: 'DELETE /upload/:id - Delete an upload',
      health: 'GET /health - Health check',
      privacy: 'GET /privacy - Privacy Policy',
      terms: 'GET /terms - Terms of Service'
    }
  });
});

// Privacy Policy
router.get('/privacy', (req, res) => {
  res.sendFile(join(publicDir, 'privacy.html'));
});

// Terms of Service
router.get('/terms', (req, res) => {
  res.sendFile(join(publicDir, 'terms.html'));
});

export default router;
