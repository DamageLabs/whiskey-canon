import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserModel } from '../models/User';
import { Role } from '../types';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { uploadProfilePhoto } from '../middleware/upload';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Register
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'editor']).withMessage('Invalid role'),
    body('firstName').optional().trim(),
    body('lastName').optional().trim()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role, firstName, lastName } = req.body;

    try {
      // Check if user already exists
      if (UserModel.findByUsername(username)) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      if (UserModel.findByEmail(email)) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const user = await UserModel.create(username, email, password, role || Role.EDITOR, firstName, lastName);

      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        message: 'User created successfully',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const user = UserModel.findByUsername(username);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await UserModel.validatePassword(password, user.password);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Set session
      req.session.userId = user.id;

      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }
);

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
});

// Get current user
router.get('/me', requireAuth, (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { password: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Update profile
router.put(
  '/profile',
  requireAuth,
  [
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('currentPassword').optional().notEmpty().withMessage('Current password is required'),
    body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { email, firstName, lastName, currentPassword, newPassword } = req.body;

    try {
      let updatedUser = req.user;

      // Update profile fields (email, firstName, lastName) if any are provided
      if (email !== undefined || firstName !== undefined || lastName !== undefined) {
        // Check if email is already in use by another user
        if (email && email !== req.user.email) {
          const existingUser = UserModel.findByEmail(email);
          if (existingUser && existingUser.id !== req.user.id) {
            return res.status(400).json({ error: 'Email already in use' });
          }
        }

        const updates: { email?: string; firstName?: string; lastName?: string } = {};
        if (email !== undefined) updates.email = email;
        if (firstName !== undefined) updates.firstName = firstName;
        if (lastName !== undefined) updates.lastName = lastName;

        const result = UserModel.updateProfile(req.user.id, updates);
        if (!result) {
          return res.status(500).json({ error: 'Failed to update profile' });
        }
        updatedUser = result;
      }

      // Update password if provided
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to change password' });
        }

        // Verify current password
        const isValid = await UserModel.validatePassword(currentPassword, req.user.password);
        if (!isValid) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const result = await UserModel.updatePassword(req.user.id, newPassword);
        if (!result) {
          return res.status(500).json({ error: 'Failed to update password' });
        }
        updatedUser = result;
      }

      // Don't send password in response
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({
        message: 'Profile updated successfully',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Upload profile photo
router.post(
  '/profile/photo',
  requireAuth,
  uploadProfilePhoto.single('photo'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Delete old profile photo if it exists
      if (req.user.profile_photo) {
        const oldPhotoPath = path.join(__dirname, '../../uploads/profiles', path.basename(req.user.profile_photo));
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      // Store relative path to the photo
      const photoPath = `/uploads/profiles/${req.file.filename}`;
      const updatedUser = UserModel.updateProfilePhoto(req.user.id, photoPath);

      if (!updatedUser) {
        return res.status(500).json({ error: 'Failed to update profile photo' });
      }

      // Don't send password in response
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({
        message: 'Profile photo updated successfully',
        user: userWithoutPassword
      });
    } catch (error: any) {
      console.error('Profile photo upload error:', error);

      // Delete uploaded file if there was an error
      if (req.file) {
        const filePath = path.join(__dirname, '../../uploads/profiles', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      if (error.message.includes('Invalid file type')) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to upload profile photo' });
    }
  }
);

// Delete profile photo
router.delete('/profile/photo', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!req.user.profile_photo) {
      return res.status(400).json({ error: 'No profile photo to delete' });
    }

    // Delete the photo file
    const photoPath = path.join(__dirname, '../../uploads/profiles', path.basename(req.user.profile_photo));
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    // Update database
    const updatedUser = UserModel.updateProfilePhoto(req.user.id, '');

    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to delete profile photo' });
    }

    // Don't send password in response
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Profile photo deleted successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Profile photo delete error:', error);
    res.status(500).json({ error: 'Failed to delete profile photo' });
  }
});

export default router;
