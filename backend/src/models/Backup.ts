import { db } from '../utils/database';

export interface BackupRecord {
  id: number;
  user_id: number;
  filename: string;
  format: string;
  trigger_type: string;
  size_bytes: number | null;
  whiskey_count: number | null;
  comment_count: number | null;
  created_at: string;
}

export class BackupModel {
  static create(
    userId: number,
    filename: string,
    format: string,
    triggerType: string,
    sizeBytes: number,
    whiskeyCount: number,
    commentCount: number
  ): BackupRecord {
    const stmt = db.prepare(`
      INSERT INTO backups (user_id, filename, format, trigger_type, size_bytes, whiskey_count, comment_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      filename,
      format,
      triggerType,
      sizeBytes,
      whiskeyCount,
      commentCount
    );
    return this.findById(result.lastInsertRowid as number, userId)!;
  }

  static findByUserId(userId: number, limit: number = 50): BackupRecord[] {
    const stmt = db.prepare(
      'SELECT * FROM backups WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    );
    return stmt.all(userId, limit) as BackupRecord[];
  }

  static findById(id: number, userId: number): BackupRecord | undefined {
    const stmt = db.prepare('SELECT * FROM backups WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as BackupRecord | undefined;
  }

  static delete(id: number, userId: number): boolean {
    const stmt = db.prepare('DELETE FROM backups WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  static pruneExpired(userId: number, retentionDays: number): number {
    const stmt = db.prepare(`
      DELETE FROM backups
      WHERE user_id = ?
        AND created_at < datetime('now', '-' || ? || ' days')
    `);
    const result = stmt.run(userId, retentionDays);
    return result.changes;
  }

  static countByUserId(userId: number): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM backups WHERE user_id = ?');
    const result = stmt.get(userId) as { count: number };
    return result.count;
  }
}
