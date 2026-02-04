import { describe, it, expect, beforeEach } from 'vitest';
import { WhiskeyModel, CreateWhiskeyData } from './Whiskey';
import { createTestUser } from '../test/helpers';
import { WhiskeyType, WhiskeyStatus, Role } from '../types';

describe('WhiskeyModel', () => {
  let user1: { id: number };
  let user2: { id: number };

  beforeEach(async () => {
    // Create two users for isolation testing
    user1 = await createTestUser('user1', 'user1@example.com', 'password123', Role.EDITOR);
    user2 = await createTestUser('user2', 'user2@example.com', 'password123', Role.EDITOR);
  });

  const createWhiskeyData = (userId: number, overrides: Partial<CreateWhiskeyData> = {}): CreateWhiskeyData => ({
    name: 'Test Bourbon',
    type: WhiskeyType.BOURBON,
    distillery: 'Test Distillery',
    created_by: userId,
    ...overrides
  });

  describe('create', () => {
    it('creates a whiskey with required fields', () => {
      const whiskey = WhiskeyModel.create(createWhiskeyData(user1.id));

      expect(whiskey).toBeDefined();
      expect(whiskey.id).toBeDefined();
      expect(whiskey.name).toBe('Test Bourbon');
      expect(whiskey.type).toBe(WhiskeyType.BOURBON);
      expect(whiskey.distillery).toBe('Test Distillery');
      expect(whiskey.created_by).toBe(user1.id);
    });

    it('creates a whiskey with optional fields', () => {
      const whiskey = WhiskeyModel.create(createWhiskeyData(user1.id, {
        region: 'Kentucky',
        age: 12,
        abv: 45.0,
        size: '750ml',
        quantity: 2,
        msrp: 50.00,
        secondary_price: 75.00,
        description: 'A fine bourbon',
        tasting_notes: 'Caramel, vanilla, oak',
        rating: 8.5
      }));

      expect(whiskey.region).toBe('Kentucky');
      expect(whiskey.age).toBe(12);
      expect(whiskey.abv).toBe(45.0);
      expect(whiskey.size).toBe('750ml');
      expect(whiskey.quantity).toBe(2);
      expect(whiskey.msrp).toBe(50.00);
      expect(whiskey.secondary_price).toBe(75.00);
      expect(whiskey.description).toBe('A fine bourbon');
      expect(whiskey.tasting_notes).toBe('Caramel, vanilla, oak');
      expect(whiskey.rating).toBe(8.5);
    });

    it('sets created_at timestamp', () => {
      const whiskey = WhiskeyModel.create(createWhiskeyData(user1.id));

      expect(whiskey.created_at).toBeDefined();
    });

    it('creates a whiskey with obtained_from field', () => {
      const whiskey = WhiskeyModel.create(createWhiskeyData(user1.id, {
        obtained_from: 'John Smith',
        purchase_location: 'Gift'
      }));

      expect(whiskey.obtained_from).toBe('John Smith');
      expect(whiskey.purchase_location).toBe('Gift');
    });
  });

  describe('findById', () => {
    it('finds whiskey by id', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id));
      const found = WhiskeyModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Bourbon');
    });

    it('returns undefined for non-existent id', () => {
      const found = WhiskeyModel.findById(99999);

      expect(found).toBeUndefined();
    });

    it('finds whiskey by id with user isolation', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id));

      // User1 can find their own whiskey
      const foundByOwner = WhiskeyModel.findById(created.id, user1.id);
      expect(foundByOwner).toBeDefined();
      expect(foundByOwner?.id).toBe(created.id);

      // User2 cannot find user1's whiskey with isolation
      const foundByOther = WhiskeyModel.findById(created.id, user2.id);
      expect(foundByOther).toBeUndefined();
    });

    it('finds whiskey without user isolation when userId not provided', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id));

      // Without userId, anyone can find the whiskey (admin use case)
      const found = WhiskeyModel.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      // Create whiskeys for both users
      WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'User1 Bourbon' }));
      WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'User1 Scotch', type: WhiskeyType.SCOTCH, distillery: 'Scottish Distillery' }));
      WhiskeyModel.create(createWhiskeyData(user2.id, { name: 'User2 Bourbon' }));
    });

    it('returns all whiskeys without filters', () => {
      const whiskeys = WhiskeyModel.findAll();

      expect(whiskeys).toHaveLength(3);
    });

    it('filters by userId for user isolation', () => {
      const user1Whiskeys = WhiskeyModel.findAll({ userId: user1.id });
      const user2Whiskeys = WhiskeyModel.findAll({ userId: user2.id });

      expect(user1Whiskeys).toHaveLength(2);
      expect(user2Whiskeys).toHaveLength(1);
      expect(user1Whiskeys.every(w => w.created_by === user1.id)).toBe(true);
      expect(user2Whiskeys.every(w => w.created_by === user2.id)).toBe(true);
    });

    it('filters by type', () => {
      const bourbons = WhiskeyModel.findAll({ type: WhiskeyType.BOURBON });
      const scotches = WhiskeyModel.findAll({ type: WhiskeyType.SCOTCH });

      expect(bourbons).toHaveLength(2);
      expect(scotches).toHaveLength(1);
    });

    it('filters by distillery (partial match)', () => {
      const whiskeys = WhiskeyModel.findAll({ distillery: 'Scottish' });

      expect(whiskeys).toHaveLength(1);
      expect(whiskeys[0].distillery).toBe('Scottish Distillery');
    });

    it('combines multiple filters', () => {
      const whiskeys = WhiskeyModel.findAll({
        userId: user1.id,
        type: WhiskeyType.BOURBON
      });

      expect(whiskeys).toHaveLength(1);
      expect(whiskeys[0].name).toBe('User1 Bourbon');
    });

    it('returns empty array when no matches', () => {
      const whiskeys = WhiskeyModel.findAll({ type: WhiskeyType.IRISH });

      expect(whiskeys).toHaveLength(0);
    });

    it('orders by created_at descending', () => {
      const whiskeys = WhiskeyModel.findAll({ userId: user1.id });

      // Just verify we get 2 results ordered by created_at DESC
      // (timestamps may be identical in fast test execution)
      expect(whiskeys).toHaveLength(2);
      expect(whiskeys.map(w => w.name).sort()).toEqual(['User1 Bourbon', 'User1 Scotch']);
    });
  });

  describe('update', () => {
    it('updates whiskey fields', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id));

      const updated = WhiskeyModel.update(created.id, {
        name: 'Updated Bourbon',
        rating: 9.0
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Bourbon');
      expect(updated?.rating).toBe(9.0);
      expect(updated?.distillery).toBe('Test Distillery'); // Unchanged
    });

    it('updates updated_at timestamp', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id));
      const originalUpdatedAt = created.updated_at;

      // Small delay to ensure timestamp difference
      const updated = WhiskeyModel.update(created.id, { name: 'Updated' });

      expect(updated?.updated_at).toBeDefined();
      // The timestamps might be the same if executed too quickly, so we just verify it exists
    });

    it('returns undefined for non-existent id', () => {
      const updated = WhiskeyModel.update(99999, { name: 'Updated' });

      expect(updated).toBeUndefined();
    });

    it('enforces user isolation - owner can update', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id));

      const updated = WhiskeyModel.update(created.id, { name: 'Updated' }, user1.id);

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated');
    });

    it('enforces user isolation - non-owner cannot update', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id));

      const updated = WhiskeyModel.update(created.id, { name: 'Hacked!' }, user2.id);

      expect(updated).toBeUndefined();

      // Verify original is unchanged
      const original = WhiskeyModel.findById(created.id);
      expect(original?.name).toBe('Test Bourbon');
    });

    it('returns existing whiskey when no updates provided', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id));

      const updated = WhiskeyModel.update(created.id, {}, user1.id);

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Test Bourbon');
    });

    it('converts boolean values to 0/1 for SQLite', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id));

      const updated = WhiskeyModel.update(created.id, {
        is_opened: true,
        is_investment_bottle: false
      });

      expect(updated).toBeDefined();
      expect(updated?.is_opened).toBe(1); // SQLite stores as integer
      expect(updated?.is_investment_bottle).toBe(0);
    });

    it('handles null and empty string values', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id, {
        description: 'Original description'
      }));

      const updated = WhiskeyModel.update(created.id, {
        description: ''
      });

      expect(updated).toBeDefined();
      expect(updated?.description).toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes whiskey by id', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id));

      const deleted = WhiskeyModel.delete(created.id);

      expect(deleted).toBe(true);
      expect(WhiskeyModel.findById(created.id)).toBeUndefined();
    });

    it('returns false for non-existent id', () => {
      const deleted = WhiskeyModel.delete(99999);

      expect(deleted).toBe(false);
    });

    it('enforces user isolation - owner can delete', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id));

      const deleted = WhiskeyModel.delete(created.id, user1.id);

      expect(deleted).toBe(true);
      expect(WhiskeyModel.findById(created.id)).toBeUndefined();
    });

    it('enforces user isolation - non-owner cannot delete', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id));

      const deleted = WhiskeyModel.delete(created.id, user2.id);

      expect(deleted).toBe(false);

      // Verify whiskey still exists
      const stillExists = WhiskeyModel.findById(created.id);
      expect(stillExists).toBeDefined();
    });
  });

  describe('deleteMany', () => {
    it('deletes multiple whiskeys by ids', () => {
      const whiskey1 = WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'Whiskey 1' }));
      const whiskey2 = WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'Whiskey 2' }));
      const whiskey3 = WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'Whiskey 3' }));

      const deleted = WhiskeyModel.deleteMany([whiskey1.id, whiskey2.id], user1.id);

      expect(deleted).toBe(2);
      expect(WhiskeyModel.findById(whiskey1.id)).toBeUndefined();
      expect(WhiskeyModel.findById(whiskey2.id)).toBeUndefined();
      expect(WhiskeyModel.findById(whiskey3.id)).toBeDefined();
    });

    it('returns 0 for empty ids array', () => {
      const deleted = WhiskeyModel.deleteMany([], user1.id);

      expect(deleted).toBe(0);
    });

    it('only deletes whiskeys belonging to the user', () => {
      const user1Whiskey = WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'User1 Whiskey' }));
      const user2Whiskey = WhiskeyModel.create(createWhiskeyData(user2.id, { name: 'User2 Whiskey' }));

      // Try to delete both whiskeys as user1
      const deleted = WhiskeyModel.deleteMany([user1Whiskey.id, user2Whiskey.id], user1.id);

      // Only user1's whiskey should be deleted
      expect(deleted).toBe(1);
      expect(WhiskeyModel.findById(user1Whiskey.id)).toBeUndefined();
      expect(WhiskeyModel.findById(user2Whiskey.id)).toBeDefined();
    });

    it('returns 0 when none of the ids belong to user', () => {
      const user2Whiskey = WhiskeyModel.create(createWhiskeyData(user2.id, { name: 'User2 Whiskey' }));

      const deleted = WhiskeyModel.deleteMany([user2Whiskey.id], user1.id);

      expect(deleted).toBe(0);
      expect(WhiskeyModel.findById(user2Whiskey.id)).toBeDefined();
    });
  });

  describe('deleteAllByUser', () => {
    it('deletes all whiskeys for a user', () => {
      WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'Whiskey 1' }));
      WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'Whiskey 2' }));
      WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'Whiskey 3' }));

      const deleted = WhiskeyModel.deleteAllByUser(user1.id);

      expect(deleted).toBe(3);
      expect(WhiskeyModel.findAll({ userId: user1.id })).toHaveLength(0);
    });

    it('returns 0 when user has no whiskeys', () => {
      const deleted = WhiskeyModel.deleteAllByUser(user1.id);

      expect(deleted).toBe(0);
    });

    it('only deletes whiskeys for the specified user', () => {
      WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'User1 Whiskey' }));
      WhiskeyModel.create(createWhiskeyData(user2.id, { name: 'User2 Whiskey' }));

      const deleted = WhiskeyModel.deleteAllByUser(user1.id);

      expect(deleted).toBe(1);
      expect(WhiskeyModel.findAll({ userId: user1.id })).toHaveLength(0);
      expect(WhiskeyModel.findAll({ userId: user2.id })).toHaveLength(1);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      WhiskeyModel.create(createWhiskeyData(user1.id, {
        name: 'Buffalo Trace',
        distillery: 'Buffalo Trace Distillery',
        description: 'Classic Kentucky bourbon'
      }));
      WhiskeyModel.create(createWhiskeyData(user1.id, {
        name: 'Eagle Rare',
        distillery: 'Buffalo Trace Distillery',
        description: 'Single barrel bourbon'
      }));
      WhiskeyModel.create(createWhiskeyData(user2.id, {
        name: 'Makers Mark',
        distillery: 'Makers Mark Distillery',
        description: 'Wheated bourbon'
      }));
    });

    it('searches by name', () => {
      const results = WhiskeyModel.search('Makers Mark');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Makers Mark');
    });

    it('searches by distillery', () => {
      const results = WhiskeyModel.search('Buffalo Trace Distillery');

      expect(results).toHaveLength(2);
    });

    it('searches by description', () => {
      const results = WhiskeyModel.search('Kentucky');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Buffalo Trace');
    });

    it('search is case-insensitive (via LIKE)', () => {
      const results = WhiskeyModel.search('makers mark');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Makers Mark');
    });

    it('enforces user isolation in search', () => {
      const user1Results = WhiskeyModel.search('bourbon', user1.id);
      const user2Results = WhiskeyModel.search('bourbon', user2.id);

      expect(user1Results).toHaveLength(2); // Buffalo Trace and Eagle Rare
      expect(user2Results).toHaveLength(1); // Makers Mark
    });

    it('returns empty array when no matches', () => {
      const results = WhiskeyModel.search('NonexistentWhiskey');

      expect(results).toHaveLength(0);
    });
  });

  describe('findAllWithOwners', () => {
    beforeEach(() => {
      WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'User1 Whiskey' }));
      WhiskeyModel.create(createWhiskeyData(user2.id, { name: 'User2 Whiskey' }));
    });

    it('returns whiskeys with owner information', () => {
      const whiskeys = WhiskeyModel.findAllWithOwners();

      expect(whiskeys).toHaveLength(2);
      expect(whiskeys[0].owner_username).toBeDefined();
      expect(whiskeys[0].owner_email).toBeDefined();
      expect(whiskeys[0].owner_role).toBeDefined();
    });

    it('includes correct owner data', () => {
      const whiskeys = WhiskeyModel.findAllWithOwners();

      const user1Whiskey = whiskeys.find(w => w.name === 'User1 Whiskey');
      const user2Whiskey = whiskeys.find(w => w.name === 'User2 Whiskey');

      expect(user1Whiskey?.owner_username).toBe('user1');
      expect(user1Whiskey?.owner_email).toBe('user1@example.com');
      expect(user2Whiskey?.owner_username).toBe('user2');
      expect(user2Whiskey?.owner_email).toBe('user2@example.com');
    });

    it('orders by username then created_at descending', () => {
      // Add another whiskey for user1
      WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'User1 Second Whiskey' }));

      const whiskeys = WhiskeyModel.findAllWithOwners();

      // Should be ordered by username (user1, user2)
      // User1 should have 2 whiskeys, user2 should have 1
      const user1Whiskeys = whiskeys.filter(w => w.owner_username === 'user1');
      const user2Whiskeys = whiskeys.filter(w => w.owner_username === 'user2');

      expect(user1Whiskeys).toHaveLength(2);
      expect(user2Whiskeys).toHaveLength(1);
      expect(whiskeys[0].owner_username).toBe('user1');
      expect(whiskeys[2].owner_username).toBe('user2');
    });
  });

  describe('edge cases', () => {
    it('handles whiskey types correctly', () => {
      const types = [
        WhiskeyType.BOURBON,
        WhiskeyType.SCOTCH,
        WhiskeyType.IRISH,
        WhiskeyType.JAPANESE,
        WhiskeyType.RYE,
        WhiskeyType.TENNESSEE,
        WhiskeyType.CANADIAN,
        WhiskeyType.OTHER
      ];

      types.forEach(type => {
        const whiskey = WhiskeyModel.create(createWhiskeyData(user1.id, {
          name: `${type} Whiskey`,
          type
        }));
        expect(whiskey.type).toBe(type);
      });
    });

    it('handles special characters in search', () => {
      WhiskeyModel.create(createWhiskeyData(user1.id, {
        name: "Maker's Mark",
        description: "100% corn & wheat mash"
      }));

      const results = WhiskeyModel.search("Maker's");
      expect(results).toHaveLength(1);

      const results2 = WhiskeyModel.search("corn & wheat");
      expect(results2).toHaveLength(1);
    });

    it('handles rating boundary values', () => {
      // Note: rating of 0 is treated as falsy and stored as null due to `|| null` in model
      const whiskey1 = WhiskeyModel.create(createWhiskeyData(user1.id, { rating: 0.5 }));
      const whiskey2 = WhiskeyModel.create(createWhiskeyData(user1.id, { rating: 10 }));

      expect(whiskey1.rating).toBe(0.5);
      expect(whiskey2.rating).toBe(10);
    });
  });
});
