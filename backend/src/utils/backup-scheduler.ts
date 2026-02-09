import * as cron from 'node-cron';
import { BackupScheduleModel } from '../models/BackupSchedule';
import { BackupModel } from '../models/Backup';
import { generateBackup } from '../services/backup-service';

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

      console.log(`Scheduled backup completed for user ${schedule.user_id}`);
    } catch (error) {
      console.error(`Scheduled backup failed for user ${schedule.user_id}:`, error);
    }
  }
}

export function startBackupScheduler() {
  // Run every hour to check for due backups
  scheduledTask = cron.schedule('0 * * * *', () => {
    console.log('Running backup scheduler check...');
    runScheduledBackups();
  });

  console.log('Backup scheduler started');
}

export function stopBackupScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('Backup scheduler stopped');
  }
}
