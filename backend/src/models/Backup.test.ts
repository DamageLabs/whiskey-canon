import { describe, it, expect, beforeEach } from 'vitest';
import { BackupModel } from './Backup';
import { createTestUser } from '../test/helpers';
import { Role } from '../types';

describe('BackupModel', () => {
  let user: { id: number };

  beforeEach(async () => {
    user = await createTestUser('testuser', 'test@example.com', 'Wh1sk3yTest!!', Role.EDITOR);
  });

  describe('create', () => {
    it('creates a backup record', () => {
      const backup = BackupModel.create(user.id, 'backup-2024.json', 'json', 'manual', 1024, 10, 5);

      expect(backup).toBeDefined();
      expect(backup.id).toBeDefined();
      expect(backup.user_id).toBe(user.id);
      expect(backup.filename).toBe('backup-2024.json');
      expect(backup.format).toBe('json');
      expect(backup.trigger_type).toBe('manual');
      expect(backup.size_bytes).toBe(1024);
      expect(backup.whiskey_count).toBe(10);
      expect(backup.comment_count).toBe(5);
      expect(backup.created_at).toBeDefined();
    });
  });

  describe('findByUserId', () => {
    it('returns backups for a user', () => {
      BackupModel.create(user.id, 'backup-1.json', 'json', 'manual', 100, 5, 2);
      BackupModel.create(user.id, 'backup-2.json', 'json', 'scheduled', 200, 10, 3);

      const backups = BackupModel.findByUserId(user.id);

      expect(backups).toHaveLength(2);
    });

    it('returns empty array for user with no backups', () => {
      const backups = BackupModel.findByUserId(user.id);
      expect(backups).toEqual([]);
    });

    it('does not return other user backups', async () => {
      const user2 = await createTestUser(
        'user2',
        'user2@example.com',
        'Wh1sk3yTest!!',
        Role.EDITOR
      );
      BackupModel.create(user.id, 'backup-1.json', 'json', 'manual', 100, 5, 2);
      BackupModel.create(user2.id, 'backup-2.json', 'json', 'manual', 200, 10, 3);

      const backups = BackupModel.findByUserId(user.id);
      expect(backups).toHaveLength(1);
      expect(backups[0].user_id).toBe(user.id);
    });

    it('respects limit parameter', () => {
      BackupModel.create(user.id, 'backup-1.json', 'json', 'manual', 100, 5, 2);
      BackupModel.create(user.id, 'backup-2.json', 'json', 'manual', 200, 10, 3);
      BackupModel.create(user.id, 'backup-3.json', 'json', 'manual', 300, 15, 4);

      const backups = BackupModel.findByUserId(user.id, 2);
      expect(backups).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('finds backup by id scoped to user', () => {
      const created = BackupModel.create(user.id, 'backup-1.json', 'json', 'manual', 100, 5, 2);
      const found = BackupModel.findById(created.id, user.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('returns undefined for wrong user', async () => {
      const user2 = await createTestUser(
        'user2',
        'user2@example.com',
        'Wh1sk3yTest!!',
        Role.EDITOR
      );
      const created = BackupModel.create(user.id, 'backup-1.json', 'json', 'manual', 100, 5, 2);

      const found = BackupModel.findById(created.id, user2.id);
      expect(found).toBeUndefined();
    });

    it('returns undefined for non-existent id', () => {
      const found = BackupModel.findById(99999, user.id);
      expect(found).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('deletes a backup record', () => {
      const created = BackupModel.create(user.id, 'backup-1.json', 'json', 'manual', 100, 5, 2);
      const deleted = BackupModel.delete(created.id, user.id);

      expect(deleted).toBe(true);
      expect(BackupModel.findById(created.id, user.id)).toBeUndefined();
    });

    it('returns false for wrong user', async () => {
      const user2 = await createTestUser(
        'user2',
        'user2@example.com',
        'Wh1sk3yTest!!',
        Role.EDITOR
      );
      const created = BackupModel.create(user.id, 'backup-1.json', 'json', 'manual', 100, 5, 2);

      const deleted = BackupModel.delete(created.id, user2.id);
      expect(deleted).toBe(false);
    });

    it('returns false for non-existent backup', () => {
      const deleted = BackupModel.delete(99999, user.id);
      expect(deleted).toBe(false);
    });
  });

  describe('countByUserId', () => {
    it('returns correct count', () => {
      BackupModel.create(user.id, 'backup-1.json', 'json', 'manual', 100, 5, 2);
      BackupModel.create(user.id, 'backup-2.json', 'json', 'manual', 200, 10, 3);

      expect(BackupModel.countByUserId(user.id)).toBe(2);
    });

    it('returns 0 for user with no backups', () => {
      expect(BackupModel.countByUserId(user.id)).toBe(0);
    });
  });
});
