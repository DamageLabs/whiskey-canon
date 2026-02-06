import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sendContactEmail } from '../utils/email';

const router = express.Router();

// Simple in-memory rate limiter: max 5 submissions per IP per 15 minutes
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(ip, recent);
  if (recent.length >= RATE_LIMIT_MAX) {
    return true;
  }
  recent.push(now);
  return false;
}

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name is required (max 200 characters)'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').trim().isLength({ min: 1, max: 200 }).withMessage('Subject is required (max 200 characters)'),
    body('message').trim().isLength({ min: 1, max: 5000 }).withMessage('Message is required (max 5000 characters)'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { name, email, subject, message } = req.body;

    try {
      const sent = await sendContactEmail(name, email, subject, message);
      if (!sent) {
        return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
      }
      res.json({ message: 'Message sent successfully' });
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ error: 'Failed to send message. Please try again later.' });
    }
  }
);

export default router;
