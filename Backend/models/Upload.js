import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
  filename: String,
  original_name: String,
  location_name: String,
  address: String,
  description: String,
  category: String,
  latitude: Number,
  longitude: Number,
  google_maps_url: String,
  raw_response: mongoose.Schema.Types.Mixed,
  created_at: { type: Date, default: Date.now }
});

const Upload = mongoose.model('Upload', uploadSchema);

export default Upload;
