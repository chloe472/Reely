import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function analyzeScreenshot(imagePath) {
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
3. GPS coordinates (latitude and longitude) - VERY IMPORTANT for Street View
4. A brief description of what kind of place it is
5. The category (restaurant, cafe, bar, attraction, park, store, hotel, etc.)
6. The city and country if identifiable

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "location_name": "Name of the place",
  "address": "Full address if known, or city/area if partial",
  "city": "City name",
  "country": "Country name",
  "coordinates": {
    "lat": 0.0,
    "lng": 0.0
  },
  "description": "Brief description of what this place is and why it might be recommended",
  "category": "Type of place (restaurant, cafe, bar, attraction, etc.)",
  "confidence": "high/medium/low",
  "additional_info": "Any other relevant details like hours, price range, specialties"
}

IMPORTANT: 
- For coordinates, provide the actual GPS coordinates if you can identify the location
- If you recognize the place, use its known coordinates
- If uncertain, provide approximate coordinates for the city/area mentioned
- Coordinates must be valid latitude (-90 to 90) and longitude (-180 to 180) values

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

export function generateMapsUrl(locationName, address, city, country) {
  const query = [locationName, address, city, country]
    .filter(Boolean)
    .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
