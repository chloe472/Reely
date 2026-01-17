import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
  user_id: {
    type: String, // Changed to String to support Supabase UUIDs
    required: true
  },
  filename: String,
  original_name: String,
  location_name: String,
  address: String,
  description: String,
  category: String,
  
  // Actual coordinates (from Gemini API)
  actual_coordinates: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
  },
  
  // User guessed coordinates (from map game)
  guessed_coordinates: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
  },
  
  // Game results
  distance_km: { type: Number, default: null }, // Distance between actual and guessed
  points: { type: Number, default: null }, // Points earned in the game
  
  // Legacy fields for backwards compatibility
  latitude: Number,
  longitude: Number,
  
  // Confidence and error handling
  confidence: { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
  confidence_reason: String,
  has_error: { type: Boolean, default: false },
  error_type: String, // NO_COORDINATES, LOW_CONFIDENCE, API_FAILURE
  error_message: String,
  
  google_maps_url: String,
  street_view_url: String,
  raw_response: mongoose.Schema.Types.Mixed,
  created_at: { type: Date, default: Date.now }
});

const Upload = mongoose.model('Upload', uploadSchema);

export default Upload;
