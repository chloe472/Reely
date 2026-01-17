import express from 'express';

const router = express.Router();

// Auth status check - Frontend will handle actual Supabase auth
// This endpoint verifies the user's session with the backend
router.get('/auth/status', (req, res) => {
  // The frontend sends the Supabase session token
  // For now, we just acknowledge the request
  // In production, you'd verify the JWT token here
  res.json({ 
    message: 'Auth endpoint ready',
    authenticated: false 
  });
});

// User profile endpoint - called after successful Supabase auth
router.post('/auth/profile', async (req, res) => {
  try {
    const { id, email, full_name, avatar_url } = req.body;
    
    if (!id || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Return the profile data
    // In production, you might want to store additional user data in MongoDB
    res.json({
      success: true,
      user: {
        id,
        email,
        full_name,
        avatar_url
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to process profile' });
  }
});

// Logout endpoint - for any cleanup needed
router.post('/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
