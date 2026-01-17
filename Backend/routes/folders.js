import express from 'express';
import mongoose from 'mongoose';
import Folder from '../models/Folder.js';
import Upload from '../models/Upload.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get all folders for the user
 */
router.get('/folders', authenticateToken, async (req, res) => {
  try {
    const folders = await Folder.find({ user_id: req.user.userId })
      .populate('uploads')
      .sort({ created_at: -1 });
    
    res.json({
      folders,
      count: folders.length
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

/**
 * Create a new folder
 */
router.post('/folders', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const folder = new Folder({
      user_id: req.user.userId,
      name,
      description: description || '',
      uploads: []
    });

    await folder.save();
    
    res.status(201).json({
      success: true,
      folder
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

/**
 * Get a specific folder
 */
router.get('/folders/:folderId', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.folderId,
      user_id: req.user.userId
    }).populate('uploads');

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json(folder);
  } catch (error) {
    console.error('Error fetching folder:', error);
    res.status(500).json({ error: 'Failed to fetch folder' });
  }
});

/**
 * Update folder
 */
router.put('/folders/:folderId', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.folderId, user_id: req.user.userId },
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        updated_at: new Date()
      },
      { new: true }
    ).populate('uploads');

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

/**
 * Delete folder
 */
router.delete('/folders/:folderId', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findOneAndDelete({
      _id: req.params.folderId,
      user_id: req.user.userId
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json({ success: true, message: 'Folder deleted' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

/**
 * Add upload to folder
 */
router.post('/folders/:folderId/uploads/:uploadId', authenticateToken, async (req, res) => {
  try {
    // Verify the upload belongs to the user
    const upload = await Upload.findOne({
      _id: req.params.uploadId,
      user_id: req.user.userId
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Verify the folder belongs to the user
    const folder = await Folder.findOne({
      _id: req.params.folderId,
      user_id: req.user.userId
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Check if upload is already in folder
    if (!folder.uploads.includes(req.params.uploadId)) {
      folder.uploads.push(new mongoose.Types.ObjectId(req.params.uploadId));
      await folder.save();
    }

    res.json({ success: true, folder });
  } catch (error) {
    console.error('Error adding upload to folder:', error);
    res.status(500).json({ error: 'Failed to add upload to folder' });
  }
});

/**
 * Remove upload from folder
 */
router.delete('/folders/:folderId/uploads/:uploadId', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.folderId,
      user_id: req.user.userId
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    folder.uploads = folder.uploads.filter(
      id => id.toString() !== req.params.uploadId
    );
    await folder.save();

    res.json({ success: true, folder });
  } catch (error) {
    console.error('Error removing upload from folder:', error);
    res.status(500).json({ error: 'Failed to remove upload from folder' });
  }
});

export default router;
