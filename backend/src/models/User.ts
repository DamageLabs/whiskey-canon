import { db } from '../utils/database';
import bcrypt from 'bcryptjs';
import { User, Role, PublicProfile } from '../types';

export class UserModel {
  static async create(
    username: string,
    email: string,
    password: string,
    role: Role = Role.EDITOR,
    firstName?: string,
    lastName?: string
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password, role, first_name, last_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(username, email, hashedPassword, role, firstName || null, lastName || null);
    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  static findByUsername(username: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | undefined;
  }

  static findByEmail(email: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  }

  static async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static findAll(): User[] {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all() as User[];
  }

  static updateRole(id: number, role: Role): User | undefined {
    const stmt = db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(role, id);

    if (result.changes === 0) {
      return undefined;
    }

    return this.findById(id);
  }

  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static updateEmail(id: number, email: string): User | undefined {
    const stmt = db.prepare('UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(email, id);

    if (result.changes === 0) {
      return undefined;
    }

    return this.findById(id);
  }

  static async updatePassword(id: number, newPassword: string): Promise<User | undefined> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const stmt = db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(hashedPassword, id);

    if (result.changes === 0) {
      return undefined;
    }

    return this.findById(id);
  }

  static updateProfile(id: number, updates: { email?: string; firstName?: string; lastName?: string }): User | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }

    if (updates.firstName !== undefined) {
      fields.push('first_name = ?');
      values.push(updates.firstName || null);
    }

    if (updates.lastName !== undefined) {
      fields.push('last_name = ?');
      values.push(updates.lastName || null);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return undefined;
    }

    return this.findById(id);
  }

  static updateProfilePhoto(id: number, photoPath: string): User | undefined {
    const stmt = db.prepare('UPDATE users SET profile_photo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(photoPath, id);

    if (result.changes === 0) {
      return undefined;
    }

    return this.findById(id);
  }

  static setVerificationCode(id: number, code: string, expiresAt: Date): User | undefined {
    const stmt = db.prepare(`
      UPDATE users
      SET verification_code = ?,
          verification_code_expires_at = ?,
          verification_code_attempts = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(code, expiresAt.toISOString(), id);

    if (result.changes === 0) {
      return undefined;
    }

    return this.findById(id);
  }

  static incrementVerificationAttempts(id: number): number {
    const stmt = db.prepare(`
      UPDATE users
      SET verification_code_attempts = verification_code_attempts + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(id);

    const user = this.findById(id);
    return user?.verification_code_attempts || 0;
  }

  static markEmailVerified(id: number): User | undefined {
    const stmt = db.prepare(`
      UPDATE users
      SET email_verified = 1,
          verification_code = NULL,
          verification_code_expires_at = NULL,
          verification_code_attempts = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(id);

    if (result.changes === 0) {
      return undefined;
    }

    return this.findById(id);
  }

  static setPasswordResetToken(id: number, token: string, expiresAt: Date): User | undefined {
    const stmt = db.prepare(`
      UPDATE users
      SET password_reset_token = ?,
          password_reset_expires_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(token, expiresAt.toISOString(), id);

    if (result.changes === 0) {
      return undefined;
    }

    return this.findById(id);
  }

  static findByPasswordResetToken(token: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE password_reset_token = ?');
    return stmt.get(token) as User | undefined;
  }

  static clearPasswordResetToken(id: number): User | undefined {
    const stmt = db.prepare(`
      UPDATE users
      SET password_reset_token = NULL,
          password_reset_expires_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(id);

    if (result.changes === 0) {
      return undefined;
    }

    return this.findById(id);
  }

  static updateVisibility(id: number, isPublic: boolean): User | undefined {
    const stmt = db.prepare(`
      UPDATE users
      SET is_profile_public = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(isPublic ? 1 : 0, id);

    if (result.changes === 0) {
      return undefined;
    }

    return this.findById(id);
  }

  static getPublicProfile(username: string): PublicProfile | undefined {
    const stmt = db.prepare(`
      SELECT id, username, role, first_name, last_name, profile_photo, is_profile_public, created_at
      FROM users
      WHERE username = ?
    `);
    return stmt.get(username) as PublicProfile | undefined;
  }

  static findPublicProfiles(): PublicProfile[] {
    const stmt = db.prepare(`
      SELECT id, username, role, first_name, last_name, profile_photo, is_profile_public, created_at
      FROM users
      WHERE is_profile_public = 1
      ORDER BY created_at DESC
    `);
    return stmt.all() as PublicProfile[];
  }
}
