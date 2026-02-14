import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  generateBackup,
  getBackupFilePath,
  deleteBackupFile,
  validateAndStoreUpload,
  restorePreview,
  restoreFromBackup,
} from './backup-service';
import { BackupModel } from '../models/Backup';
import { testDb } from '../test/setup';

// Helper to create a user and whiskeys for testing
function createUser(username = 'backupuser') {
  const stmt = testDb.prepare(
    "INSERT INTO users (username, email, password, role, email_verified) VALUES (?, ?, 'hashed', 'editor', 1)"
  );
  const result = stmt.run(username, `${username}@test.com`);
  return result.lastInsertRowid as number;
}

function createWhiskey(userId: number, name = 'Test Whiskey', distillery = 'Test Distillery') {
  const stmt = testDb.prepare(
    "INSERT INTO whiskeys (name, type, distillery, created_by) VALUES (?, 'bourbon', ?, ?)"
  );
  const result = stmt.run(name, distillery, userId);
  return result.lastInsertRowid as number;
}

function createComment(whiskeyId: number, userId: number, content = 'Test comment') {
  const stmt = testDb.prepare(
    'INSERT INTO whiskey_comments (whiskey_id, user_id, content) VALUES (?, ?, ?)'
  );
  const result = stmt.run(whiskeyId, userId, content);
  return result.lastInsertRowid as number;
}

// Track files created during tests for cleanup
const createdFiles: string[] = [];
const createdDirs: string[] = [];

afterEach(() => {
  for (const f of createdFiles) {
    try {
      fs.unlinkSync(f);
    } catch {}
  }
  createdFiles.length = 0;
  for (const d of createdDirs.reverse()) {
    try {
      fs.rmdirSync(d);
    } catch {}
  }
  createdDirs.length = 0;
});

