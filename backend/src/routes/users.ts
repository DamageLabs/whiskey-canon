import express, { Response } from 'express';
import { param } from 'express-validator';
import { UserModel } from '../models/User';
import { WhiskeyModel } from '../models/Whiskey';
import { AuthRequest, attachUser } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Role } from '../types';

const router = express.Router();

// Get public stats for a user
// Returns 404 for private profiles to avoid leaking user existence
router.get(
  '/:username/stats',
  attachUser,
  param('username').trim().notEmpty().isLength({ min: 3, max: 50 }).withMessage('Invalid username'),
  validate,
  (req: AuthRequest, res: Response) => {
    const username = req.params.username as string;

    try {
      const profile = UserModel.getPublicProfile(username);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Check if profile is accessible
      const isOwner = req.user && req.user.id === profile.id;
      const isAdmin = req.user && req.user.role === Role.ADMIN;
      const isPublic = profile.is_profile_public === 1;

      if (!isPublic && !isOwner && !isAdmin) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const stats = WhiskeyModel.getPublicStats(profile.id);
      res.json({ stats });
    } catch (error) {
      req.log.error({ err: error }, 'Get public stats failed');
      res.status(500).json({ error: 'Failed to fetch stats', requestId: req.id });
    }
  }
);

// Get public profile by username
// Returns 404 for private profiles to avoid leaking user existence
router.get(
  '/:username',
  attachUser,
  param('username').trim().notEmpty().isLength({ min: 3, max: 50 }).withMessage('Invalid username'),
  validate,
  (req: AuthRequest, res: Response) => {
    const username = req.params.username as string;

    try {
      const profile = UserModel.getPublicProfile(username);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Check if profile is accessible:
      // 1. Profile is public
      // 2. Requester is the owner
      // 3. Requester is an admin
      const isOwner = req.user && req.user.id === profile.id;
      const isAdmin = req.user && req.user.role === Role.ADMIN;
      const isPublic = profile.is_profile_public === 1;

      if (!isPublic && !isOwner && !isAdmin) {
        // Return 404 instead of 403 to avoid leaking user existence
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json({ profile });
    } catch (error) {
      req.log.error({ err: error }, 'Get public profile failed');
      res.status(500).json({ error: 'Failed to fetch profile', requestId: req.id });
    }
  }
);

// List public profiles
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const profiles = UserModel.findPublicProfiles();
    res.json({ profiles });
  } catch (error) {
    req.log.error({ err: error }, 'List public profiles failed');
    res.status(500).json({ error: 'Failed to fetch profiles', requestId: req.id });
  }
});

export default router;
