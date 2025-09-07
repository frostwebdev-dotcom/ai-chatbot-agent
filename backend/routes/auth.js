const express = require('express');
const { getFirestore } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/emailService');

const router = express.Router();
const db = getFirestore();

// Create or update user profile
router.post('/profile', authenticateToken, async (req, res) => {
  try {
    const { uid, email, name } = req.user;
    const { language = 'en', preferences = {} } = req.body;

    const userProfile = {
      uid,
      email,
      name: name || req.body.name || email.split('@')[0],
      language,
      preferences,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0
    };

    // Check if user already exists
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // New user - create profile and send welcome email
      await db.collection('users').doc(uid).set(userProfile);
      
      // Send welcome email (non-blocking)
      sendWelcomeEmail(email, userProfile.name).catch(console.error);
      
      res.status(201).json({ 
        message: 'User profile created successfully',
        user: userProfile,
        isNewUser: true
      });
    } else {
      // Existing user - update profile
      const updateData = {
        ...userProfile,
        createdAt: userDoc.data().createdAt, // Keep original creation date
        messageCount: userDoc.data().messageCount || 0 // Keep message count
      };
      
      await db.collection('users').doc(uid).update(updateData);
      
      res.json({ 
        message: 'User profile updated successfully',
        user: updateData,
        isNewUser: false
      });
    }
  } catch (error) {
    console.error('Profile creation/update error:', error);
    res.status(500).json({ error: 'Failed to create/update user profile' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({ user: userDoc.data() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user preferences
router.patch('/preferences', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { language, theme, notifications } = req.body;

    const updateData = {
      lastActivity: new Date().toISOString()
    };

    if (language) updateData.language = language;
    if (theme) updateData['preferences.theme'] = theme;
    if (notifications !== undefined) updateData['preferences.notifications'] = notifications;

    await db.collection('users').doc(uid).update(updateData);

    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    // Delete user chats
    const chatsQuery = db.collection('chats').where('userId', '==', uid);
    const chatsSnapshot = await chatsQuery.get();
    
    const batch = db.batch();
    chatsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user profile
    batch.delete(db.collection('users').doc(uid));

    await batch.commit();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
