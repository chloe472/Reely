import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  uploads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload'
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
folderSchema.index({ user_id: 1 });

const Folder = mongoose.model('Folder', folderSchema);

export default Folder;
