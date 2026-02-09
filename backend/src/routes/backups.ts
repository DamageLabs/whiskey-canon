import { Router, Response } from 'express';
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
} from '../services/backup-service';
import { backupLimiter } from '../middleware/rateLimiter';

const router = Router();

// All backup routes require authentication
router.use(requireAuth);

// POST /api/backups - Create a manual backup
router.post(
  '/',
  backupLimiter,
  [
    body('format')
      .isIn(['json', 'csv'])
      .withMessage('Format must be json or csv'),
  ],
  validate,
  (req: AuthRequest, res: Response) => {
    try {
      const { format } = req.body;
      const record = generateBackup(req.user!.id, format, 'manual');
      res.status(201).json({ backup: record, message: 'Backup created successfully' });
    } catch (error) {
      console.error('Backup creation error:', error);
      res.status(500).json({ error: 'Failed to create backup' });
    }
  }
);

// GET /api/backups - List user's backups
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const backups = BackupModel.findByUserId(req.user!.id);
    res.json({ backups });
  } catch (error) {
    console.error('Backup list error:', error);
    res.status(500).json({ error: 'Failed to list backups' });
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
    console.error('Schedule fetch error:', error);
    res.status(500).json({ error: 'Failed to get backup schedule' });
  }
});

// PUT /api/backups/schedule - Update backup schedule
router.put(
  '/schedule',
  [
    body('interval')
      .isIn(['disabled', 'daily', 'weekly', 'monthly'])
      .withMessage('Interval must be disabled, daily, weekly, or monthly'),
    body('format')
      .isIn(['json', 'csv'])
      .withMessage('Format must be json or csv'),
    body('retentionDays')
      .isInt({ min: 1, max: 365 })
      .withMessage('Retention days must be between 1 and 365'),
  ],
  validate,
  (req: AuthRequest, res: Response) => {
    try {
      const { interval, format, retentionDays } = req.body;
      const schedule = BackupScheduleModel.upsert(
        req.user!.id,
        interval,
        format,
        retentionDays
      );
      res.json({ schedule, message: 'Backup schedule updated' });
    } catch (error) {
      console.error('Schedule update error:', error);
      res.status(500).json({ error: 'Failed to update backup schedule' });
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
      const backupId = parseInt(req.params.id, 10);
      const record = BackupModel.findById(backupId, req.user!.id);

      if (!record) {
        return res.status(404).json({ error: 'Backup not found' });
      }

      const filePath = getBackupFilePath(req.user!.id, record.filename);
      if (!filePath) {
        return res.status(404).json({ error: 'Backup file not found' });
      }

      const contentType = record.format === 'json' ? 'application/json' : 'text/csv';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${record.filename}"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error('Backup download error:', error);
      res.status(500).json({ error: 'Failed to download backup' });
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
      const backupId = parseInt(req.params.id, 10);
      const { dryRun, conflictStrategy } = req.body;

      if (dryRun) {
        const preview = restorePreview(req.user!.id, backupId);
        return res.json({ preview });
      }

      const result = restoreFromBackup(
        req.user!.id,
        backupId,
        conflictStrategy || 'skip'
      );
      res.json({ result, message: 'Backup restored successfully' });
    } catch (error: any) {
      console.error('Backup restore error:', error);
      if (error.message === 'Backup not found' || error.message === 'Backup file not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Only JSON backups can be restored' || error.message === 'Invalid backup format') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to restore backup' });
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
      const backupId = parseInt(req.params.id, 10);
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
      console.error('Backup delete error:', error);
      res.status(500).json({ error: 'Failed to delete backup' });
    }
  }
);

export default router;
