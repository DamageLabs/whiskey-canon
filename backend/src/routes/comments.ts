import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { CommentModel } from '../models/Comment';
import { WhiskeyModel } from '../models/Whiskey';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { Role } from '../types';

const router = express.Router();

// Get comments for a whiskey
router.get(
  '/whiskey/:whiskeyId',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const whiskeyId = parseInt(req.params.whiskeyId);

    if (isNaN(whiskeyId)) {
      return res.status(400).json({ error: 'Invalid whiskey ID' });
    }

    try {
      // Check if user has access to this whiskey
      const whiskey = WhiskeyModel.findById(whiskeyId);
      if (!whiskey) {
        return res.status(404).json({ error: 'Whiskey not found' });
      }

      // Only owner or admin can view comments
      if (whiskey.created_by !== req.user!.id && req.user!.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Not authorized to view comments for this whiskey' });
      }

      const comments = CommentModel.findByWhiskeyId(whiskeyId);
      res.json({ comments });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }
);

// Get comment count for a whiskey
router.get(
  '/whiskey/:whiskeyId/count',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const whiskeyId = parseInt(req.params.whiskeyId);

    if (isNaN(whiskeyId)) {
      return res.status(400).json({ error: 'Invalid whiskey ID' });
    }

    try {
      const count = CommentModel.countByWhiskeyId(whiskeyId);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching comment count:', error);
      res.status(500).json({ error: 'Failed to fetch comment count' });
    }
  }
);

// Create a comment
router.post(
  '/whiskey/:whiskeyId',
  requireAuth,
  [
    body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment must be between 1 and 2000 characters')
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const whiskeyId = parseInt(req.params.whiskeyId);
    const { content } = req.body;

    if (isNaN(whiskeyId)) {
      return res.status(400).json({ error: 'Invalid whiskey ID' });
    }

    try {
      // Check if whiskey exists and user has access
      const whiskey = WhiskeyModel.findById(whiskeyId);
      if (!whiskey) {
        return res.status(404).json({ error: 'Whiskey not found' });
      }

      // Only owner or admin can add comments
      if (whiskey.created_by !== req.user!.id && req.user!.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Not authorized to comment on this whiskey' });
      }

      const comment = CommentModel.create(whiskeyId, req.user!.id, content);
      res.status(201).json({ comment, message: 'Comment added successfully' });
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  }
);

// Update a comment
router.put(
  '/:id',
  requireAuth,
  [
    body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment must be between 1 and 2000 characters')
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const commentId = parseInt(req.params.id);
    const { content } = req.body;

    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    try {
      // Check if user owns the comment or is admin
      if (!CommentModel.isOwner(commentId, req.user!.id) && req.user!.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Not authorized to update this comment' });
      }

      const comment = CommentModel.update(commentId, content);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      res.json({ comment, message: 'Comment updated successfully' });
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ error: 'Failed to update comment' });
    }
  }
);

// Delete a comment
router.delete(
  '/:id',
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const commentId = parseInt(req.params.id);

    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    try {
      // Check if user owns the comment or is admin
      if (!CommentModel.isOwner(commentId, req.user!.id) && req.user!.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Not authorized to delete this comment' });
      }

      const deleted = CommentModel.delete(commentId);
      if (!deleted) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  }
);

export default router;
