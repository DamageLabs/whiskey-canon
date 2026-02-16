import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createAuthenticatedAgent } from '../test/helpers';
import { createTestWhiskey } from '../test/helpers';
import type { Application } from 'express';
import fs from 'fs';
import path from 'path';

// vi.mock is hoisted — cannot reference variables declared in the same scope
vi.mock('../utils/config', async () => {
  const original = await vi.importActual<typeof import('../utils/config')>('../utils/config');
  const p = await import('path');
  return {
    ...original,
    config: {
      ...original.config,
      backupDir: p.join(__dirname, '../../test-backups'),
      backupMaxSizeMb: 50,
    },
  };
});

function getTestBackupDir() {
  return path.join(__dirname, '../../test-backups');
}

function cleanupTestBackups() {
  const dir = getTestBackupDir();
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('Backup Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    cleanupTestBackups();
  });

  afterEach(() => {
    cleanupTestBackups();
  });

  describe('Authentication', () => {
    it('returns 401 for unauthenticated POST /api/backups', async () => {
      const response = await request(app).post('/api/backups').send({ format: 'json' });
      expect(response.status).toBe(401);
    });

    it('returns 401 for unauthenticated GET /api/backups', async () => {
      const response = await request(app).get('/api/backups');
      expect(response.status).toBe(401);
    });

    it('returns 401 for unauthenticated GET /api/backups/schedule', async () => {
      const response = await request(app).get('/api/backups/schedule');
      expect(response.status).toBe(401);
    });

    it('returns 401 for unauthenticated PUT /api/backups/schedule', async () => {
      const response = await request(app)
        .put('/api/backups/schedule')
        .send({ interval: 'weekly', format: 'json', retentionDays: 30 });
      expect(response.status).toBe(401);
    });

    it('returns 401 for unauthenticated DELETE /api/backups/1', async () => {
      const response = await request(app).delete('/api/backups/1');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/backups', () => {
    it('creates a JSON backup', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      createTestWhiskey(user.id, { name: "Maker's Mark" });

      const response = await agent.post('/api/backups').send({ format: 'json' });

      expect(response.status).toBe(201);
      expect(response.body.backup).toBeDefined();
      expect(response.body.backup.format).toBe('json');
      expect(response.body.backup.trigger_type).toBe('manual');
      expect(response.body.backup.whiskey_count).toBe(1);
      expect(response.body.message).toBe('Backup created successfully');
    });

    it('creates a CSV backup', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      createTestWhiskey(user.id);

      const response = await agent.post('/api/backups').send({ format: 'csv' });

      expect(response.status).toBe(201);
      expect(response.body.backup.format).toBe('csv');
    });

    it('validates format field', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.post('/api/backups').send({ format: 'xml' });

      expect(response.status).toBe(400);
    });

    it('returns 400 when format is missing', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.post('/api/backups').send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/backups', () => {
    it('lists user backups', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      await agent.post('/api/backups').send({ format: 'json' });
      await agent.post('/api/backups').send({ format: 'csv' });

      const response = await agent.get('/api/backups');

      expect(response.status).toBe(200);
      expect(response.body.backups).toHaveLength(2);
    });

    it('returns empty array when no backups exist', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/backups');

      expect(response.status).toBe(200);
      expect(response.body.backups).toEqual([]);
    });

    it('does not show other user backups', async () => {
      const { agent: agent1 } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const { agent: agent2 } = await createAuthenticatedAgent(app, 'user2', 'user2@test.com');

      await agent1.post('/api/backups').send({ format: 'json' });

      const response = await agent2.get('/api/backups');
      expect(response.body.backups).toEqual([]);
    });
  });

  describe('GET /api/backups/:id/download', () => {
    it('downloads a backup file', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const createResponse = await agent.post('/api/backups').send({ format: 'json' });
      const backupId = createResponse.body.backup.id;

      const response = await agent.get(`/api/backups/${backupId}/download`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('returns 404 for non-existent backup', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/backups/99999/download');

      expect(response.status).toBe(404);
    });

    it('returns 404 for another user backup', async () => {
      const { agent: agent1 } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const { agent: agent2 } = await createAuthenticatedAgent(app, 'user2', 'user2@test.com');

      const createResponse = await agent1.post('/api/backups').send({ format: 'json' });
      const backupId = createResponse.body.backup.id;

      const response = await agent2.get(`/api/backups/${backupId}/download`);
      expect(response.status).toBe(404);
    });

    it('returns 400 for invalid ID', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/backups/abc/download');
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/backups/:id', () => {
    it('deletes a backup', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const createResponse = await agent.post('/api/backups').send({ format: 'json' });
      const backupId = createResponse.body.backup.id;

      const response = await agent.delete(`/api/backups/${backupId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Backup deleted successfully');

      const listResponse = await agent.get('/api/backups');
      expect(listResponse.body.backups).toHaveLength(0);
    });

    it('returns 404 for non-existent backup', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.delete('/api/backups/99999');
      expect(response.status).toBe(404);
    });

    it('cannot delete another user backup', async () => {
      const { agent: agent1 } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const { agent: agent2 } = await createAuthenticatedAgent(app, 'user2', 'user2@test.com');

      const createResponse = await agent1.post('/api/backups').send({ format: 'json' });
      const backupId = createResponse.body.backup.id;

      const response = await agent2.delete(`/api/backups/${backupId}`);
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/backups/schedule', () => {
    it('returns default schedule when none exists', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/backups/schedule');

      expect(response.status).toBe(200);
      expect(response.body.schedule.interval).toBe('disabled');
      expect(response.body.schedule.format).toBe('json');
      expect(response.body.schedule.retention_days).toBe(30);
    });

    it('returns user schedule after configuration', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      await agent
        .put('/api/backups/schedule')
        .send({ interval: 'weekly', format: 'json', retentionDays: 14 });

      const response = await agent.get('/api/backups/schedule');

      expect(response.status).toBe(200);
      expect(response.body.schedule.interval).toBe('weekly');
      expect(response.body.schedule.retention_days).toBe(14);
    });
  });

  describe('PUT /api/backups/schedule', () => {
    it('creates a backup schedule', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .put('/api/backups/schedule')
        .send({ interval: 'daily', format: 'json', retentionDays: 7 });

      expect(response.status).toBe(200);
      expect(response.body.schedule.interval).toBe('daily');
      expect(response.body.schedule.format).toBe('json');
      expect(response.body.message).toBe('Backup schedule updated');
    });

    it('validates interval', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .put('/api/backups/schedule')
        .send({ interval: 'every_minute', format: 'json', retentionDays: 30 });

      expect(response.status).toBe(400);
    });

    it('validates format', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .put('/api/backups/schedule')
        .send({ interval: 'weekly', format: 'xml', retentionDays: 30 });

      expect(response.status).toBe(400);
    });

    it('validates retentionDays range', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .put('/api/backups/schedule')
        .send({ interval: 'weekly', format: 'json', retentionDays: 0 });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/backups/:id/restore', () => {
    it('returns preview with dryRun=true', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      createTestWhiskey(user.id, { name: 'Buffalo Trace' });

      const createResponse = await agent.post('/api/backups').send({ format: 'json' });
      const backupId = createResponse.body.backup.id;

      const response = await agent.post(`/api/backups/${backupId}/restore`).send({ dryRun: true });

      expect(response.status).toBe(200);
      expect(response.body.preview).toBeDefined();
      expect(response.body.preview.whiskeyCount).toBe(1);
    });

    it('restores a backup with skip strategy', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      createTestWhiskey(user.id, { name: 'Buffalo Trace' });

      const createResponse = await agent.post('/api/backups').send({ format: 'json' });
      const backupId = createResponse.body.backup.id;

      const response = await agent
        .post(`/api/backups/${backupId}/restore`)
        .send({ dryRun: false, conflictStrategy: 'skip' });

      expect(response.status).toBe(200);
      expect(response.body.result).toBeDefined();
      expect(response.body.message).toBe('Backup restored successfully');
    });

    it('returns 404 for non-existent backup', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.post('/api/backups/99999/restore').send({ dryRun: true });

      expect(response.status).toBe(404);
    });

    it('returns 400 for CSV backup restore', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const createResponse = await agent.post('/api/backups').send({ format: 'csv' });
      const backupId = createResponse.body.backup.id;

      const response = await agent.post(`/api/backups/${backupId}/restore`).send({ dryRun: true });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Only JSON backups can be restored');
    });

    it('returns 400 for invalid backup ID', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.post('/api/backups/abc/restore').send({ dryRun: true });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/backups/upload', () => {
    it('returns 401 for unauthenticated upload', async () => {
      const response = await request(app)
        .post('/api/backups/upload')
        .attach('file', Buffer.from('{}'), 'backup.json');
      expect(response.status).toBe(401);
    });

    it('uploads a valid JSON backup file', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      createTestWhiskey(user.id, { name: 'Buffalo Trace', distillery: 'Buffalo Trace' });

      // First create a backup to get valid data
      const createResponse = await agent.post('/api/backups').send({ format: 'json' });
      const backupId = createResponse.body.backup.id;
      const downloadResponse = await agent.get(`/api/backups/${backupId}/download`);
      const backupContent = JSON.stringify(downloadResponse.body);

      const response = await agent
        .post('/api/backups/upload')
        .attach('file', Buffer.from(backupContent), 'my-backup.json');

      expect(response.status).toBe(201);
      expect(response.body.backup).toBeDefined();
      expect(response.body.backup.format).toBe('json');
      expect(response.body.backup.trigger_type).toBe('upload');
      expect(response.body.backup.whiskey_count).toBe(1);
      expect(response.body.message).toBe('Backup uploaded successfully');
    });

    it('can restore from an uploaded backup', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      createTestWhiskey(user.id, { name: 'Buffalo Trace', distillery: 'Buffalo Trace' });

      // Create and download a backup
      const createResponse = await agent.post('/api/backups').send({ format: 'json' });
      const backupId = createResponse.body.backup.id;
      const downloadResponse = await agent.get(`/api/backups/${backupId}/download`);
      const backupContent = JSON.stringify(downloadResponse.body);

      // Upload the backup
      const uploadResponse = await agent
        .post('/api/backups/upload')
        .attach('file', Buffer.from(backupContent), 'my-backup.json');
      const uploadedId = uploadResponse.body.backup.id;

      // Preview restore
      const previewResponse = await agent
        .post(`/api/backups/${uploadedId}/restore`)
        .send({ dryRun: true });

      expect(previewResponse.status).toBe(200);
      expect(previewResponse.body.preview).toBeDefined();
      expect(previewResponse.body.preview.whiskeyCount).toBe(1);
    });

    it('returns 400 for invalid JSON content', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/backups/upload')
        .attach('file', Buffer.from('not valid json'), 'backup.json');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid JSON file');
    });

    it('returns 400 for JSON missing schemaVersion', async () => {
      const { agent } = await createAuthenticatedAgent(app);
      const content = JSON.stringify({ whiskeys: [], comments: [] });

      const response = await agent
        .post('/api/backups/upload')
        .attach('file', Buffer.from(content), 'backup.json');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing or invalid schemaVersion');
    });

    it('returns 400 for JSON missing whiskeys array', async () => {
      const { agent } = await createAuthenticatedAgent(app);
      const content = JSON.stringify({ schemaVersion: 1, comments: [] });

      const response = await agent
        .post('/api/backups/upload')
        .attach('file', Buffer.from(content), 'backup.json');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing or invalid whiskeys array');
    });

    it('returns 400 for JSON missing comments array', async () => {
      const { agent } = await createAuthenticatedAgent(app);
      const content = JSON.stringify({ schemaVersion: 1, whiskeys: [] });

      const response = await agent
        .post('/api/backups/upload')
        .attach('file', Buffer.from(content), 'backup.json');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing or invalid comments array');
    });

    it('returns 400 for non-JSON file', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/backups/upload')
        .attach('file', Buffer.from('col1,col2\nval1,val2'), 'backup.csv');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Only JSON files are allowed');
    });

    it('returns 400 when no file is provided', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.post('/api/backups/upload');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No file uploaded');
    });

    it('uploaded backup appears in backup list', async () => {
      const { agent } = await createAuthenticatedAgent(app);
      const content = JSON.stringify({
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        user: {},
        whiskeys: [],
        comments: [],
      });

      await agent.post('/api/backups/upload').attach('file', Buffer.from(content), 'backup.json');

      const listResponse = await agent.get('/api/backups');
      expect(listResponse.body.backups).toHaveLength(1);
      expect(listResponse.body.backups[0].trigger_type).toBe('upload');
    });

    it('other users cannot see uploaded backups', async () => {
      const { agent: agent1 } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const { agent: agent2 } = await createAuthenticatedAgent(app, 'user2', 'user2@test.com');

      const content = JSON.stringify({
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        user: {},
        whiskeys: [],
        comments: [],
      });

      await agent1.post('/api/backups/upload').attach('file', Buffer.from(content), 'backup.json');

      const listResponse = await agent2.get('/api/backups');
      expect(listResponse.body.backups).toHaveLength(0);
    });
  });

  describe('User Isolation', () => {
    it('users cannot access each other backups', async () => {
      const { agent: agent1 } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const { agent: agent2 } = await createAuthenticatedAgent(app, 'user2', 'user2@test.com');

      const createResponse = await agent1.post('/api/backups').send({ format: 'json' });
      const backupId = createResponse.body.backup.id;

      expect((await agent2.get(`/api/backups/${backupId}/download`)).status).toBe(404);
      expect((await agent2.delete(`/api/backups/${backupId}`)).status).toBe(404);
      expect(
        (await agent2.post(`/api/backups/${backupId}/restore`).send({ dryRun: true })).status
      ).toBe(404);
    });
  });
});
