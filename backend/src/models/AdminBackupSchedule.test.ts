import { describe, it, expect } from 'vitest';
import { AdminBackupScheduleModel } from './AdminBackupSchedule';

describe('AdminBackupScheduleModel', () => {
  describe('upsert', () => {
    it('creates a new schedule', () => {
      const schedule = AdminBackupScheduleModel.upsert('weekly', 30);

      expect(schedule).toBeDefined();
      expect(schedule.interval).toBe('weekly');
      expect(schedule.retention_days).toBe(30);
      expect(schedule.next_run_at).toBeDefined();
    });

    it('updates existing schedule', () => {
      AdminBackupScheduleModel.upsert('weekly', 30);
      const updated = AdminBackupScheduleModel.upsert('daily', 7);

      expect(updated.interval).toBe('daily');
      expect(updated.retention_days).toBe(7);
    });

    it('sets next_run_at to null when disabled', () => {
      const schedule = AdminBackupScheduleModel.upsert('disabled', 30);

      expect(schedule.next_run_at).toBeNull();
    });
  });

  describe('find', () => {
    it('returns schedule when it exists', () => {
      AdminBackupScheduleModel.upsert('weekly', 30);
      const found = AdminBackupScheduleModel.find();

      expect(found).toBeDefined();
      expect(found?.interval).toBe('weekly');
    });

    it('returns undefined when no schedule exists', () => {
      const found = AdminBackupScheduleModel.find();
      expect(found).toBeUndefined();
    });
  });

  describe('findActive', () => {
    it('returns active schedule', () => {
      AdminBackupScheduleModel.upsert('daily', 7);

      const active = AdminBackupScheduleModel.findActive();
      expect(active).toBeDefined();
      expect(active?.interval).toBe('daily');
    });

    it('returns undefined when schedule is disabled', () => {
      AdminBackupScheduleModel.upsert('disabled', 30);

      const active = AdminBackupScheduleModel.findActive();
      expect(active).toBeUndefined();
    });

    it('returns undefined when no schedule exists', () => {
      const active = AdminBackupScheduleModel.findActive();
      expect(active).toBeUndefined();
    });
  });

  describe('updateLastRun', () => {
    it('updates last_run_at and recalculates next_run_at', () => {
      AdminBackupScheduleModel.upsert('weekly', 30);
      AdminBackupScheduleModel.updateLastRun('weekly');

      const schedule = AdminBackupScheduleModel.find();
      expect(schedule?.last_run_at).toBeDefined();
      expect(schedule?.next_run_at).toBeDefined();
    });
  });

  describe('delete', () => {
    it('deletes the schedule', () => {
      AdminBackupScheduleModel.upsert('weekly', 30);
      const deleted = AdminBackupScheduleModel.delete();

      expect(deleted).toBe(true);
      expect(AdminBackupScheduleModel.find()).toBeUndefined();
    });

    it('returns false when no schedule exists', () => {
      const deleted = AdminBackupScheduleModel.delete();
      expect(deleted).toBe(false);
    });
  });
});
