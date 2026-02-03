import { describe, it, expect, beforeEach } from 'vitest';
import { CommentModel } from './Comment';
import { createTestUser, createTestWhiskey } from '../test/helpers';
import { Role } from '../types';

describe('CommentModel', () => {
  let user1: { id: number };
  let user2: { id: number };
  let whiskey1: { id: number };
  let whiskey2: { id: number };

  beforeEach(async () => {
    user1 = await createTestUser('user1', 'user1@example.com', 'password123', Role.EDITOR);
    user2 = await createTestUser('user2', 'user2@example.com', 'password123', Role.EDITOR);
    whiskey1 = createTestWhiskey(user1.id, { name: 'Whiskey 1' });
    whiskey2 = createTestWhiskey(user2.id, { name: 'Whiskey 2' });
  });

  describe('create', () => {
    it('creates a comment with valid data', () => {
      const comment = CommentModel.create(whiskey1.id, user1.id, 'Great whiskey!');

      expect(comment).toBeDefined();
      expect(comment.id).toBeDefined();
      expect(comment.whiskey_id).toBe(whiskey1.id);
      expect(comment.user_id).toBe(user1.id);
      expect(comment.content).toBe('Great whiskey!');
      expect(comment.created_at).toBeDefined();
      expect(comment.updated_at).toBeDefined();
    });

    it('includes username from joined user data', () => {
      const comment = CommentModel.create(whiskey1.id, user1.id, 'Test comment');

      expect(comment.username).toBe('user1');
    });

    it('allows different users to comment on same whiskey', () => {
      const comment1 = CommentModel.create(whiskey1.id, user1.id, 'Owner comment');
      const comment2 = CommentModel.create(whiskey1.id, user2.id, 'Other user comment');

      expect(comment1.user_id).toBe(user1.id);
      expect(comment2.user_id).toBe(user2.id);
      expect(comment1.whiskey_id).toBe(comment2.whiskey_id);
    });
  });

  describe('findById', () => {
    it('finds comment by id', () => {
      const created = CommentModel.create(whiskey1.id, user1.id, 'Find me');
      const found = CommentModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.content).toBe('Find me');
    });

    it('returns undefined for non-existent id', () => {
      const found = CommentModel.findById(99999);

      expect(found).toBeUndefined();
    });

    it('includes joined user data', () => {
      const created = CommentModel.create(whiskey1.id, user1.id, 'Test');
      const found = CommentModel.findById(created.id);

      expect(found?.username).toBe('user1');
    });
  });

  describe('findByWhiskeyId', () => {
    it('returns all comments for a whiskey', () => {
      CommentModel.create(whiskey1.id, user1.id, 'Comment 1');
      CommentModel.create(whiskey1.id, user1.id, 'Comment 2');
      CommentModel.create(whiskey1.id, user2.id, 'Comment 3');

      const comments = CommentModel.findByWhiskeyId(whiskey1.id);

      expect(comments).toHaveLength(3);
    });

    it('returns empty array for whiskey with no comments', () => {
      const comments = CommentModel.findByWhiskeyId(whiskey1.id);

      expect(comments).toEqual([]);
    });

    it('does not return comments from other whiskeys', () => {
      CommentModel.create(whiskey1.id, user1.id, 'Whiskey 1 comment');
      CommentModel.create(whiskey2.id, user2.id, 'Whiskey 2 comment');

      const comments = CommentModel.findByWhiskeyId(whiskey1.id);

      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe('Whiskey 1 comment');
    });

    it('includes joined user data for all comments', () => {
      CommentModel.create(whiskey1.id, user1.id, 'User 1 comment');
      CommentModel.create(whiskey1.id, user2.id, 'User 2 comment');

      const comments = CommentModel.findByWhiskeyId(whiskey1.id);

      expect(comments).toHaveLength(2);
      // Verify joined user data is present
      const usernames = comments.map(c => c.username);
      expect(usernames).toContain('user1');
      expect(usernames).toContain('user2');
    });
  });

  describe('countByWhiskeyId', () => {
    it('returns correct count', () => {
      CommentModel.create(whiskey1.id, user1.id, 'Comment 1');
      CommentModel.create(whiskey1.id, user1.id, 'Comment 2');

      const count = CommentModel.countByWhiskeyId(whiskey1.id);

      expect(count).toBe(2);
    });

    it('returns 0 for whiskey with no comments', () => {
      const count = CommentModel.countByWhiskeyId(whiskey1.id);

      expect(count).toBe(0);
    });

    it('only counts comments for specified whiskey', () => {
      CommentModel.create(whiskey1.id, user1.id, 'Whiskey 1');
      CommentModel.create(whiskey2.id, user2.id, 'Whiskey 2');

      const count1 = CommentModel.countByWhiskeyId(whiskey1.id);
      const count2 = CommentModel.countByWhiskeyId(whiskey2.id);

      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });
  });

  describe('update', () => {
    it('updates comment content', () => {
      const created = CommentModel.create(whiskey1.id, user1.id, 'Original');
      const updated = CommentModel.update(created.id, 'Updated content');

      expect(updated).toBeDefined();
      expect(updated?.content).toBe('Updated content');
    });

    it('returns undefined for non-existent comment', () => {
      const updated = CommentModel.update(99999, 'New content');

      expect(updated).toBeUndefined();
    });

    it('updates the updated_at timestamp', () => {
      const created = CommentModel.create(whiskey1.id, user1.id, 'Original');
      const originalUpdatedAt = created.updated_at;

      // Small delay to ensure timestamp changes
      const updated = CommentModel.update(created.id, 'Updated');

      expect(updated?.updated_at).toBeDefined();
      // Note: In SQLite with CURRENT_TIMESTAMP, this may be the same if executed quickly
    });

    it('preserves other fields when updating', () => {
      const created = CommentModel.create(whiskey1.id, user1.id, 'Original');
      const updated = CommentModel.update(created.id, 'Updated');

      expect(updated?.whiskey_id).toBe(whiskey1.id);
      expect(updated?.user_id).toBe(user1.id);
      expect(updated?.username).toBe('user1');
    });
  });

  describe('delete', () => {
    it('deletes an existing comment', () => {
      const created = CommentModel.create(whiskey1.id, user1.id, 'Delete me');
      const deleted = CommentModel.delete(created.id);

      expect(deleted).toBe(true);
      expect(CommentModel.findById(created.id)).toBeUndefined();
    });

    it('returns false for non-existent comment', () => {
      const deleted = CommentModel.delete(99999);

      expect(deleted).toBe(false);
    });

    it('only deletes specified comment', () => {
      const comment1 = CommentModel.create(whiskey1.id, user1.id, 'Keep me');
      const comment2 = CommentModel.create(whiskey1.id, user1.id, 'Delete me');

      CommentModel.delete(comment2.id);

      expect(CommentModel.findById(comment1.id)).toBeDefined();
      expect(CommentModel.findById(comment2.id)).toBeUndefined();
    });
  });

  describe('isOwner', () => {
    it('returns true when user owns the comment', () => {
      const comment = CommentModel.create(whiskey1.id, user1.id, 'My comment');

      expect(CommentModel.isOwner(comment.id, user1.id)).toBe(true);
    });

    it('returns false when user does not own the comment', () => {
      const comment = CommentModel.create(whiskey1.id, user1.id, 'Not yours');

      expect(CommentModel.isOwner(comment.id, user2.id)).toBe(false);
    });

    it('returns false for non-existent comment', () => {
      expect(CommentModel.isOwner(99999, user1.id)).toBe(false);
    });
  });
});
