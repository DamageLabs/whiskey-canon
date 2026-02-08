import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserModel } from '../models/User';
import { Role } from '../types';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { uploadProfilePhoto } from '../middleware/upload';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { generateToken } from '../middleware/csrf';
import { generateVerificationCode, getVerificationCodeExpiry, isVerificationCodeExpired, generatePasswordResetToken, getPasswordResetTokenExpiry, isPasswordResetTokenExpired } from '../utils/verification';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import fs from 'fs';
import path from 'path';

const resendCooldowns = new Map<string, number>();

const router = express.Router();

// Get CSRF token
router.get('/csrf-token', (req: Request, res: Response) => {
  const token = generateToken(req, res);
  req.session.csrfInit = true;
  res.json({ token });
});

// Register
router.post(
  '/register',
  authLimiter,
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

      // Generate and store verification code
      const verificationCode = generateVerificationCode();
      const expiresAt = getVerificationCodeExpiry();
      UserModel.setVerificationCode(user.id, verificationCode, expiresAt);

      // Send verification email
      const emailSent = await sendVerificationEmail(email, verificationCode);

      if (!emailSent) {
        console.error('Failed to send verification email to:', email);
      }

      res.status(201).json({
        message: 'User created successfully. Please check your email to verify your account.',
        requiresVerification: true,
        email: email
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
  authLimiter,
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

      // Check if email is verified
      if (!user.email_verified) {
        return res.status(403).json({
          error: 'Please verify your email before logging in',
          requiresVerification: true,
          email: user.email
        });
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

// Verify email
router.post(
  '/verify-email',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('code').trim().isLength({ min: 8, max: 8 }).withMessage('Invalid verification code')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    try {
      const user = UserModel.findByEmail(email);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.email_verified) {
        return res.status(400).json({ error: 'Email is already verified' });
      }

      // Check attempts (rate limiting)
      if (user.verification_code_attempts >= 5) {
        return res.status(429).json({
          error: 'Too many verification attempts. Please request a new code.'
        });
      }

      // Increment attempts
      UserModel.incrementVerificationAttempts(user.id);

      // Check if code is expired
      if (!user.verification_code_expires_at || isVerificationCodeExpired(user.verification_code_expires_at)) {
        return res.status(400).json({
          error: 'Verification code has expired. Please request a new code.'
        });
      }

      // Validate code (case-insensitive)
      if (user.verification_code?.toUpperCase() !== code.toUpperCase()) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      // Mark email as verified
      const updatedUser = UserModel.markEmailVerified(user.id);

      if (!updatedUser) {
        return res.status(500).json({ error: 'Failed to verify email' });
      }

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Failed to verify email' });
    }
  }
);

// Resend verification email
router.post(
  '/resend-verification',
  [
    body('email').isEmail().withMessage('Invalid email')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      const user = UserModel.findByEmail(email);

      if (!user) {
        // Return success even if user not found (security: don't reveal if email exists)
        return res.json({ message: 'If an account exists with this email, a verification code has been sent.' });
      }

      if (user.email_verified) {
        return res.status(400).json({ error: 'Email is already verified' });
      }

      // Rate limiting: 1 request per minute
      const lastResend = resendCooldowns.get(email);
      const now = Date.now();
      if (lastResend && now - lastResend < 60000) {
        const remainingSeconds = Math.ceil((60000 - (now - lastResend)) / 1000);
        return res.status(429).json({
          error: `Please wait ${remainingSeconds} seconds before requesting a new code`
        });
      }

      // Generate new verification code
      const verificationCode = generateVerificationCode();
      const expiresAt = getVerificationCodeExpiry();
      UserModel.setVerificationCode(user.id, verificationCode, expiresAt);

      // Send verification email
      const emailSent = await sendVerificationEmail(email, verificationCode);

      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send verification email' });
      }

      // Update cooldown
      resendCooldowns.set(email, now);

      res.json({ message: 'Verification code sent successfully' });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ error: 'Failed to resend verification email' });
    }
  }
);

// Forgot password - request password reset
router.post(
  '/forgot-password',
  passwordResetLimiter,
  [
    body('email').isEmail().withMessage('Invalid email')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      const user = UserModel.findByEmail(email);

      // Always return success even if user not found (security: don't reveal if email exists)
      if (!user) {
        return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
      }

      // Generate password reset token
      const resetToken = generatePasswordResetToken();
      const expiresAt = getPasswordResetTokenExpiry();
      UserModel.setPasswordResetToken(user.id, resetToken, expiresAt);

      // Send password reset email
      const emailSent = await sendPasswordResetEmail(email, resetToken);

      if (!emailSent) {
        console.error('Failed to send password reset email to:', email);
      }

      res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  }
);

// Reset password - set new password with token
router.post(
  '/reset-password',
  passwordResetLimiter,
  [
    body('token').trim().notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    try {
      const user = UserModel.findByPasswordResetToken(token);

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Check if token is expired
      if (!user.password_reset_expires_at || isPasswordResetTokenExpired(user.password_reset_expires_at)) {
        UserModel.clearPasswordResetToken(user.id);
        return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
      }

      // Update password
      await UserModel.updatePassword(user.id, password);

      // Clear the reset token
      UserModel.clearPasswordResetToken(user.id);

      res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

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

// Update profile visibility
router.patch(
  '/settings/visibility',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { isPublic } = req.body;

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ error: 'isPublic must be a boolean' });
    }

    try {
      const updatedUser = UserModel.updateVisibility(req.user.id, isPublic);

      if (!updatedUser) {
        return res.status(500).json({ error: 'Failed to update visibility' });
      }

      // Don't send password in response
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({
        message: `Profile is now ${isPublic ? 'public' : 'private'}`,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Visibility update error:', error);
      res.status(500).json({ error: 'Failed to update visibility' });
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
