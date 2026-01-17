import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// The client gets the API key from the environment variable `GEMINI_API_KEY`
// Note: This will be initialized when the function is called, after dotenv.config()
let ai = null;

function initializeAI() {
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
    console.log(' Gemini API initialized');
    console.log(' API Key loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');
    if (process.env.GEMINI_API_KEY) {
      console.log(' Key starts with:', process.env.GEMINI_API_KEY.substring(0, 15) + '...');
    }
  }
  return ai;
}

/**
 * Analyzes an image to extract real-world location information and coordinates
 * Uses Google Gemini Vision API for multimodal image + text analysis
 * @param {string} imagePath - Path to the image file
 * @returns {Object} Location data including coordinates, confidence level, and metadata
 */
export async function analyzeScreenshot(imagePath) {
  // Initialize AI client (lazy initialization after dotenv loads)
  const aiClient = initializeAI();

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

  // Enhanced prompt to extract geographical coordinates
  const prompt = `Analyze this image and extract the real-world location information with precise coordinates.

This image shows a place in the real world. Your task is to:
1. Identify the specific location name (business name, landmark, or place)
2. Determine the exact latitude and longitude coordinates
3. Provide the full address if visible or determinable
4. Describe the location type and notable features
5. Assess your confidence level in the location identification

IMPORTANT: 
- If you can identify landmarks, street signs, business names, or distinctive features, use them to determine coordinates
- Look for any text, logos, or recognizable architectural features
- Consider geographical context clues (climate, architecture style, language on signs)
- Be conservative with confidence levels - only mark as "high" if you're very certain

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "location_name": "Name of the place or landmark",
  "latitude": 0.0,
  "longitude": 0.0,
  "address": "Full address if known, or city/area if partial",
  "city": "City name",
  "country": "Country name",
  "description": "Brief description of what this place is and notable features",
  "category": "Type of place (restaurant, cafe, bar, attraction, park, landmark, store, hotel, etc.)",
  "confidence": "high/medium/low",
  "confidence_reason": "Explanation of why you assigned this confidence level",
  "additional_info": "Any other relevant details like distinctive features, nearby landmarks"
}

If you cannot confidently identify the location or coordinates:
- Set confidence to "low"
- Provide your best estimate with reasoning
- Set latitude/longitude to null if you have no reliable data`;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash', // Using Gemini 1.5 Flash - best free tier
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Image
              }
            }
          ]
        }
      ]
    });

    const responseText = response.text;

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      const objectMatch = responseText.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr);
    
    // Validate required fields and confidence level
    if (!parsed.latitude || !parsed.longitude || parsed.latitude === 0 && parsed.longitude === 0) {
      return {
        ...parsed,
        error: 'NO_COORDINATES',
        error_message: 'Unable to determine geographical coordinates from the image',
        confidence: 'low'
      };
    }

    // Check for low confidence
    if (parsed.confidence === 'low') {
      return {
        ...parsed,
        error: 'LOW_CONFIDENCE',
        error_message: 'Location detected but with low confidence. Results may be inaccurate.',
      };
    }

    return parsed;

  } catch (e) {
    console.error('Gemini API error:', e);
    
    // Handle API failures
    return {
      error: 'API_FAILURE',
      error_message: 'Failed to analyze image with Gemini API',
      details: e.message,
      location_name: 'Unknown Location',
      confidence: 'low',
      latitude: null,
      longitude: null
    };
  }
}

/**
 * Generates a Google Maps URL for location search
 * @param {string} locationName - Name of the location
 * @param {string} address - Address of the location
 * @param {string} city - City name
 * @param {string} country - Country name
 * @returns {string} Google Maps search URL
 */
export function generateMapsUrl(locationName, address, city, country) {
  const query = [locationName, address, city, country]
    .filter(Boolean)
    .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Generates a Google Street View URL from coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Google Street View URL
 */
export function generateStreetViewUrl(lat, lng) {
  if (!lat || !lng) {
    return null;
  }
  // Google Street View URL format
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&heading=0&pitch=0&fov=80`;
}

/**
 * Validates if coordinates are within valid ranges
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if coordinates are valid
 */
export function validateCoordinates(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0) // Exclude null island
  );
}
