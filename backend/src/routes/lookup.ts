import { Router, Response } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { lookupLimiter } from '../middleware/rateLimiter';
import { config } from '../utils/config';
import { UserModel } from '../models/User';
import * as anthropicLookup from '../services/whiskey-lookup';
import * as openaiLookup from '../services/openai-lookup';
import * as ollamaLookup from '../services/ollama-lookup';

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

    // Ollama doesn't need an API key
    let apiKey: string | null = null;
    if (provider !== 'ollama') {
      apiKey = UserModel.getApiKey(req.user!.id, provider);
      if (!apiKey) {
        apiKey = provider === 'openai' ? config.openaiApiKey : config.anthropicApiKey;
      }
      if (!apiKey) {
        return res.status(400).json({
          error: 'No API key configured. Add your AI API key in Profile settings.',
        });
      }
    }

    // Per-user daily rate limit
    if (!checkDailyLimit(req.user!.id)) {
      return res.status(429).json({ error: 'Daily lookup limit reached. Try again tomorrow.' });
    }

    try {
      let result;

      if (provider === 'ollama') {
        // Ollama uses local inference — no API key needed
        if (req.file) {
          result = await ollamaLookup.lookupByImage(req.file.buffer, req.file.mimetype);
        } else {
          const { name } = req.body;
          if (!name || typeof name !== 'string' || !name.trim()) {
            return res
              .status(400)
              .json({ error: 'Provide a whiskey name or upload a label image.' });
          }
          result = await ollamaLookup.lookupByName(name.trim());
        }
      } else {
        const lookup = provider === 'openai' ? openaiLookup : anthropicLookup;

        if (req.file) {
          result = await lookup.lookupByImage(apiKey!, req.file.buffer, req.file.mimetype);
        } else {
          const { name } = req.body;
          if (!name || typeof name !== 'string' || !name.trim()) {
            return res
              .status(400)
              .json({ error: 'Provide a whiskey name or upload a label image.' });
          }
          result = await lookup.lookupByName(apiKey!, name.trim());
        }
      }

      if (!result) {
        return res.json({ found: false });
      }
      return res.json({ found: true, data: result });
    } catch (error: any) {
      console.error('Whiskey lookup error:', error);
      // Surface connection errors for Ollama clearly
      if (
        provider === 'ollama' &&
        (error?.code === 'ECONNREFUSED' || error?.cause?.code === 'ECONNREFUSED')
      ) {
        return res.status(503).json({
          error: 'Cannot connect to Ollama. Make sure Ollama is running.',
        });
      }
      return res.status(500).json({ error: 'Lookup failed. Please try again.' });
    }
  }
);

// GET /api/whiskeys/ollama/status — check Ollama connectivity and available models
router.get('/ollama/status', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const response = await fetch(`${config.ollamaBaseUrl}/api/tags`);
    if (!response.ok) {
      return res.json({ available: false, models: [] });
    }
    const data = (await response.json()) as { models?: { name: string }[] };
    const models = (data.models || []).map((m) => m.name);
    return res.json({ available: true, models });
  } catch {
    return res.json({ available: false, models: [] });
  }
});

export default router;
