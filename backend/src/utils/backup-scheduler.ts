import * as cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { BackupScheduleModel } from '../models/BackupSchedule';
import { AdminBackupScheduleModel } from '../models/AdminBackupSchedule';
import { BackupModel } from '../models/Backup';
import { generateBackup } from '../services/backup-service';
import { config } from './config';
import { db } from './database';
import { logger } from './logger';

let scheduledTask: cron.ScheduledTask | null = null;

function runScheduledBackups() {
  const schedules = BackupScheduleModel.findAllActive();
  const now = new Date();

  for (const schedule of schedules) {
    if (!schedule.next_run_at) continue;

    const nextRun = new Date(schedule.next_run_at);
    if (now < nextRun) continue;

    try {
      generateBackup(schedule.user_id, schedule.format, 'scheduled');
      BackupScheduleModel.updateLastRun(schedule.user_id, schedule.interval);

      // Prune expired backups
      BackupModel.pruneExpired(schedule.user_id, schedule.retention_days);

      logger.info({ userId: schedule.user_id }, 'Scheduled backup completed');
    } catch (error) {
      logger.error({ err: error, userId: schedule.user_id }, 'Scheduled backup failed');
    }
  }
}

export function pruneAdminBackups(retentionDays: number): void {
  const backupDir = config.backupDir || path.join(__dirname, '../../backups');
  const adminDir = path.join(backupDir, 'admin');

  if (!fs.existsSync(adminDir)) return;

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(adminDir).filter((f) => f.startsWith('full-backup-') && f.endsWith('.db'));

  for (const file of files) {
    const filePath = path.join(adminDir, file);
    const mtime = fs.statSync(filePath).mtime.getTime();
    if (mtime < cutoff) {
      fs.unlinkSync(filePath);
      logger.info({ filename: file }, 'Pruned expired admin backup');
    }
  }
}

async function runAdminScheduledBackup(): Promise<void> {
  const schedule = AdminBackupScheduleModel.findActive();
  if (!schedule || !schedule.next_run_at) return;

  const now = new Date();
  const nextRun = new Date(schedule.next_run_at);
  if (now < nextRun) return;

  try {
    const backupDir = config.backupDir || path.join(__dirname, '../../backups');
    const adminDir = path.join(backupDir, 'admin');
    if (!fs.existsSync(adminDir)) {
      fs.mkdirSync(adminDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `full-backup-${timestamp}.db`;
    const filePath = path.join(adminDir, filename);

    await db.backup(filePath);

    AdminBackupScheduleModel.updateLastRun(schedule.interval);
    pruneAdminBackups(schedule.retention_days);

    logger.info({ filename }, 'Scheduled admin backup completed');
  } catch (error) {
    logger.error({ err: error }, 'Scheduled admin backup failed');
  }
}

export function startBackupScheduler() {
  // Run every hour to check for due backups
  scheduledTask = cron.schedule('0 * * * *', () => {
    logger.info('Running backup scheduler check');
    runScheduledBackups();
    runAdminScheduledBackup();
  });

  logger.info('Backup scheduler started');
}

export function stopBackupScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('Backup scheduler stopped');
  }
}
