import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createAuthenticatedAgent, createTestUser, createTestWhiskey } from '../test/helpers';
import type { Application } from 'express';
import { Role } from '../types';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

vi.mock('../utils/config', async () => {
  const original = await vi.importActual<typeof import('../utils/config')>('../utils/config');
  const p = await import('path');
  return {
    ...original,
    config: {
      ...original.config,
      backupDir: p.join(__dirname, '../../test-admin-backups'),
    },
  };
});

function getAdminBackupDir() {
  return path.join(__dirname, '../../test-admin-backups/admin');
}

function cleanup() {
  const dir = path.join(__dirname, '../../test-admin-backups');
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('Admin Backup Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 for unauthenticated backup create', async () => {
      const res = await request(app).post('/api/admin/backup');
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-admin backup create', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'editor', 'editor@test.com', 'Wh1sk3yTest!!', Role.EDITOR);
      const res = await agent.post('/api/admin/backup');
      expect(res.status).toBe(403);
    });

    it('returns 401 for unauthenticated backup list', async () => {
      const res = await request(app).get('/api/admin/backups');
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-admin backup list', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'editor', 'editor@test.com', 'Wh1sk3yTest!!', Role.EDITOR);
      const res = await agent.get('/api/admin/backups');
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/admin/backup', () => {
    it('creates a full database backup', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      const res = await agent.post('/api/admin/backup');

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Full database backup created successfully');
      expect(res.body.backup.filename).toMatch(/^full-backup-.*\.db$/);
      expect(res.body.backup.size_bytes).toBeGreaterThan(0);
      expect(res.body.backup.created_at).toBeDefined();

      // Verify file exists on disk
      const filePath = path.join(getAdminBackupDir(), res.body.backup.filename);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('GET /api/admin/backups', () => {
    it('returns empty list when no backups exist', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      const res = await agent.get('/api/admin/backups');

      expect(res.status).toBe(200);
      expect(res.body.backups).toEqual([]);
    });

    it('lists created backups', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      await agent.post('/api/admin/backup');
      await agent.post('/api/admin/backup');

      const res = await agent.get('/api/admin/backups');

      expect(res.status).toBe(200);
      expect(res.body.backups).toHaveLength(2);
      expect(res.body.backups[0].filename).toMatch(/^full-backup-.*\.db$/);
      expect(res.body.backups[0].size_bytes).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/backups/:filename/download', () => {
    it('downloads a backup file', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      const createRes = await agent.post('/api/admin/backup');
      const filename = createRes.body.backup.filename;

      const res = await agent.get(`/api/admin/backups/${filename}/download`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/x-sqlite3');
      expect(res.headers['content-disposition']).toContain(filename);
    });

    it('returns 400 for invalid filename', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      const res = await agent.get('/api/admin/backups/not-a-valid-backup.db/download');

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent backup', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      const res = await agent.get('/api/admin/backups/full-backup-nonexistent.db/download');

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/backups/:filename', () => {
    it('deletes a backup', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      const createRes = await agent.post('/api/admin/backup');
      const filename = createRes.body.backup.filename;

      const res = await agent.delete(`/api/admin/backups/${filename}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Backup deleted successfully');

      // Verify file is gone
      const filePath = path.join(getAdminBackupDir(), filename);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('returns 400 for invalid filename', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      const res = await agent.delete('/api/admin/backups/not-a-valid-backup.db');

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent backup', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      const res = await agent.delete('/api/admin/backups/full-backup-nonexistent.db');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/admin/backups/import', () => {
    it('imports a valid SQLite database file', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      // Create a valid SQLite file to upload
      const tmpPath = path.join(__dirname, '../../test-admin-backups/tmp-import.db');
      fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
      const tmpDb = new Database(tmpPath);
      tmpDb.exec('CREATE TABLE test (id INTEGER)');
      tmpDb.close();

      const res = await agent
        .post('/api/admin/backups/import')
        .attach('backup', tmpPath);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Backup imported successfully');
      expect(res.body.backup.filename).toMatch(/^full-backup-.*\.db$/);

      fs.unlinkSync(tmpPath);
    });

    it('rejects non-.db files', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      const tmpPath = path.join(__dirname, '../../test-admin-backups/bad.txt');
      fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
      fs.writeFileSync(tmpPath, 'not a database');

      const res = await agent
        .post('/api/admin/backups/import')
        .attach('backup', tmpPath);

      expect(res.status).toBe(400);
      fs.unlinkSync(tmpPath);
    });

    it('rejects files that are not valid SQLite databases', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      const tmpPath = path.join(__dirname, '../../test-admin-backups/fake.db');
      fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
      fs.writeFileSync(tmpPath, 'this is not a sqlite database at all');

      const res = await agent
        .post('/api/admin/backups/import')
        .attach('backup', tmpPath);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('File is not a valid SQLite database');
      fs.unlinkSync(tmpPath);
    });

    it('returns 400 when no file is uploaded', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      const res = await agent.post('/api/admin/backups/import');

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/admin/backups/:filename/restore', () => {
    it('restores database from a backup', async () => {
      const { agent, user: admin } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);
      const user2 = await createTestUser('user2', 'user2@test.com', 'Wh1sk3yTest!!');
      createTestWhiskey(user2.id, { name: 'Pappy Van Winkle' });

      // Create a backup with 2 users + 1 whiskey
      const createRes = await agent.post('/api/admin/backup');
      const filename = createRes.body.backup.filename;

      // Delete user2 (and their whiskey via cascade)
      await agent.delete(`/api/admin/users/${user2.id}`);

      // Verify user2 is gone
      let usersRes = await agent.get('/api/admin/users');
      expect(usersRes.body.users).toHaveLength(1);

      // Restore from backup
      const restoreRes = await agent.post(`/api/admin/backups/${filename}/restore`);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.message).toBe('Database restored successfully');
      expect(restoreRes.body.tablesRestored).toContain('users');
      expect(restoreRes.body.tablesRestored).toContain('whiskeys');

      // Verify user2 and whiskey are back
      usersRes = await agent.get('/api/admin/users');
      expect(usersRes.body.users).toHaveLength(2);

      const whiskeysRes = await agent.get('/api/admin/whiskeys');
      const pappy = whiskeysRes.body.whiskeys.find((w: any) => w.name === 'Pappy Van Winkle');
      expect(pappy).toBeDefined();
    });

    it('returns 400 for invalid filename', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      const res = await agent.post('/api/admin/backups/not-a-valid-backup.db/restore');

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent backup', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'Wh1sk3yTest!!', Role.ADMIN);

      const res = await agent.post('/api/admin/backups/full-backup-nonexistent.db/restore');

      expect(res.status).toBe(404);
    });
  });
});
