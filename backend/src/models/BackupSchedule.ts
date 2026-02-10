import { db } from '../utils/database';

export interface BackupScheduleRecord {
  id: number;
  user_id: number;
  interval: string;
  format: string;
  retention_days: number;
  last_run_at: string | null;
  next_run_at: string | null;
}

export class BackupScheduleModel {
  static findByUserId(userId: number): BackupScheduleRecord | undefined {
    const stmt = db.prepare('SELECT * FROM backup_schedules WHERE user_id = ?');
    return stmt.get(userId) as BackupScheduleRecord | undefined;
  }

  static upsert(
    userId: number,
    interval: string,
    format: string,
    retentionDays: number
  ): BackupScheduleRecord {
    const existing = this.findByUserId(userId);
    const nextRunAt = interval === 'disabled' ? null : this.calculateNextRun(interval);

    if (existing) {
      const stmt = db.prepare(`
        UPDATE backup_schedules
        SET interval = ?, format = ?, retention_days = ?, next_run_at = ?
        WHERE user_id = ?
      `);
      stmt.run(interval, format, retentionDays, nextRunAt, userId);
    } else {
      const stmt = db.prepare(`
        INSERT INTO backup_schedules (user_id, interval, format, retention_days, next_run_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(userId, interval, format, retentionDays, nextRunAt);
    }

    return this.findByUserId(userId)!;
  }

  static findAllActive(): BackupScheduleRecord[] {
    const stmt = db.prepare("SELECT * FROM backup_schedules WHERE interval != 'disabled'");
    return stmt.all() as BackupScheduleRecord[];
  }

  static updateLastRun(userId: number, interval: string): void {
    const nextRunAt = this.calculateNextRun(interval);
    const stmt = db.prepare(`
      UPDATE backup_schedules
      SET last_run_at = datetime('now'), next_run_at = ?
      WHERE user_id = ?
    `);
    stmt.run(nextRunAt, userId);
  }

  static delete(userId: number): boolean {
    const stmt = db.prepare('DELETE FROM backup_schedules WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes > 0;
  }

  private static calculateNextRun(interval: string): string | null {
    const now = new Date();
    switch (interval) {
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
