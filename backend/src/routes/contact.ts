import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sendContactEmail } from '../utils/email';
import { contactLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.post(
  '/',
  contactLimiter,
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
