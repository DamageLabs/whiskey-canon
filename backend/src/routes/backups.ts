import { Router, Response } from 'express';
import multer from 'multer';
import { body, param, query } from 'express-validator';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { BackupModel } from '../models/Backup';
import { BackupScheduleModel } from '../models/BackupSchedule';
import {
  generateBackup,
  getBackupFilePath,
  deleteBackupFile,
  restorePreview,
  restoreFromBackup,
  validateAndStoreUpload,
} from '../services/backup-service';
import { backupLimiter } from '../middleware/rateLimiter';
import fs from 'fs';

// Configure multer for JSON backup file uploads
const backupUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  },
});

const router = Router();

// All backup routes require authentication
router.use(requireAuth);

// POST /api/backups - Create a manual backup
router.post(
  '/',
  backupLimiter,
  [body('format').isIn(['json', 'csv']).withMessage('Format must be json or csv')],
  validate,
  (req: AuthRequest, res: Response) => {
    try {
      const { format } = req.body;
      const record = generateBackup(req.user!.id, format, 'manual');
      res.status(201).json({ backup: record, message: 'Backup created successfully' });
    } catch (error) {
      req.log.error({ err: error }, 'Backup creation failed');
      res.status(500).json({ error: 'Failed to create backup', requestId: req.id });
    }
  }
);

// POST /api/backups/upload - Upload an existing JSON backup file
router.post(
  '/upload',
  backupLimiter,
  (req: AuthRequest, res: Response, next) => {
    backupUpload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      }
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { backup } = validateAndStoreUpload(
        req.user!.id,
        req.file.buffer,
        req.file.originalname
      );

      res.status(201).json({ backup, message: 'Backup uploaded successfully' });
    } catch (error: any) {
      req.log.error({ err: error }, 'Backup upload failed');
      if (error.message === 'Invalid JSON file' || error.message.startsWith('Missing or invalid')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to upload backup', requestId: req.id });
    }
  }
);

// GET /api/backups - List user's backups
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const backups = BackupModel.findByUserId(req.user!.id);
    res.json({ backups });
  } catch (error) {
    req.log.error({ err: error }, 'Backup list failed');
    res.status(500).json({ error: 'Failed to list backups', requestId: req.id });
  }
});

// GET /api/backups/schedule - Get user's backup schedule
router.get('/schedule', (req: AuthRequest, res: Response) => {
  try {
    const schedule = BackupScheduleModel.findByUserId(req.user!.id);
    res.json({
      schedule: schedule || {
        interval: 'disabled',
        format: 'json',
        retention_days: 30,
      },
    });
  } catch (error) {
    req.log.error({ err: error }, 'Schedule fetch failed');
    res.status(500).json({ error: 'Failed to get backup schedule', requestId: req.id });
  }
});

// PUT /api/backups/schedule - Update backup schedule
router.put(
  '/schedule',
  [
    body('interval')
      .isIn(['disabled', 'hourly', 'daily', 'weekly', 'monthly'])
      .withMessage('Interval must be disabled, hourly, daily, weekly, or monthly'),
    body('format').isIn(['json', 'csv']).withMessage('Format must be json or csv'),
    body('retentionDays')
      .isInt({ min: 1, max: 365 })
      .withMessage('Retention days must be between 1 and 365'),
  ],
  validate,
  (req: AuthRequest, res: Response) => {
    try {
      const { interval, format, retentionDays } = req.body;
      const schedule = BackupScheduleModel.upsert(req.user!.id, interval, format, retentionDays);
      res.json({ schedule, message: 'Backup schedule updated' });
    } catch (error) {
      req.log.error({ err: error }, 'Schedule update failed');
      res.status(500).json({ error: 'Failed to update backup schedule', requestId: req.id });
    }
  }
);

// GET /api/backups/:id/download - Download a backup file
router.get(
  '/:id/download',
  [param('id').isInt({ min: 1 }).withMessage('Invalid backup ID')],
  validate,
  (req: AuthRequest, res: Response) => {
    try {
      const backupId = parseInt(req.params.id as string, 10);
      const record = BackupModel.findById(backupId, req.user!.id);

      if (!record) {
        return res.status(404).json({ error: 'Backup not found' });
      }

      const filePath = getBackupFilePath(req.user!.id, record.filename);
      if (!filePath) {
        return res.status(404).json({ error: 'Backup file not found' });
      }

      const contentType = record.format === 'json' ? 'application/json' : 'text/csv';
      const stat = fs.statSync(filePath);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `attachment; filename="${record.filename}"`);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (error) {
      req.log.error({ err: error }, 'Backup download failed');
      res.status(500).json({ error: 'Failed to download backup', requestId: req.id });
    }
  }
);

// POST /api/backups/:id/restore - Restore from a backup
router.post(
  '/:id/restore',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid backup ID'),
    body('dryRun').optional().isBoolean().withMessage('dryRun must be a boolean'),
    body('conflictStrategy')
      .optional()
      .isIn(['skip', 'overwrite'])
      .withMessage('conflictStrategy must be skip or overwrite'),
  ],
  validate,
  (req: AuthRequest, res: Response) => {
    try {
      const backupId = parseInt(req.params.id as string, 10);
      const { dryRun, conflictStrategy } = req.body;

      if (dryRun) {
        const preview = restorePreview(req.user!.id, backupId);
        return res.json({ preview });
      }

      const result = restoreFromBackup(req.user!.id, backupId, conflictStrategy || 'skip');
      res.json({ result, message: 'Backup restored successfully' });
    } catch (error: any) {
      req.log.error({ err: error }, 'Backup restore failed');
      if (error.message === 'Backup not found' || error.message === 'Backup file not found') {
        return res.status(404).json({ error: error.message });
      }
      if (
        error.message === 'Only JSON backups can be restored' ||
        error.message === 'Invalid backup format'
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to restore backup', requestId: req.id });
    }
  }
);

// DELETE /api/backups/:id - Delete a backup
router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('Invalid backup ID')],
  validate,
  (req: AuthRequest, res: Response) => {
    try {
      const backupId = parseInt(req.params.id as string, 10);
      const record = BackupModel.findById(backupId, req.user!.id);

      if (!record) {
        return res.status(404).json({ error: 'Backup not found' });
      }

      // Delete the file
      deleteBackupFile(req.user!.id, record.filename);

      // Delete the database record
      BackupModel.delete(backupId, req.user!.id);

      res.json({ message: 'Backup deleted successfully' });
    } catch (error) {
      req.log.error({ err: error }, 'Backup delete failed');
      res.status(500).json({ error: 'Failed to delete backup', requestId: req.id });
    }
  }
);

export default router;