describe('backup-service', () => {
  describe('generateBackup', () => {
    it('generates a JSON backup file and returns record', () => {
      const userId = createUser();
      const wId = createWhiskey(userId, 'Makers Mark', 'Makers');
      createComment(wId, userId, 'Great bourbon');

      const record = generateBackup(userId, 'json', 'manual');

      expect(record).toBeDefined();
      expect(record.format).toBe('json');
      expect(record.trigger_type).toBe('manual');
      expect(record.whiskey_count).toBe(1);
      expect(record.comment_count).toBe(1);

      // Verify file was written
      const backupDir = path.join(__dirname, '../../backups', String(userId));
      const filePath = path.join(backupDir, record.filename);
      createdFiles.push(filePath);
      createdDirs.push(backupDir);

      expect(fs.existsSync(filePath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(data.schemaVersion).toBe(1);
      expect(data.whiskeys).toHaveLength(1);
      expect(data.comments).toHaveLength(1);
    });

    it('generates a CSV backup file', () => {
      const userId = createUser('csvuser');
      createWhiskey(userId, 'Buffalo Trace', 'Buffalo Trace');

      const record = generateBackup(userId, 'csv', 'manual');

      expect(record.format).toBe('csv');

      const backupDir = path.join(__dirname, '../../backups', String(userId));
      const filePath = path.join(backupDir, record.filename);
      createdFiles.push(filePath);
      createdDirs.push(backupDir);

      const csv = fs.readFileSync(filePath, 'utf-8');
      expect(csv).toContain('Name,Type,Distillery');
      expect(csv).toContain('Buffalo Trace');
    });

    it('throws when user not found', () => {
      expect(() => generateBackup(999999, 'json', 'manual')).toThrow('User not found');
    });
  });

  describe('getBackupFilePath', () => {
    it('returns null for path traversal attempts', () => {
      const userId = createUser('traversaluser');
      const result = getBackupFilePath(userId, '../../../etc/passwd');
      expect(result).toBeNull();
    });

    it('returns null when file does not exist', () => {
      const userId = createUser('nofileuser');
      const result = getBackupFilePath(userId, 'nonexistent.json');
      expect(result).toBeNull();
    });

    it('returns path for existing file', () => {
      const userId = createUser('existfileuser');
      const record = generateBackup(userId, 'json', 'manual');

      const backupDir = path.join(__dirname, '../../backups', String(userId));
      createdFiles.push(path.join(backupDir, record.filename));
      createdDirs.push(backupDir);

      const result = getBackupFilePath(userId, record.filename);
      expect(result).not.toBeNull();
      expect(result).toContain(record.filename);
    });
  });

  describe('deleteBackupFile', () => {
    it('deletes an existing backup file and returns true', () => {
      const userId = createUser('deluser');
      const record = generateBackup(userId, 'json', 'manual');

      const backupDir = path.join(__dirname, '../../backups', String(userId));
      createdDirs.push(backupDir);

      const result = deleteBackupFile(userId, record.filename);
      expect(result).toBe(true);
      expect(fs.existsSync(path.join(backupDir, record.filename))).toBe(false);
    });

    it('returns false when file does not exist', () => {
      const userId = createUser('delnone');
      const result = deleteBackupFile(userId, 'nonexistent.json');
      expect(result).toBe(false);
    });
  });

  describe('validateAndStoreUpload', () => {
    it('stores valid JSON upload and returns backup record', () => {
      const userId = createUser('uploaduser');
      const backupData = {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        user: { id: userId, username: 'uploaduser' },
        whiskeys: [{ id: 1, name: 'Test', type: 'bourbon', distillery: 'Test' }],
        comments: [{ id: 1, whiskey_id: 1, user_id: userId, content: 'note' }],
      };
      const buffer = Buffer.from(JSON.stringify(backupData));

      const { backup, data } = validateAndStoreUpload(userId, buffer, 'backup.json');

      const backupDir = path.join(__dirname, '../../backups', String(userId));
      createdFiles.push(path.join(backupDir, backup.filename));
      createdDirs.push(backupDir);

      expect(backup).toBeDefined();
      expect(backup.format).toBe('json');
      expect(backup.trigger_type).toBe('upload');
      expect(data.whiskeys).toHaveLength(1);
    });

    it('throws for invalid JSON', () => {
      const userId = createUser('badjson');
      const buffer = Buffer.from('not json at all');

      expect(() => validateAndStoreUpload(userId, buffer, 'bad.json')).toThrow('Invalid JSON');
    });

    it('throws for missing schemaVersion', () => {
      const userId = createUser('noschema');
      const buffer = Buffer.from(JSON.stringify({ whiskeys: [], comments: [] }));

      expect(() => validateAndStoreUpload(userId, buffer, 'bad.json')).toThrow(
        'Missing or invalid schemaVersion'
      );
    });

    it('throws for missing whiskeys array', () => {
      const userId = createUser('nowhiskeys');
      const buffer = Buffer.from(JSON.stringify({ schemaVersion: 1, comments: [] }));

      expect(() => validateAndStoreUpload(userId, buffer, 'bad.json')).toThrow(
        'Missing or invalid whiskeys array'
      );
    });

    it('throws for missing comments array', () => {
      const userId = createUser('nocomments');
      const buffer = Buffer.from(JSON.stringify({ schemaVersion: 1, whiskeys: [] }));

      expect(() => validateAndStoreUpload(userId, buffer, 'bad.json')).toThrow(
        'Missing or invalid comments array'
      );
    });
  });

  describe('restorePreview', () => {
    it('returns preview with correct counts', () => {
      const userId = createUser('previewuser');
      createWhiskey(userId, 'Existing Whiskey', 'Existing Distillery');

      // Create backup with one new and one duplicate whiskey
      const backupData = {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        user: { id: userId, username: 'previewuser' },
        whiskeys: [
          { id: 10, name: 'Existing Whiskey', type: 'bourbon', distillery: 'Existing Distillery' },
          { id: 11, name: 'New Whiskey', type: 'bourbon', distillery: 'New Distillery' },
        ],
        comments: [{ id: 1, whiskey_id: 10, user_id: userId, content: 'note' }],
      };
      const buffer = Buffer.from(JSON.stringify(backupData));
      const { backup } = validateAndStoreUpload(userId, buffer, 'preview.json');

      const backupDir = path.join(__dirname, '../../backups', String(userId));
      createdFiles.push(path.join(backupDir, backup.filename));
      createdDirs.push(backupDir);

      const preview = restorePreview(userId, backup.id);

      expect(preview.whiskeyCount).toBe(2);
      expect(preview.commentCount).toBe(1);
      expect(preview.newWhiskeys).toBe(1);
      expect(preview.duplicateWhiskeys).toBe(1);
      expect(preview.newComments).toBe(1);
    });

    it('throws when backup not found', () => {
      const userId = createUser('nobackup');
      expect(() => restorePreview(userId, 999999)).toThrow('Backup not found');
    });

    it('throws for CSV backup', () => {
      const userId = createUser('csvpreview');
      const record = generateBackup(userId, 'csv', 'manual');

      const backupDir = path.join(__dirname, '../../backups', String(userId));
      createdFiles.push(path.join(backupDir, record.filename));
      createdDirs.push(backupDir);

      expect(() => restorePreview(userId, record.id)).toThrow('Only JSON backups can be restored');
    });
  });

  describe('restoreFromBackup', () => {
    function setupRestore(userId: number) {
      const backupData = {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        user: { id: userId, username: 'restoreuser' },
        whiskeys: [
          {
            id: 100,
            name: 'Restore Whiskey',
            type: 'bourbon',
            distillery: 'Restore Distillery',
            created_by: userId,
          },
        ],
        comments: [{ id: 200, whiskey_id: 100, user_id: userId, content: 'restored comment' }],
      };
      const buffer = Buffer.from(JSON.stringify(backupData));
      return validateAndStoreUpload(userId, buffer, 'restore.json');
    }

    it('inserts new whiskeys and comments', () => {
      const userId = createUser('restoreinsert');
      const { backup } = setupRestore(userId);

      const backupDir = path.join(__dirname, '../../backups', String(userId));
      createdFiles.push(path.join(backupDir, backup.filename));
      createdDirs.push(backupDir);

      const result = restoreFromBackup(userId, backup.id);

      expect(result.whiskeysRestored).toBe(1);
      expect(result.commentsRestored).toBe(1);
      expect(result.skipped).toBe(0);

      // Verify whiskey exists in DB
      const whiskeys = testDb
        .prepare('SELECT * FROM whiskeys WHERE created_by = ?')
        .all(userId) as any[];
      expect(whiskeys.some((w: any) => w.name === 'Restore Whiskey')).toBe(true);
    });

    it('skips duplicates with skip strategy', () => {
      const userId = createUser('restoreskip');
      createWhiskey(userId, 'Restore Whiskey', 'Restore Distillery');

      const { backup } = setupRestore(userId);

      const backupDir = path.join(__dirname, '../../backups', String(userId));
      createdFiles.push(path.join(backupDir, backup.filename));
      createdDirs.push(backupDir);

      const result = restoreFromBackup(userId, backup.id, 'skip');

      expect(result.whiskeysRestored).toBe(0);
      expect(result.skipped).toBe(1);
      // Comment should still be restored (mapped to existing whiskey)
      expect(result.commentsRestored).toBe(1);
    });

    it('overwrites duplicates with overwrite strategy', () => {
      const userId = createUser('restoreoverwrite');
      createWhiskey(userId, 'Restore Whiskey', 'Restore Distillery');

      const { backup } = setupRestore(userId);

      const backupDir = path.join(__dirname, '../../backups', String(userId));
      createdFiles.push(path.join(backupDir, backup.filename));
      createdDirs.push(backupDir);

      const result = restoreFromBackup(userId, backup.id, 'overwrite');

      expect(result.whiskeysRestored).toBe(1);
      expect(result.skipped).toBe(0);
    });

    it('throws when backup not found', () => {
      const userId = createUser('restorenone');
      expect(() => restoreFromBackup(userId, 999999)).toThrow('Backup not found');
    });

    it('throws for CSV backup', () => {
      const userId = createUser('restorecsv');
      const record = generateBackup(userId, 'csv', 'manual');

      const backupDir = path.join(__dirname, '../../backups', String(userId));
      createdFiles.push(path.join(backupDir, record.filename));
      createdDirs.push(backupDir);

      expect(() => restoreFromBackup(userId, record.id)).toThrow(
        'Only JSON backups can be restored'
      );
    });
  });
});
