import { Router, Response } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { lookupLimiter } from '../middleware/rateLimiter';
import { config } from '../utils/config';
import { UserModel } from '../models/User';
import * as anthropicLookup from '../services/whiskey-lookup';
import * as openaiLookup from '../services/openai-lookup';

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

const router = Router();

// Per-user daily lookup counter (resets each day)
const dailyCounts = new Map<string, { count: number; date: string }>();
const DAILY_LIMIT = 100;

function checkDailyLimit(userId: number): boolean {
  const today = new Date().toISOString().split('T')[0];
  const key = `${userId}`;
  const entry = dailyCounts.get(key);
  if (!entry || entry.date !== today) {
    dailyCounts.set(key, { count: 1, date: today });
    return true;
  }
  if (entry.count >= DAILY_LIMIT) {
    return false;
  }
  entry.count++;
  return true;
}

// POST /api/whiskeys/lookup
router.post(
  '/lookup',
  requireAuth,
  lookupLimiter,
  (req: AuthRequest, res: Response, next) => {
    // Use multer only if content-type is multipart
    if (req.is('multipart/form-data')) {
      imageUpload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ error: `Upload error: ${err.message}` });
        }
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        next();
      });
    } else {
      next();
    }
  },
  async (req: AuthRequest, res: Response) => {
    // Determine provider and resolve API key
    const provider = UserModel.getAiProvider(req.user!.id);
    let apiKey = UserModel.getApiKey(req.user!.id, provider);
    if (!apiKey) {
      apiKey = provider === 'openai' ? config.openaiApiKey : config.anthropicApiKey;
    }

    if (!apiKey) {
      return res.status(400).json({
        error: 'No API key configured. Add your AI API key in Profile settings.',
      });
    }

    // Per-user daily rate limit
    if (!checkDailyLimit(req.user!.id)) {
      return res.status(429).json({ error: 'Daily lookup limit reached. Try again tomorrow.' });
    }

    const lookup = provider === 'openai' ? openaiLookup : anthropicLookup;

    try {
      // Image lookup
      if (req.file) {
        const result = await lookup.lookupByImage(apiKey, req.file.buffer, req.file.mimetype);
        if (!result) {
          return res.json({ found: false });
        }
        return res.json({ found: true, data: result });
      }

      // Text lookup
      const { name } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Provide a whiskey name or upload a label image.' });
      }

      const result = await lookup.lookupByName(apiKey, name.trim());
      if (!result) {
        return res.json({ found: false });
      }
      return res.json({ found: true, data: result });
    } catch (error) {
      console.error('Whiskey lookup error:', error);
      return res.status(500).json({ error: 'Lookup failed. Please try again.' });
    }
  }
);

export default router;
