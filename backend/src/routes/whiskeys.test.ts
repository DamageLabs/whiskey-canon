import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createAuthenticatedAgent, createTestWhiskey } from '../test/helpers';
import { Role, WhiskeyType } from '../types';
import type { Application } from 'express';
import { WhiskeyModel } from '../models/Whiskey';

describe('Whiskey Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Authentication', () => {
    it('returns 401 for unauthenticated requests to GET /api/whiskeys', async () => {
      const response = await request(app).get('/api/whiskeys');
      expect(response.status).toBe(401);
    });

    it('returns 401 for unauthenticated requests to POST /api/whiskeys', async () => {
      const response = await request(app)
        .post('/api/whiskeys')
        .send({ name: 'Test', type: 'bourbon', distillery: 'Test' });
      expect(response.status).toBe(401);
    });

    it('returns 401 for unauthenticated requests to GET /api/whiskeys/:id', async () => {
      const response = await request(app).get('/api/whiskeys/1');
      expect(response.status).toBe(401);
    });

    it('returns 401 for unauthenticated requests to PUT /api/whiskeys/:id', async () => {
      const response = await request(app)
        .put('/api/whiskeys/1')
        .send({ name: 'Updated' });
      expect(response.status).toBe(401);
    });

    it('returns 401 for unauthenticated requests to DELETE /api/whiskeys/:id', async () => {
      const response = await request(app).delete('/api/whiskeys/1');
      expect(response.status).toBe(401);
    });

    it('returns 401 for unauthenticated requests to GET /api/whiskeys/search', async () => {
      const response = await request(app).get('/api/whiskeys/search?q=test');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/whiskeys', () => {
    it('returns empty array when user has no whiskeys', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/whiskeys');

      expect(response.status).toBe(200);
      expect(response.body.whiskeys).toEqual([]);
    });

    it('returns only user\'s own whiskeys', async () => {
      const { agent, user } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const user2 = await createTestUser('user2', 'user2@test.com', 'password123');

      // Create whiskeys for both users
      createTestWhiskey(user.id, { name: 'User1 Whiskey' });
      createTestWhiskey(user2.id, { name: 'User2 Whiskey' });

      const response = await agent.get('/api/whiskeys');

      expect(response.status).toBe(200);
      expect(response.body.whiskeys).toHaveLength(1);
      expect(response.body.whiskeys[0].name).toBe('User1 Whiskey');
    });

    it('filters by type', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      createTestWhiskey(user.id, { name: 'Bourbon 1', type: WhiskeyType.BOURBON });
      createTestWhiskey(user.id, { name: 'Scotch 1', type: WhiskeyType.SCOTCH });

      const response = await agent.get('/api/whiskeys?type=bourbon');

      expect(response.status).toBe(200);
      expect(response.body.whiskeys).toHaveLength(1);
      expect(response.body.whiskeys[0].name).toBe('Bourbon 1');
    });

    it('filters by distillery', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      createTestWhiskey(user.id, { name: 'BT 1', distillery: 'Buffalo Trace' });
      createTestWhiskey(user.id, { name: 'MM 1', distillery: 'Makers Mark' });

      const response = await agent.get('/api/whiskeys?distillery=Buffalo');

      expect(response.status).toBe(200);
      expect(response.body.whiskeys).toHaveLength(1);
      expect(response.body.whiskeys[0].name).toBe('BT 1');
    });

    it('validates type filter', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/whiskeys?type=invalid');

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/whiskeys/:id', () => {
    it('returns whiskey by id', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id, { name: 'My Bourbon' });

      const response = await agent.get(`/api/whiskeys/${whiskey.id}`);

      expect(response.status).toBe(200);
      expect(response.body.whiskey.name).toBe('My Bourbon');
    });

    it('returns 404 for non-existent whiskey', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/whiskeys/99999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Whiskey not found');
    });

    it('returns 404 when accessing another user\'s whiskey', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const user2 = await createTestUser('user2', 'user2@test.com', 'password123');
      const whiskey = createTestWhiskey(user2.id, { name: 'User2 Whiskey' });

      const response = await agent.get(`/api/whiskeys/${whiskey.id}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Whiskey not found');
    });
  });

  describe('POST /api/whiskeys', () => {
    it('creates a whiskey with required fields', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/whiskeys')
        .send({
          name: 'New Bourbon',
          type: 'bourbon',
          distillery: 'Test Distillery'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Whiskey created successfully');
      expect(response.body.whiskey.name).toBe('New Bourbon');
      expect(response.body.whiskey.type).toBe('bourbon');
      expect(response.body.whiskey.distillery).toBe('Test Distillery');
    });

    it('creates a whiskey with optional fields', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/whiskeys')
        .send({
          name: 'Premium Bourbon',
          type: 'bourbon',
          distillery: 'Buffalo Trace',
          region: 'Kentucky',
          age: 12,
          abv: 45.0,
          rating: 8.5,
          description: 'A fine bourbon'
        });

      expect(response.status).toBe(201);
      expect(response.body.whiskey.region).toBe('Kentucky');
      expect(response.body.whiskey.age).toBe(12);
      expect(response.body.whiskey.abv).toBe(45.0);
      expect(response.body.whiskey.rating).toBe(8.5);
    });

    it('assigns whiskey to the authenticated user', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/whiskeys')
        .send({
          name: 'My Bourbon',
          type: 'bourbon',
          distillery: 'Test'
        });

      expect(response.status).toBe(201);
      expect(response.body.whiskey.created_by).toBe(user.id);
    });

    it('validates required fields - missing name', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/whiskeys')
        .send({
          type: 'bourbon',
          distillery: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Name is required');
    });

    it('validates required fields - missing type', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/whiskeys')
        .send({
          name: 'Test',
          distillery: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('validates required fields - missing distillery', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/whiskeys')
        .send({
          name: 'Test',
          type: 'bourbon'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Distillery is required');
    });

    it('validates type is valid whiskey type', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/whiskeys')
        .send({
          name: 'Test',
          type: 'invalid',
          distillery: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toBe('Invalid whiskey type');
    });

    it('validates ABV is between 0 and 100', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/whiskeys')
        .send({
          name: 'Test',
          type: 'bourbon',
          distillery: 'Test',
          abv: 150
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('validates rating is between 0 and 10', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/whiskeys')
        .send({
          name: 'Test',
          type: 'bourbon',
          distillery: 'Test',
          rating: 15
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('validates age is positive', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/whiskeys')
        .send({
          name: 'Test',
          type: 'bourbon',
          distillery: 'Test',
          age: -5
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/whiskeys/:id', () => {
    it('updates a whiskey', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id, { name: 'Original Name' });

      const response = await agent
        .put(`/api/whiskeys/${whiskey.id}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Whiskey updated successfully');
      expect(response.body.whiskey.name).toBe('Updated Name');
    });

    it('updates multiple fields', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);

      const response = await agent
        .put(`/api/whiskeys/${whiskey.id}`)
        .send({
          name: 'Updated Bourbon',
          rating: 9.0,
          region: 'Kentucky'
        });

      expect(response.status).toBe(200);
      expect(response.body.whiskey.name).toBe('Updated Bourbon');
      expect(response.body.whiskey.rating).toBe(9.0);
      expect(response.body.whiskey.region).toBe('Kentucky');
    });

    it('returns 404 for non-existent whiskey', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .put('/api/whiskeys/99999')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('returns 404 when updating another user\'s whiskey', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const user2 = await createTestUser('user2', 'user2@test.com', 'password123');
      const whiskey = createTestWhiskey(user2.id, { name: 'User2 Whiskey' });

      const response = await agent
        .put(`/api/whiskeys/${whiskey.id}`)
        .send({ name: 'Hacked!' });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('validates updated fields', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);

      const response = await agent
        .put(`/api/whiskeys/${whiskey.id}`)
        .send({ rating: 15 });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/whiskeys/:id', () => {
    it('deletes a whiskey (admin role required)', async () => {
      // Note: DELETE requires ADMIN role per RolePermissions
      const { agent, user } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const whiskey = createTestWhiskey(user.id);

      const response = await agent.delete(`/api/whiskeys/${whiskey.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Whiskey deleted successfully');

      // Verify it's actually deleted
      const getResponse = await agent.get(`/api/whiskeys/${whiskey.id}`);
      expect(getResponse.status).toBe(404);
    });

    it('returns 403 for editor role (no delete permission)', async () => {
      const { agent, user } = await createAuthenticatedAgent(app, 'editor', 'editor@test.com', 'password123', Role.EDITOR);
      const whiskey = createTestWhiskey(user.id);

      const response = await agent.delete(`/api/whiskeys/${whiskey.id}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('returns 404 for non-existent whiskey', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const response = await agent.delete('/api/whiskeys/99999');

      expect(response.status).toBe(404);
    });

    it('returns 404 when deleting another user\'s whiskey', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin1', 'admin1@test.com', 'password123', Role.ADMIN);
      const user2 = await createTestUser('admin2', 'admin2@test.com', 'password123', Role.ADMIN);
      const whiskey = createTestWhiskey(user2.id);

      const response = await agent.delete(`/api/whiskeys/${whiskey.id}`);

      expect(response.status).toBe(404);
    });

    it('does not delete another user\'s whiskey', async () => {
      // Create two admin users
      const { agent: agent1 } = await createAuthenticatedAgent(app, 'admin1', 'admin1@test.com', 'password123', Role.ADMIN);
      const user2 = await createTestUser('admin2', 'admin2@test.com', 'password123', Role.ADMIN);
      const whiskey = createTestWhiskey(user2.id, { name: 'User2 Whiskey' });

      // Admin1 tries to delete Admin2's whiskey
      await agent1.delete(`/api/whiskeys/${whiskey.id}`);

      // Login as admin2 and verify whiskey still exists
      const agent2 = request.agent(app);
      await agent2.post('/api/auth/login').send({ username: 'admin2', password: 'password123' });

      const response = await agent2.get(`/api/whiskeys/${whiskey.id}`);
      expect(response.status).toBe(200);
      expect(response.body.whiskey.name).toBe('User2 Whiskey');
    });
  });

  describe('GET /api/whiskeys/search', () => {
    it('searches whiskeys by name', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      createTestWhiskey(user.id, { name: 'Buffalo Trace', distillery: 'Buffalo Trace Distillery' });
      createTestWhiskey(user.id, { name: 'Makers Mark', distillery: 'Makers Mark Distillery' });

      const response = await agent.get('/api/whiskeys/search?q=Buffalo');

      expect(response.status).toBe(200);
      expect(response.body.whiskeys).toHaveLength(1);
      expect(response.body.whiskeys[0].name).toBe('Buffalo Trace');
    });

    it('searches whiskeys by distillery', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      createTestWhiskey(user.id, { name: 'Eagle Rare', distillery: 'Buffalo Trace' });
      createTestWhiskey(user.id, { name: 'Makers Mark', distillery: 'Makers Mark' });

      const response = await agent.get('/api/whiskeys/search?q=Buffalo Trace');

      expect(response.status).toBe(200);
      expect(response.body.whiskeys).toHaveLength(1);
    });

    it('only searches user\'s own whiskeys', async () => {
      const { agent, user } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const user2 = await createTestUser('user2', 'user2@test.com', 'password123');

      createTestWhiskey(user.id, { name: 'User1 Buffalo', distillery: 'Test' });
      createTestWhiskey(user2.id, { name: 'User2 Buffalo', distillery: 'Test' });

      const response = await agent.get('/api/whiskeys/search?q=Buffalo');

      expect(response.status).toBe(200);
      expect(response.body.whiskeys).toHaveLength(1);
      expect(response.body.whiskeys[0].name).toBe('User1 Buffalo');
    });

    it('requires search query', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/whiskeys/search');

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('returns empty array for no matches', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      createTestWhiskey(user.id, { name: 'Bourbon' });

      const response = await agent.get('/api/whiskeys/search?q=Scotch');

      expect(response.status).toBe(200);
      expect(response.body.whiskeys).toHaveLength(0);
    });
  });

  describe('GET /api/whiskeys/export/csv', () => {
    it('exports whiskeys as CSV', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      createTestWhiskey(user.id, { name: 'Test Bourbon', type: WhiskeyType.BOURBON, distillery: 'Test Distillery' });

      const response = await agent.get('/api/whiskeys/export/csv');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.text).toContain('Name,Type,Distillery');
      expect(response.text).toContain('Test Bourbon');
    });

    it('only exports user\'s own whiskeys', async () => {
      const { agent, user } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const user2 = await createTestUser('user2', 'user2@test.com', 'password123');

      createTestWhiskey(user.id, { name: 'User1 Bourbon' });
      createTestWhiskey(user2.id, { name: 'User2 Bourbon' });

      const response = await agent.get('/api/whiskeys/export/csv');

      expect(response.status).toBe(200);
      expect(response.text).toContain('User1 Bourbon');
      expect(response.text).not.toContain('User2 Bourbon');
    });

    it('handles empty collection', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/whiskeys/export/csv');

      expect(response.status).toBe(200);
      expect(response.text).toContain('Name,Type,Distillery');
      // Should only have headers, no data rows
      const lines = response.text.trim().split('\n');
      expect(lines).toHaveLength(1);
    });
  });

  describe('User Isolation (Integration)', () => {
    it('complete isolation: user cannot see, update, or delete other users whiskeys', async () => {
      // Setup: Admin1 creates a whiskey (use admin to test delete permission)
      const { agent: agent1, user: user1 } = await createAuthenticatedAgent(app, 'admin1', 'admin1@test.com', 'password123', Role.ADMIN);

      const createResponse = await agent1
        .post('/api/whiskeys')
        .send({ name: 'Admin1 Private Bourbon', type: 'bourbon', distillery: 'Secret Distillery' });

      const whiskeyId = createResponse.body.whiskey.id;

      // Setup: Admin2 logs in
      await createTestUser('admin2', 'admin2@test.com', 'password123', Role.ADMIN);
      const agent2 = request.agent(app);
      await agent2.post('/api/auth/login').send({ username: 'admin2', password: 'password123' });

      // Admin2 cannot see Admin1's whiskey in list
      const listResponse = await agent2.get('/api/whiskeys');
      expect(listResponse.body.whiskeys).toHaveLength(0);

      // Admin2 cannot get Admin1's whiskey by ID
      const getResponse = await agent2.get(`/api/whiskeys/${whiskeyId}`);
      expect(getResponse.status).toBe(404);

      // Admin2 cannot update Admin1's whiskey
      const updateResponse = await agent2
        .put(`/api/whiskeys/${whiskeyId}`)
        .send({ name: 'Hacked!' });
      expect(updateResponse.status).toBe(404);

      // Admin2 cannot delete Admin1's whiskey
      const deleteResponse = await agent2.delete(`/api/whiskeys/${whiskeyId}`);
      expect(deleteResponse.status).toBe(404);

      // Admin2 cannot find Admin1's whiskey via search
      const searchResponse = await agent2.get('/api/whiskeys/search?q=Private');
      expect(searchResponse.body.whiskeys).toHaveLength(0);

      // Verify Admin1's whiskey is still intact
      const verifyResponse = await agent1.get(`/api/whiskeys/${whiskeyId}`);
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.whiskey.name).toBe('Admin1 Private Bourbon');
    });
  });

  describe('POST /api/whiskeys/import/csv', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/whiskeys/import/csv')
        .attach('file', Buffer.from('Name,Type,Distillery\nTest,bourbon,Test'), 'test.csv');

      expect(response.status).toBe(401);
    });

    it('returns 400 when no file is uploaded', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.post('/api/whiskeys/import/csv');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No file uploaded');
    });

    it('imports valid CSV data', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      const csvContent = `Name,Type,Distillery,Region,Age
Buffalo Trace,bourbon,Buffalo Trace Distillery,Kentucky,8
Makers Mark,bourbon,Makers Mark Distillery,Kentucky,6`;

      const response = await agent
        .post('/api/whiskeys/import/csv')
        .attach('file', Buffer.from(csvContent), 'whiskeys.csv');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('CSV import completed');
      expect(response.body.summary.imported).toBe(2);
      expect(response.body.summary.skipped).toBe(0);
      expect(response.body.summary.errors).toBe(0);
    });

    it('skips rows with missing required fields', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const csvContent = `Name,Type,Distillery
Valid Whiskey,bourbon,Valid Distillery
Missing Type,,Another Distillery
Missing Distillery,bourbon,`;

      const response = await agent
        .post('/api/whiskeys/import/csv')
        .attach('file', Buffer.from(csvContent), 'whiskeys.csv');

      expect(response.status).toBe(200);
      expect(response.body.summary.imported).toBe(1);
      expect(response.body.summary.skipped).toBe(2);
    });

    it('skips rows with invalid whiskey type', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const csvContent = `Name,Type,Distillery
Valid,bourbon,Distillery
Invalid Type,vodka,Distillery`;

      const response = await agent
        .post('/api/whiskeys/import/csv')
        .attach('file', Buffer.from(csvContent), 'whiskeys.csv');

      expect(response.status).toBe(200);
      expect(response.body.summary.imported).toBe(1);
      expect(response.body.summary.skipped).toBe(1);
      expect(response.body.skipped[0]).toContain('Invalid whiskey type');
    });

    it('imports whiskeys with all optional fields', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      const csvContent = `Name,Type,Distillery,Region,Age,ABV,Rating,Description
Full Details,bourbon,Test Distillery,Kentucky,12,45.5,8.5,A great bourbon`;

      const response = await agent
        .post('/api/whiskeys/import/csv')
        .attach('file', Buffer.from(csvContent), 'whiskeys.csv');

      expect(response.status).toBe(200);
      expect(response.body.summary.imported).toBe(1);

      // Verify the imported whiskey has all fields
      const listResponse = await agent.get('/api/whiskeys');
      const imported = listResponse.body.whiskeys.find((w: any) => w.name === 'Full Details');

      expect(imported.region).toBe('Kentucky');
      expect(imported.age).toBe(12);
      expect(imported.abv).toBe(45.5);
      expect(imported.rating).toBe(8.5);
      expect(imported.description).toBe('A great bourbon');
    });

    it('handles quoted CSV fields with commas', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const csvContent = `Name,Type,Distillery,Description
"Whiskey, Special Edition",bourbon,Test Distillery,"Notes: vanilla, caramel, oak"`;

      const response = await agent
        .post('/api/whiskeys/import/csv')
        .attach('file', Buffer.from(csvContent), 'whiskeys.csv');

      expect(response.status).toBe(200);
      expect(response.body.summary.imported).toBe(1);

      const listResponse = await agent.get('/api/whiskeys');
      const imported = listResponse.body.whiskeys[0];

      expect(imported.name).toBe('Whiskey, Special Edition');
      expect(imported.description).toBe('Notes: vanilla, caramel, oak');
    });

    it('assigns imported whiskeys to authenticated user', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      const csvContent = `Name,Type,Distillery
My Import,bourbon,My Distillery`;

      await agent
        .post('/api/whiskeys/import/csv')
        .attach('file', Buffer.from(csvContent), 'whiskeys.csv');

      const listResponse = await agent.get('/api/whiskeys');
      expect(listResponse.body.whiskeys[0].created_by).toBe(user.id);
    });

    it('returns 400 for empty CSV', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const csvContent = `Name,Type,Distillery`;

      const response = await agent
        .post('/api/whiskeys/import/csv')
        .attach('file', Buffer.from(csvContent), 'whiskeys.csv');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('CSV file is empty or invalid');
    });

    it('converts boolean fields correctly', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const csvContent = `Name,Type,Distillery,Is Opened,Limited Edition,Is For Sale
Test Whiskey,bourbon,Test Distillery,Yes,1,yes`;

      const response = await agent
        .post('/api/whiskeys/import/csv')
        .attach('file', Buffer.from(csvContent), 'whiskeys.csv');

      expect(response.status).toBe(200);
      expect(response.body.summary.imported).toBe(1);
    });

    it('imports numeric fields correctly', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      // Note: WhiskeyModel.create only handles a subset of fields in the INSERT
      // Age, ABV, MSRP, and Rating are included in the basic create
      const csvContent = `Name,Type,Distillery,Age,ABV,MSRP,Rating
Numeric Test,bourbon,Distillery,12,45.5,50.00,8.5`;

      await agent
        .post('/api/whiskeys/import/csv')
        .attach('file', Buffer.from(csvContent), 'whiskeys.csv');

      const listResponse = await agent.get('/api/whiskeys');
      const imported = listResponse.body.whiskeys[0];

      expect(imported.age).toBe(12);
      expect(imported.abv).toBe(45.5);
      expect(imported.msrp).toBe(50);
      expect(imported.rating).toBe(8.5);
    });

    it('returns detailed import summary', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const csvContent = `Name,Type,Distillery
Valid1,bourbon,Distillery1
Valid2,scotch,Distillery2
,bourbon,Missing Name`;

      const response = await agent
        .post('/api/whiskeys/import/csv')
        .attach('file', Buffer.from(csvContent), 'whiskeys.csv');

      expect(response.status).toBe(200);
      expect(response.body.summary.total).toBe(3);
      expect(response.body.summary.imported).toBe(2);
      expect(response.body.summary.skipped).toBe(1);
      expect(response.body.imported).toHaveLength(2);
      expect(response.body.skipped).toHaveLength(1);
    });
  });

  describe('DELETE /api/whiskeys/bulk', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .delete('/api/whiskeys/bulk')
        .send({ ids: [1, 2] });
      expect(response.status).toBe(401);
    });

    it('deletes multiple whiskeys by ids', async () => {
      const { agent, user } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const whiskey1 = createTestWhiskey(user.id, { name: 'Whiskey 1' });
      const whiskey2 = createTestWhiskey(user.id, { name: 'Whiskey 2' });
      const whiskey3 = createTestWhiskey(user.id, { name: 'Whiskey 3' });

      const response = await agent
        .delete('/api/whiskeys/bulk')
        .send({ ids: [whiskey1.id, whiskey2.id] });

      expect(response.status).toBe(200);
      expect(response.body.deleted).toBe(2);

      // Verify whiskey3 still exists
      const remaining = await agent.get('/api/whiskeys');
      expect(remaining.body.whiskeys).toHaveLength(1);
      expect(remaining.body.whiskeys[0].name).toBe('Whiskey 3');
    });

    it('returns 400 when ids array is empty', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const response = await agent
        .delete('/api/whiskeys/bulk')
        .send({ ids: [] });

      expect(response.status).toBe(400);
    });

    it('returns 400 when ids array is missing', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const response = await agent
        .delete('/api/whiskeys/bulk')
        .send({});

      expect(response.status).toBe(400);
    });

    it('returns 400 when ids contains invalid values', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const response = await agent
        .delete('/api/whiskeys/bulk')
        .send({ ids: ['not-a-number', -1] });

      expect(response.status).toBe(400);
    });

    it('only deletes whiskeys belonging to the user', async () => {
      const { agent: agent1, user: user1 } = await createAuthenticatedAgent(app, 'admin1', 'admin1@test.com', 'password123', Role.ADMIN);
      const user2 = await createTestUser('user2', 'user2@test.com', 'password123', Role.ADMIN);

      const user1Whiskey = createTestWhiskey(user1.id, { name: 'User1 Whiskey' });
      const user2Whiskey = createTestWhiskey(user2.id, { name: 'User2 Whiskey' });

      // User1 tries to delete both whiskeys
      const response = await agent1
        .delete('/api/whiskeys/bulk')
        .send({ ids: [user1Whiskey.id, user2Whiskey.id] });

      expect(response.status).toBe(200);
      expect(response.body.deleted).toBe(1); // Only user1's whiskey deleted
    });

    it('returns 403 for viewer role', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'viewer', 'viewer@test.com', 'password123', Role.VIEWER);

      const response = await agent
        .delete('/api/whiskeys/bulk')
        .send({ ids: [1] });

      expect(response.status).toBe(403);
    });

    it('returns 403 for editor role', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'editor', 'editor@test.com', 'password123', Role.EDITOR);

      const response = await agent
        .delete('/api/whiskeys/bulk')
        .send({ ids: [1] });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/whiskeys/all', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const response = await request(app).delete('/api/whiskeys/all');
      expect(response.status).toBe(401);
    });

    it('deletes all whiskeys for the user', async () => {
      const { agent, user } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      createTestWhiskey(user.id, { name: 'Whiskey 1' });
      createTestWhiskey(user.id, { name: 'Whiskey 2' });
      createTestWhiskey(user.id, { name: 'Whiskey 3' });

      const response = await agent.delete('/api/whiskeys/all');

      expect(response.status).toBe(200);
      expect(response.body.deleted).toBe(3);

      // Verify all whiskeys are deleted
      const remaining = await agent.get('/api/whiskeys');
      expect(remaining.body.whiskeys).toHaveLength(0);
    });

    it('only deletes whiskeys for the authenticated user', async () => {
      const { agent: agent1, user: user1 } = await createAuthenticatedAgent(app, 'admin1', 'admin1@test.com', 'password123', Role.ADMIN);
      const { agent: agent2, user: user2 } = await createAuthenticatedAgent(app, 'admin2', 'admin2@test.com', 'password123', Role.ADMIN);

      createTestWhiskey(user1.id, { name: 'User1 Whiskey' });
      createTestWhiskey(user2.id, { name: 'User2 Whiskey' });

      // User1 deletes all their whiskeys
      const response = await agent1.delete('/api/whiskeys/all');

      expect(response.status).toBe(200);
      expect(response.body.deleted).toBe(1);

      // Verify user2's whiskey still exists
      const user2Whiskeys = await agent2.get('/api/whiskeys');
      expect(user2Whiskeys.body.whiskeys).toHaveLength(1);
    });

    it('returns 0 when user has no whiskeys', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      const response = await agent.delete('/api/whiskeys/all');

      expect(response.status).toBe(200);
      expect(response.body.deleted).toBe(0);
    });

    it('returns 403 for viewer role', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'viewer', 'viewer@test.com', 'password123', Role.VIEWER);

      const response = await agent.delete('/api/whiskeys/all');

      expect(response.status).toBe(403);
    });

    it('returns 403 for editor role', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'editor', 'editor@test.com', 'password123', Role.EDITOR);

      const response = await agent.delete('/api/whiskeys/all');

      expect(response.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 when deleteAllByUser throws an error', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);

      // Mock deleteAllByUser to throw an error
      const spy = vi.spyOn(WhiskeyModel, 'deleteAllByUser').mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await agent.delete('/api/whiskeys/all');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete all whiskeys');

      spy.mockRestore();
    });

    it('returns 500 when delete throws an error', async () => {
      const { agent, user } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const whiskey = createTestWhiskey(user.id);

      // Mock delete to throw an error
      const spy = vi.spyOn(WhiskeyModel, 'delete').mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await agent.delete(`/api/whiskeys/${whiskey.id}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete whiskey');

      spy.mockRestore();
    });

    it('returns 500 when update throws an error', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);

      // Mock update to throw an error
      const spy = vi.spyOn(WhiskeyModel, 'update').mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await agent
        .put(`/api/whiskeys/${whiskey.id}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update whiskey');

      spy.mockRestore();
    });

    it('returns 500 when deleteMany throws an error', async () => {
      const { agent, user } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password123', Role.ADMIN);
      const whiskey = createTestWhiskey(user.id);

      // Mock deleteMany to throw an error
      const spy = vi.spyOn(WhiskeyModel, 'deleteMany').mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await agent
        .delete('/api/whiskeys/bulk')
        .send({ ids: [whiskey.id] });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete whiskeys');

      spy.mockRestore();
    });

    it('returns 500 when create throws an error', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      // Mock create to throw an error
      const spy = vi.spyOn(WhiskeyModel, 'create').mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await agent
        .post('/api/whiskeys')
        .send({
          name: 'Test Whiskey',
          type: 'bourbon',
          distillery: 'Test Distillery'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create whiskey');

      spy.mockRestore();
    });
  });

  describe('Special User Handling', () => {
    it('sets quantity to 1 for guntharp user when quantity is 0', async () => {
      const { agent, user } = await createAuthenticatedAgent(app, 'guntharp', 'guntharp@test.com', 'password123');
      const whiskey = createTestWhiskey(user.id);

      const response = await agent
        .put(`/api/whiskeys/${whiskey.id}`)
        .send({ quantity: 0 });

      expect(response.status).toBe(200);
      expect(response.body.whiskey.quantity).toBe(1);
    });
  });
});
