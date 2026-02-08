import express, { Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { validate } from '../middleware/validate';
import { UserModel } from '../models/User';
import { WhiskeyModel } from '../models/Whiskey';
import { Role } from '../types';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { Permission } from '../types';

const router = express.Router();

// All admin routes require authentication
router.use(requireAuth);

// Get all users (admin only)
router.get(
  '/users',
  requirePermission(Permission.MANAGE_USERS),
  (req: AuthRequest, res: Response) => {
    try {
      const users = UserModel.findAll();
      // Remove password hashes from response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json({ users: sanitizedUsers });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// Update user role (admin only)
router.put(
  '/users/:id/role',
  requirePermission(Permission.MANAGE_USERS),
  [
    param('id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
    body('role').isIn(Object.values(Role)).withMessage('Invalid role')
  ],
  (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = parseInt(req.params.id);

      // Prevent admin from changing their own role
      if (userId === req.user!.id) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }

      const user = UserModel.updateRole(userId, req.body.role);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password, ...userWithoutPassword } = user;
      res.json({
        message: 'User role updated successfully',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }
);

// Update user profile details (admin only)
router.put(
  '/users/:id',
  requirePermission(Permission.MANAGE_USERS),
  [
    param('id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('firstName').optional().trim(),
    body('lastName').optional().trim()
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const userId = parseInt(req.params.id);
      const { email, username, firstName, lastName } = req.body;

      // Check if email is already in use by another user
      if (email) {
        const existingUser = UserModel.findByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          res.status(400).json({ error: 'Email already in use' });
          return;
        }
      }

      // Check if username is already in use by another user
      if (username) {
        const existingUser = UserModel.findByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          res.status(400).json({ error: 'Username already in use' });
          return;
        }
      }

      const updates: { email?: string; firstName?: string; lastName?: string } = {};
      if (email !== undefined) updates.email = email;
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;

      const user = UserModel.updateProfile(userId, updates);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const { password, ...userWithoutPassword } = user;
      res.json({
        message: 'User profile updated successfully',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  }
);

// Delete user (admin only)
router.delete(
  '/users/:id',
  requirePermission(Permission.MANAGE_USERS),
  param('id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  validate,
  (req: AuthRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);

      // Prevent admin from deleting themselves
      if (userId === req.user!.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const deleted = UserModel.delete(userId);

      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

// Get all whiskeys from all users (admin only)
router.get(
  '/whiskeys',
  requirePermission(Permission.MANAGE_USERS),
  (req: AuthRequest, res: Response) => {
    try {
      const whiskeys = WhiskeyModel.findAllWithOwners();
      res.json({ whiskeys });
    } catch (error) {
      console.error('Error fetching whiskeys:', error);
      res.status(500).json({ error: 'Failed to fetch whiskeys' });
    }
  }
);

export default router;
