import { describe, it, expect, beforeEach } from 'vitest';
import { BackupScheduleModel } from './BackupSchedule';
import { createTestUser } from '../test/helpers';
import { Role } from '../types';

describe('BackupScheduleModel', () => {
  let user: { id: number };

  beforeEach(async () => {
    user = await createTestUser('testuser', 'test@example.com', 'Wh1sk3yTest!!', Role.EDITOR);
  });

  describe('upsert', () => {
    it('creates a new schedule', () => {
      const schedule = BackupScheduleModel.upsert(user.id, 'weekly', 'json', 30);

      expect(schedule).toBeDefined();
      expect(schedule.user_id).toBe(user.id);
      expect(schedule.interval).toBe('weekly');
      expect(schedule.format).toBe('json');
      expect(schedule.retention_days).toBe(30);
      expect(schedule.next_run_at).toBeDefined();
    });

    it('updates existing schedule', () => {
      BackupScheduleModel.upsert(user.id, 'weekly', 'json', 30);
      const updated = BackupScheduleModel.upsert(user.id, 'daily', 'csv', 7);

      expect(updated.interval).toBe('daily');
      expect(updated.format).toBe('csv');
      expect(updated.retention_days).toBe(7);
    });

    it('sets next_run_at to null when disabled', () => {
      const schedule = BackupScheduleModel.upsert(user.id, 'disabled', 'json', 30);

      expect(schedule.next_run_at).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('returns schedule for user', () => {
      BackupScheduleModel.upsert(user.id, 'weekly', 'json', 30);
      const found = BackupScheduleModel.findByUserId(user.id);

      expect(found).toBeDefined();
      expect(found?.interval).toBe('weekly');
    });

    it('returns undefined for user without schedule', () => {
      const found = BackupScheduleModel.findByUserId(user.id);
      expect(found).toBeUndefined();
    });
  });

  describe('findAllActive', () => {
    it('returns active schedules', async () => {
      const user2 = await createTestUser(
        'user2',
        'user2@example.com',
        'Wh1sk3yTest!!',
        Role.EDITOR
      );
      BackupScheduleModel.upsert(user.id, 'weekly', 'json', 30);
      BackupScheduleModel.upsert(user2.id, 'daily', 'json', 7);

      const active = BackupScheduleModel.findAllActive();
      expect(active).toHaveLength(2);
    });

    it('excludes disabled schedules', async () => {
      const user2 = await createTestUser(
        'user2',
        'user2@example.com',
        'Wh1sk3yTest!!',
        Role.EDITOR
      );
      BackupScheduleModel.upsert(user.id, 'weekly', 'json', 30);
      BackupScheduleModel.upsert(user2.id, 'disabled', 'json', 30);

      const active = BackupScheduleModel.findAllActive();
      expect(active).toHaveLength(1);
      expect(active[0].user_id).toBe(user.id);
    });
  });

  describe('updateLastRun', () => {
    it('updates last_run_at and recalculates next_run_at', () => {
      BackupScheduleModel.upsert(user.id, 'weekly', 'json', 30);
      BackupScheduleModel.updateLastRun(user.id, 'weekly');

      const schedule = BackupScheduleModel.findByUserId(user.id);
      expect(schedule?.last_run_at).toBeDefined();
      expect(schedule?.next_run_at).toBeDefined();
    });
  });

  describe('delete', () => {
    it('deletes a schedule', () => {
      BackupScheduleModel.upsert(user.id, 'weekly', 'json', 30);
      const deleted = BackupScheduleModel.delete(user.id);

      expect(deleted).toBe(true);
      expect(BackupScheduleModel.findByUserId(user.id)).toBeUndefined();
    });

    it('returns false for non-existent schedule', () => {
      const deleted = BackupScheduleModel.delete(user.id);
      expect(deleted).toBe(false);
    });
  });
});
