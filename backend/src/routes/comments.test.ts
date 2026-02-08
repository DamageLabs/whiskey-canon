import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createAuthenticatedAgent, createTestWhiskey, createTestComment } from '../test/helpers';
import { Role } from '../types';
import type { Application } from 'express';
import { CommentModel } from '../models/Comment';

describe('Comment Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Authentication', () => {
    it('returns 401 for unauthenticated requests to GET /api/comments/whiskey/:id', async () => {
      const response = await request(app).get('/api/comments/whiskey/1');
      expect(response.status).toBe(401);
    });

    it('returns 401 for unauthenticated requests to GET /api/comments/whiskey/:id/count', async () => {
      const response = await request(app).get('/api/comments/whiskey/1/count');
      expect(response.status).toBe(401);
    });

    it('returns 401 for unauthenticated requests to POST /api/comments/whiskey/:id', async () => {
      const response = await request(app)
        .post('/api/comments/whiskey/1')
        .send({ content: 'Test comment' });
      expect(response.status).toBe(401);
    });

    it('returns 401 for unauthenticated requests to PUT /api/comments/:id', async () => {
      const response = await request(app)
        .put('/api/comments/1')
        .send({ content: 'Updated' });
      expect(response.status).toBe(401);
    });

    it('returns 401 for unauthenticated requests to DELETE /api/comments/:id', async () => {
      const response = await request(app).delete('/api/comments/1');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/comments/whiskey/:whiskeyId', () => {
    it('returns comments for owned whiskey', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);
      createTestComment(whiskey.id, user.id, 'Comment 1');
      createTestComment(whiskey.id, user.id, 'Comment 2');

      const response = await agent.get(`/api/comments/whiskey/${whiskey.id}`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(2);
    });

    it('returns 404 for non-existent whiskey', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/comments/whiskey/99999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Whiskey not found');
    });

    it('returns 403 when accessing another user\'s whiskey comments', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const user2 = await createTestUser('user2', 'user2@test.com');
      const whiskey = createTestWhiskey(user2.id);

      const response = await agent.get(`/api/comments/whiskey/${whiskey.id}`);

      expect(response.status).toBe(403);
    });

    it('allows admin to view any whiskey comments', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password', Role.ADMIN);
      const user2 = await createTestUser('user2', 'user2@test.com');
      const whiskey = createTestWhiskey(user2.id);
      createTestComment(whiskey.id, user2.id, 'User comment');

      const response = await agent.get(`/api/comments/whiskey/${whiskey.id}`);

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(1);
    });

    it('returns 400 for invalid whiskey ID', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/comments/whiskey/invalid');

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/comments/whiskey/:whiskeyId/count', () => {
    it('returns comment count', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);
      createTestComment(whiskey.id, user.id, 'Comment 1');
      createTestComment(whiskey.id, user.id, 'Comment 2');
      createTestComment(whiskey.id, user.id, 'Comment 3');

      const response = await agent.get(`/api/comments/whiskey/${whiskey.id}/count`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3);
    });

    it('returns 0 for whiskey with no comments', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);

      const response = await agent.get(`/api/comments/whiskey/${whiskey.id}/count`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
    });

    it('returns 400 for invalid whiskey ID', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/comments/whiskey/abc/count');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/comments/whiskey/:whiskeyId', () => {
    it('creates a comment on owned whiskey', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);

      const response = await agent
        .post(`/api/comments/whiskey/${whiskey.id}`)
        .send({ content: 'Great whiskey!' });

      expect(response.status).toBe(201);
      expect(response.body.comment).toBeDefined();
      expect(response.body.comment.content).toBe('Great whiskey!');
      expect(response.body.message).toBe('Comment added successfully');
    });

    it('returns 404 for non-existent whiskey', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .post('/api/comments/whiskey/99999')
        .send({ content: 'Test' });

      expect(response.status).toBe(404);
    });

    it('returns 403 when commenting on another user\'s whiskey', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const user2 = await createTestUser('user2', 'user2@test.com');
      const whiskey = createTestWhiskey(user2.id);

      const response = await agent
        .post(`/api/comments/whiskey/${whiskey.id}`)
        .send({ content: 'Trying to comment' });

      expect(response.status).toBe(403);
    });

    it('allows admin to comment on any whiskey', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password', Role.ADMIN);
      const user2 = await createTestUser('user2', 'user2@test.com');
      const whiskey = createTestWhiskey(user2.id);

      const response = await agent
        .post(`/api/comments/whiskey/${whiskey.id}`)
        .send({ content: 'Admin comment' });

      expect(response.status).toBe(201);
    });

    it('validates content is not empty', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);

      const response = await agent
        .post(`/api/comments/whiskey/${whiskey.id}`)
        .send({ content: '' });

      expect(response.status).toBe(400);
    });

    it('validates content length (max 2000 characters)', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);

      const response = await agent
        .post(`/api/comments/whiskey/${whiskey.id}`)
        .send({ content: 'a'.repeat(2001) });

      expect(response.status).toBe(400);
    });

    it('trims whitespace from content', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);

      const response = await agent
        .post(`/api/comments/whiskey/${whiskey.id}`)
        .send({ content: '  Trimmed content  ' });

      expect(response.status).toBe(201);
      expect(response.body.comment.content).toBe('Trimmed content');
    });
  });

  describe('PUT /api/comments/:id', () => {
    it('updates own comment', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);
      const comment = createTestComment(whiskey.id, user.id, 'Original');

      const response = await agent
        .put(`/api/comments/${comment.id}`)
        .send({ content: 'Updated content' });

      expect(response.status).toBe(200);
      expect(response.body.comment.content).toBe('Updated content');
      expect(response.body.message).toBe('Comment updated successfully');
    });

    it('returns 403 for non-existent comment (authorization checked first)', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .put('/api/comments/99999')
        .send({ content: 'Updated' });

      // Authorization check happens before existence check for security
      expect(response.status).toBe(403);
    });

    it('returns 403 when updating another user\'s comment', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const user2 = await createTestUser('user2', 'user2@test.com');
      const whiskey = createTestWhiskey(user2.id);
      const comment = createTestComment(whiskey.id, user2.id, 'Not yours');

      const response = await agent
        .put(`/api/comments/${comment.id}`)
        .send({ content: 'Hacked!' });

      expect(response.status).toBe(403);
    });

    it('allows admin to update any comment', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password', Role.ADMIN);
      const user2 = await createTestUser('user2', 'user2@test.com');
      const whiskey = createTestWhiskey(user2.id);
      const comment = createTestComment(whiskey.id, user2.id, 'User comment');

      const response = await agent
        .put(`/api/comments/${comment.id}`)
        .send({ content: 'Admin updated' });

      expect(response.status).toBe(200);
      expect(response.body.comment.content).toBe('Admin updated');
    });

    it('validates content is not empty', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);
      const comment = createTestComment(whiskey.id, user.id, 'Original');

      const response = await agent
        .put(`/api/comments/${comment.id}`)
        .send({ content: '' });

      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid comment ID', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent
        .put('/api/comments/invalid')
        .send({ content: 'Test' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/comments/:id', () => {
    it('deletes own comment', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);
      const comment = createTestComment(whiskey.id, user.id, 'Delete me');

      const response = await agent.delete(`/api/comments/${comment.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Comment deleted successfully');
    });

    it('returns 403 for non-existent comment (authorization checked first)', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.delete('/api/comments/99999');

      // Authorization check happens before existence check for security
      expect(response.status).toBe(403);
    });

    it('returns 403 when deleting another user\'s comment', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const user2 = await createTestUser('user2', 'user2@test.com');
      const whiskey = createTestWhiskey(user2.id);
      const comment = createTestComment(whiskey.id, user2.id, 'Protected');

      const response = await agent.delete(`/api/comments/${comment.id}`);

      expect(response.status).toBe(403);
    });

    it('allows admin to delete any comment', async () => {
      const { agent } = await createAuthenticatedAgent(app, 'admin', 'admin@test.com', 'password', Role.ADMIN);
      const user2 = await createTestUser('user2', 'user2@test.com');
      const whiskey = createTestWhiskey(user2.id);
      const comment = createTestComment(whiskey.id, user2.id, 'User comment');

      const response = await agent.delete(`/api/comments/${comment.id}`);

      expect(response.status).toBe(200);
    });

    it('returns 400 for invalid comment ID', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.delete('/api/comments/abc');

      expect(response.status).toBe(400);
    });
  });

  describe('User Isolation', () => {
    it('users can only access comments on their own whiskeys (not admin)', async () => {
      // Create two users
      const { agent: agent1, user: user1 } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const user2 = await createTestUser('user2', 'user2@test.com');

      // Create whiskeys for each user
      const whiskey1 = createTestWhiskey(user1.id, { name: 'User1 Whiskey' });
      const whiskey2 = createTestWhiskey(user2.id, { name: 'User2 Whiskey' });

      // Create comments
      createTestComment(whiskey1.id, user1.id, 'User1 comment on own whiskey');
      createTestComment(whiskey2.id, user2.id, 'User2 comment on own whiskey');

      // User1 can see comments on own whiskey
      const ownResponse = await agent1.get(`/api/comments/whiskey/${whiskey1.id}`);
      expect(ownResponse.status).toBe(200);
      expect(ownResponse.body.comments).toHaveLength(1);

      // User1 cannot see comments on user2's whiskey
      const otherResponse = await agent1.get(`/api/comments/whiskey/${whiskey2.id}`);
      expect(otherResponse.status).toBe(403);

      // User1 cannot post comments on user2's whiskey
      const postResponse = await agent1
        .post(`/api/comments/whiskey/${whiskey2.id}`)
        .send({ content: 'Trying to comment' });
      expect(postResponse.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 when delete throws an error', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);
      const whiskey = createTestWhiskey(user.id);
      const comment = createTestComment(whiskey.id, user.id, 'Test comment');

      const spy = vi.spyOn(CommentModel, 'delete').mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await agent.delete(`/api/comments/${comment.id}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete comment');

      spy.mockRestore();
    });
  });
});
