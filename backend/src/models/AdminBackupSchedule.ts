import { db } from '../utils/database';

export interface AdminBackupScheduleRecord {
  id: number;
  interval: string;
  retention_days: number;
  last_run_at: string | null;
  next_run_at: string | null;
}

export class AdminBackupScheduleModel {
  static find(): AdminBackupScheduleRecord | undefined {
    const stmt = db.prepare('SELECT * FROM admin_backup_schedules LIMIT 1');
    return stmt.get() as AdminBackupScheduleRecord | undefined;
  }

  static upsert(interval: string, retentionDays: number): AdminBackupScheduleRecord {
    const existing = this.find();
    const nextRunAt = interval === 'disabled' ? null : this.calculateNextRun(interval);

    if (existing) {
      const stmt = db.prepare(`
        UPDATE admin_backup_schedules
        SET interval = ?, retention_days = ?, next_run_at = ?
        WHERE id = ?
      `);
      stmt.run(interval, retentionDays, nextRunAt, existing.id);
    } else {
      const stmt = db.prepare(`
        INSERT INTO admin_backup_schedules (interval, retention_days, next_run_at)
        VALUES (?, ?, ?)
      `);
      stmt.run(interval, retentionDays, nextRunAt);
    }

    return this.find()!;
  }

  static findActive(): AdminBackupScheduleRecord | undefined {
    const stmt = db.prepare("SELECT * FROM admin_backup_schedules WHERE interval != 'disabled' LIMIT 1");
    return stmt.get() as AdminBackupScheduleRecord | undefined;
  }

  static updateLastRun(interval: string): void {
    const nextRunAt = this.calculateNextRun(interval);
    const stmt = db.prepare(`
      UPDATE admin_backup_schedules
      SET last_run_at = datetime('now'), next_run_at = ?
      WHERE id = (SELECT id FROM admin_backup_schedules LIMIT 1)
    `);
    stmt.run(nextRunAt);
  }

  static delete(): boolean {
    const stmt = db.prepare('DELETE FROM admin_backup_schedules');
    const result = stmt.run();
    return result.changes > 0;
  }

  private static calculateNextRun(interval: string): string | null {
    const now = new Date();
    switch (interval) {
      case 'hourly':
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        break;
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      default:
        return null;
    }
    return now.toISOString();
  }
}
