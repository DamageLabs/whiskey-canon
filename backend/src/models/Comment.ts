import { db } from '../utils/database';
import { WhiskeyComment } from '../types';

export class CommentModel {
  static create(whiskeyId: number, userId: number, content: string): WhiskeyComment {
    const stmt = db.prepare(`
      INSERT INTO whiskey_comments (whiskey_id, user_id, content)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(whiskeyId, userId, content);
    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): WhiskeyComment | undefined {
    const stmt = db.prepare(`
      SELECT c.*, u.username, u.profile_photo
      FROM whiskey_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `);
    return stmt.get(id) as WhiskeyComment | undefined;
  }

  static findByWhiskeyId(whiskeyId: number): WhiskeyComment[] {
    const stmt = db.prepare(`
      SELECT c.*, u.username, u.profile_photo
      FROM whiskey_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.whiskey_id = ?
      ORDER BY c.created_at DESC
    `);
    return stmt.all(whiskeyId) as WhiskeyComment[];
  }

  static countByWhiskeyId(whiskeyId: number): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM whiskey_comments WHERE whiskey_id = ?');
    const result = stmt.get(whiskeyId) as { count: number };
    return result.count;
  }

  static update(id: number, content: string): WhiskeyComment | undefined {
    const stmt = db.prepare(`
      UPDATE whiskey_comments
      SET content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(content, id);

    if (result.changes === 0) {
      return undefined;
    }

    return this.findById(id);
  }

  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM whiskey_comments WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static isOwner(commentId: number, userId: number): boolean {
    const stmt = db.prepare('SELECT user_id FROM whiskey_comments WHERE id = ?');
    const comment = stmt.get(commentId) as { user_id: number } | undefined;
    return comment?.user_id === userId;
  }
}
