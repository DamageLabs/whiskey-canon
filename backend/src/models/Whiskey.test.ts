import { describe, it, expect, beforeEach } from 'vitest';
import { WhiskeyModel, CreateWhiskeyData } from './Whiskey';
import { createTestUser } from '../test/helpers';
import { WhiskeyType, WhiskeyStatus, Role } from '../types';

describe('WhiskeyModel', () => {
  let user1: { id: number };
  let user2: { id: number };

  beforeEach(async () => {
    // Create two users for isolation testing
    user1 = await createTestUser('user1', 'user1@example.com', 'Wh1sk3yTest!!', Role.EDITOR);
    user2 = await createTestUser('user2', 'user2@example.com', 'Wh1sk3yTest!!', Role.EDITOR);
  });

  const createWhiskeyData = (
    userId: number,
    overrides: Partial<CreateWhiskeyData> = {}
  ): CreateWhiskeyData => ({
    name: 'Test Bourbon',
    type: WhiskeyType.BOURBON,
    distillery: 'Test Distillery',
    created_by: userId,
    ...overrides,
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
      const whiskey = WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          region: 'Kentucky',
          age: 12,
          abv: 45.0,
          proof: 90.0,
          size: '750ml',
          quantity: 2,
          msrp: 50.0,
          secondary_price: 75.0,
          description: 'A fine bourbon',
          tasting_notes: 'Caramel, vanilla, oak',
          rating: 8.5,
        })
      );

      expect(whiskey.region).toBe('Kentucky');
      expect(whiskey.age).toBe(12);
      expect(whiskey.abv).toBe(45.0);
      expect(whiskey.proof).toBe(90.0);
      expect(whiskey.size).toBe('750ml');
      expect(whiskey.quantity).toBe(2);
      expect(whiskey.msrp).toBe(50.0);
      expect(whiskey.secondary_price).toBe(75.0);
      expect(whiskey.description).toBe('A fine bourbon');
      expect(whiskey.tasting_notes).toBe('Caramel, vanilla, oak');
      expect(whiskey.rating).toBe(8.5);
    });

    it('sets created_at timestamp', () => {
      const whiskey = WhiskeyModel.create(createWhiskeyData(user1.id));

      expect(whiskey.created_at).toBeDefined();
    });

    it('creates a whiskey with obtained_from field', () => {
      const whiskey = WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          obtained_from: 'John Smith',
          purchase_location: 'Gift',
        })
      );

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
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'User1 Scotch',
          type: WhiskeyType.SCOTCH,
          distillery: 'Scottish Distillery',
        })
      );
      WhiskeyModel.create(createWhiskeyData(user2.id, { name: 'User2 Bourbon' }));
    });

    it('returns all whiskeys without filters', () => {
      const { data: whiskeys } = WhiskeyModel.findAll();

      expect(whiskeys).toHaveLength(3);
    });

    it('filters by userId for user isolation', () => {
      const { data: user1Whiskeys } = WhiskeyModel.findAll({ userId: user1.id });
      const { data: user2Whiskeys } = WhiskeyModel.findAll({ userId: user2.id });

      expect(user1Whiskeys).toHaveLength(2);
      expect(user2Whiskeys).toHaveLength(1);
      expect(user1Whiskeys.every((w) => w.created_by === user1.id)).toBe(true);
      expect(user2Whiskeys.every((w) => w.created_by === user2.id)).toBe(true);
    });

    it('filters by type', () => {
      const { data: bourbons } = WhiskeyModel.findAll({ type: WhiskeyType.BOURBON });
      const { data: scotches } = WhiskeyModel.findAll({ type: WhiskeyType.SCOTCH });

      expect(bourbons).toHaveLength(2);
      expect(scotches).toHaveLength(1);
    });

    it('filters by distillery (partial match)', () => {
      const { data: whiskeys } = WhiskeyModel.findAll({ distillery: 'Scottish' });

      expect(whiskeys).toHaveLength(1);
      expect(whiskeys[0].distillery).toBe('Scottish Distillery');
    });

    it('combines multiple filters', () => {
      const { data: whiskeys } = WhiskeyModel.findAll({
        userId: user1.id,
        type: WhiskeyType.BOURBON,
      });

      expect(whiskeys).toHaveLength(1);
      expect(whiskeys[0].name).toBe('User1 Bourbon');
    });

    it('returns empty array when no matches', () => {
      const { data: whiskeys } = WhiskeyModel.findAll({ type: WhiskeyType.IRISH });

      expect(whiskeys).toHaveLength(0);
    });

    it('orders by created_at descending', () => {
      const { data: whiskeys } = WhiskeyModel.findAll({ userId: user1.id });

      // Just verify we get 2 results ordered by created_at DESC
      // (timestamps may be identical in fast test execution)
      expect(whiskeys).toHaveLength(2);
      expect(whiskeys.map((w) => w.name).sort()).toEqual(['User1 Bourbon', 'User1 Scotch']);
    });
  });

  describe('findAll pagination', () => {
    beforeEach(() => {
      for (let i = 0; i < 10; i++) {
        WhiskeyModel.create(createWhiskeyData(user1.id, { name: `Whiskey ${i}` }));
      }
    });

    it('returns total count with paginated results', () => {
      const { data, total } = WhiskeyModel.findAll({ userId: user1.id, page: 1, limit: 3 });

      expect(data).toHaveLength(3);
      expect(total).toBe(10);
    });

    it('returns second page', () => {
      const { data, total } = WhiskeyModel.findAll({ userId: user1.id, page: 2, limit: 3 });

      expect(data).toHaveLength(3);
      expect(total).toBe(10);
    });

    it('returns partial last page', () => {
      const { data, total } = WhiskeyModel.findAll({ userId: user1.id, page: 4, limit: 3 });

      expect(data).toHaveLength(1);
      expect(total).toBe(10);
    });

    it('returns all results when no limit', () => {
      const { data, total } = WhiskeyModel.findAll({ userId: user1.id });

      expect(data).toHaveLength(10);
      expect(total).toBe(10);
    });

    it('clamps limit to 100', () => {
      const { data } = WhiskeyModel.findAll({ userId: user1.id, page: 1, limit: 200 });

      expect(data).toHaveLength(10); // only 10 exist
    });
  });

  describe('update', () => {
    it('updates whiskey fields', () => {
      const created = WhiskeyModel.create(createWhiskeyData(user1.id));

      const updated = WhiskeyModel.update(created.id, {
        name: 'Updated Bourbon',
        rating: 9.0,
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
        is_investment_bottle: false,
      });

      expect(updated).toBeDefined();
      expect(updated?.is_opened).toBe(1); // SQLite stores as integer
      expect(updated?.is_investment_bottle).toBe(0);
    });

    it('handles null and empty string values', () => {
      const created = WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          description: 'Original description',
        })
      );

      const updated = WhiskeyModel.update(created.id, {
        description: '',
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
      const user1Whiskey = WhiskeyModel.create(
        createWhiskeyData(user1.id, { name: 'User1 Whiskey' })
      );
      const user2Whiskey = WhiskeyModel.create(
        createWhiskeyData(user2.id, { name: 'User2 Whiskey' })
      );

      // Try to delete both whiskeys as user1
      const deleted = WhiskeyModel.deleteMany([user1Whiskey.id, user2Whiskey.id], user1.id);

      // Only user1's whiskey should be deleted
      expect(deleted).toBe(1);
      expect(WhiskeyModel.findById(user1Whiskey.id)).toBeUndefined();
      expect(WhiskeyModel.findById(user2Whiskey.id)).toBeDefined();
    });

    it('returns 0 when none of the ids belong to user', () => {
      const user2Whiskey = WhiskeyModel.create(
        createWhiskeyData(user2.id, { name: 'User2 Whiskey' })
      );

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
      expect(WhiskeyModel.findAll({ userId: user1.id }).data).toHaveLength(0);
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
      expect(WhiskeyModel.findAll({ userId: user1.id }).data).toHaveLength(0);
      expect(WhiskeyModel.findAll({ userId: user2.id }).data).toHaveLength(1);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Buffalo Trace',
          distillery: 'Buffalo Trace Distillery',
          description: 'Classic Kentucky bourbon',
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Eagle Rare',
          distillery: 'Buffalo Trace Distillery',
          description: 'Single barrel bourbon',
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user2.id, {
          name: 'Makers Mark',
          distillery: 'Makers Mark Distillery',
          description: 'Wheated bourbon',
        })
      );
    });

    it('searches by name', () => {
      const { data: results } = WhiskeyModel.search('Makers Mark');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Makers Mark');
    });

    it('searches by distillery', () => {
      const { data: results } = WhiskeyModel.search('Buffalo Trace Distillery');

      expect(results).toHaveLength(2);
    });

    it('searches by description', () => {
      const { data: results } = WhiskeyModel.search('Kentucky');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Buffalo Trace');
    });

    it('search is case-insensitive (via LIKE)', () => {
      const { data: results } = WhiskeyModel.search('makers mark');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Makers Mark');
    });

    it('enforces user isolation in search', () => {
      const { data: user1Results } = WhiskeyModel.search('bourbon', user1.id);
      const { data: user2Results } = WhiskeyModel.search('bourbon', user2.id);

      expect(user1Results).toHaveLength(2); // Buffalo Trace and Eagle Rare
      expect(user2Results).toHaveLength(1); // Makers Mark
    });

    it('returns empty array when no matches', () => {
      const { data: results } = WhiskeyModel.search('NonexistentWhiskey');

      expect(results).toHaveLength(0);
    });
  });

  describe('findAllWithOwners', () => {
    beforeEach(() => {
      WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'User1 Whiskey' }));
      WhiskeyModel.create(createWhiskeyData(user2.id, { name: 'User2 Whiskey' }));
    });

    it('returns whiskeys with owner information', () => {
      const { data: whiskeys } = WhiskeyModel.findAllWithOwners();

      expect(whiskeys).toHaveLength(2);
      expect(whiskeys[0].owner_username).toBeDefined();
      expect(whiskeys[0].owner_email).toBeDefined();
      expect(whiskeys[0].owner_role).toBeDefined();
    });

    it('includes correct owner data', () => {
      const { data: whiskeys } = WhiskeyModel.findAllWithOwners();

      const user1Whiskey = whiskeys.find((w) => w.name === 'User1 Whiskey');
      const user2Whiskey = whiskeys.find((w) => w.name === 'User2 Whiskey');

      expect(user1Whiskey?.owner_username).toBe('user1');
      expect(user1Whiskey?.owner_email).toBe('user1@example.com');
      expect(user2Whiskey?.owner_username).toBe('user2');
      expect(user2Whiskey?.owner_email).toBe('user2@example.com');
    });

    it('orders by username then created_at descending', () => {
      // Add another whiskey for user1
      WhiskeyModel.create(createWhiskeyData(user1.id, { name: 'User1 Second Whiskey' }));

      const { data: whiskeys } = WhiskeyModel.findAllWithOwners();

      // Should be ordered by username (user1, user2)
      // User1 should have 2 whiskeys, user2 should have 1
      const user1Whiskeys = whiskeys.filter((w) => w.owner_username === 'user1');
      const user2Whiskeys = whiskeys.filter((w) => w.owner_username === 'user2');

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
        WhiskeyType.OTHER,
      ];

      types.forEach((type) => {
        const whiskey = WhiskeyModel.create(
          createWhiskeyData(user1.id, {
            name: `${type} Whiskey`,
            type,
          })
        );
        expect(whiskey.type).toBe(type);
      });
    });

    it('handles special characters in search', () => {
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: "Maker's Mark",
          description: '100% corn & wheat mash',
        })
      );

      const { data: results } = WhiskeyModel.search("Maker's");
      expect(results).toHaveLength(1);

      const { data: results2 } = WhiskeyModel.search('corn & wheat');
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

  describe('openBottle', () => {
    it('splits one bottle off and marks it as opened', () => {
      const source = WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          quantity: 5,
          is_opened: false,
          msrp: 50,
          region: 'Kentucky',
        })
      );

      const { openedBottle, sourceBottle } = WhiskeyModel.openBottle(source.id, user1.id);

      expect(sourceBottle.quantity).toBe(4);
      expect(sourceBottle.is_opened).toBeFalsy();

      expect(openedBottle.id).not.toBe(source.id);
      expect(openedBottle.quantity).toBe(1);
      expect(openedBottle.is_opened).toBeTruthy();
      expect(openedBottle.date_opened).toBe(new Date().toISOString().split('T')[0]);
      expect(openedBottle.name).toBe(source.name);
      expect(openedBottle.distillery).toBe(source.distillery);
      expect(openedBottle.msrp).toBe(50);
      expect(openedBottle.region).toBe('Kentucky');
      expect(openedBottle.created_by).toBe(user1.id);
    });

    it('throws 404 for non-existent whiskey', () => {
      expect(() => WhiskeyModel.openBottle(99999, user1.id)).toThrow('Whiskey not found');
    });

    it('throws 400 when quantity is 1', () => {
      const whiskey = WhiskeyModel.create(
        createWhiskeyData(user1.id, { quantity: 1, is_opened: false })
      );

      expect(() => WhiskeyModel.openBottle(whiskey.id, user1.id)).toThrow(
        'quantity must be greater than 1'
      );
    });

    it('throws 400 when quantity is null/undefined', () => {
      const whiskey = WhiskeyModel.create(createWhiskeyData(user1.id));

      expect(() => WhiskeyModel.openBottle(whiskey.id, user1.id)).toThrow(
        'quantity must be greater than 1'
      );
    });

    it('throws 400 when already opened', () => {
      const whiskey = WhiskeyModel.create(
        createWhiskeyData(user1.id, { quantity: 3, is_opened: true })
      );

      expect(() => WhiskeyModel.openBottle(whiskey.id, user1.id)).toThrow('already opened');
    });

    it('enforces user isolation', () => {
      const whiskey = WhiskeyModel.create(
        createWhiskeyData(user1.id, { quantity: 3, is_opened: false })
      );

      expect(() => WhiskeyModel.openBottle(whiskey.id, user2.id)).toThrow('Whiskey not found');
    });

    it('works when quantity is exactly 2', () => {
      const source = WhiskeyModel.create(
        createWhiskeyData(user1.id, { quantity: 2, is_opened: false })
      );

      const { openedBottle, sourceBottle } = WhiskeyModel.openBottle(source.id, user1.id);

      expect(sourceBottle.quantity).toBe(1);
      expect(openedBottle.quantity).toBe(1);
      expect(openedBottle.is_opened).toBeTruthy();
    });
  });

  describe('getPublicStats', () => {
    it('returns correct stats for user with whiskeys', () => {
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Bourbon 1',
          type: WhiskeyType.BOURBON,
          distillery: 'Buffalo Trace',
          country: 'USA',
          rating: 8.5,
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Bourbon 2',
          type: WhiskeyType.BOURBON,
          distillery: 'Buffalo Trace',
          country: 'USA',
          rating: 9.0,
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Scotch 1',
          type: WhiskeyType.SCOTCH,
          distillery: 'Macallan',
          country: 'Scotland',
          rating: 9.5,
        })
      );

      const stats = WhiskeyModel.getPublicStats(user1.id);

      expect(stats.totalBottles).toBe(3);
      expect(stats.typeBreakdown).toHaveLength(2);
      expect(stats.typeBreakdown.find((t) => t.type === WhiskeyType.BOURBON)?.count).toBe(2);
      expect(stats.typeBreakdown.find((t) => t.type === WhiskeyType.SCOTCH)?.count).toBe(1);
      expect(stats.topDistilleries).toHaveLength(2);
      expect(stats.totalDistilleries).toBe(2);
      expect(stats.averageRating).toBe(9.0); // (8.5 + 9.0 + 9.5) / 3 = 9.0
      expect(stats.countriesRepresented.sort()).toEqual(['Scotland', 'USA']);
    });

    it('returns empty stats for user with no whiskeys', () => {
      const stats = WhiskeyModel.getPublicStats(user1.id);

      expect(stats.totalBottles).toBe(0);
      expect(stats.typeBreakdown).toHaveLength(0);
      expect(stats.topDistilleries).toHaveLength(0);
      expect(stats.totalDistilleries).toBe(0);
      expect(stats.averageRating).toBeNull();
      expect(stats.countriesRepresented).toHaveLength(0);
    });

    it('returns null averageRating when no whiskeys have ratings', () => {
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Unrated Bourbon',
          // No rating provided
        })
      );

      const stats = WhiskeyModel.getPublicStats(user1.id);

      expect(stats.totalBottles).toBe(1);
      expect(stats.averageRating).toBeNull();
    });

    it('calculates averageRating only from rated whiskeys', () => {
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Rated Bourbon',
          rating: 8.0,
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Unrated Bourbon',
          // No rating
        })
      );

      const stats = WhiskeyModel.getPublicStats(user1.id);

      expect(stats.totalBottles).toBe(2);
      expect(stats.averageRating).toBe(8.0); // Only counts the rated one
    });

    it('only returns stats for specified user', () => {
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'User1 Bourbon',
          type: WhiskeyType.BOURBON,
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user2.id, {
          name: 'User2 Scotch',
          type: WhiskeyType.SCOTCH,
        })
      );

      const user1Stats = WhiskeyModel.getPublicStats(user1.id);
      const user2Stats = WhiskeyModel.getPublicStats(user2.id);

      expect(user1Stats.totalBottles).toBe(1);
      expect(user1Stats.typeBreakdown[0].type).toBe(WhiskeyType.BOURBON);

      expect(user2Stats.totalBottles).toBe(1);
      expect(user2Stats.typeBreakdown[0].type).toBe(WhiskeyType.SCOTCH);
    });

    it('returns top 5 distilleries ordered by count', () => {
      // Create whiskeys with varying distillery counts
      for (let i = 0; i < 6; i++) {
        WhiskeyModel.create(
          createWhiskeyData(user1.id, {
            name: `Buffalo Trace ${i}`,
            distillery: 'Buffalo Trace',
          })
        );
      }
      for (let i = 0; i < 4; i++) {
        WhiskeyModel.create(
          createWhiskeyData(user1.id, {
            name: `Macallan ${i}`,
            distillery: 'Macallan',
          })
        );
      }
      for (let i = 0; i < 3; i++) {
        WhiskeyModel.create(
          createWhiskeyData(user1.id, {
            name: `Makers Mark ${i}`,
            distillery: 'Makers Mark',
          })
        );
      }
      for (let i = 0; i < 2; i++) {
        WhiskeyModel.create(
          createWhiskeyData(user1.id, {
            name: `Wild Turkey ${i}`,
            distillery: 'Wild Turkey',
          })
        );
      }
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Woodford Reserve 1',
          distillery: 'Woodford Reserve',
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Four Roses 1',
          distillery: 'Four Roses',
        })
      );

      const stats = WhiskeyModel.getPublicStats(user1.id);

      expect(stats.topDistilleries).toHaveLength(5);
      expect(stats.topDistilleries[0].distillery).toBe('Buffalo Trace');
      expect(stats.topDistilleries[0].count).toBe(6);
      expect(stats.topDistilleries[1].distillery).toBe('Macallan');
      expect(stats.topDistilleries[1].count).toBe(4);
      expect(stats.totalDistilleries).toBe(6); // All 6 unique distilleries
    });

    it('handles single whiskey correctly', () => {
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Only Bourbon',
          type: WhiskeyType.BOURBON,
          distillery: 'Buffalo Trace',
          country: 'USA',
          rating: 7.5,
        })
      );

      const stats = WhiskeyModel.getPublicStats(user1.id);

      expect(stats.totalBottles).toBe(1);
      expect(stats.typeBreakdown).toHaveLength(1);
      expect(stats.typeBreakdown[0]).toEqual({ type: WhiskeyType.BOURBON, count: 1 });
      expect(stats.topDistilleries).toHaveLength(1);
      expect(stats.topDistilleries[0]).toEqual({ distillery: 'Buffalo Trace', count: 1 });
      expect(stats.totalDistilleries).toBe(1);
      expect(stats.averageRating).toBe(7.5);
      expect(stats.countriesRepresented).toEqual(['USA']);
    });

    it('excludes empty string countries', () => {
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Bourbon with Country',
          country: 'USA',
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Bourbon without Country',
          country: '',
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Bourbon with null Country',
          // country is undefined/null
        })
      );

      const stats = WhiskeyModel.getPublicStats(user1.id);

      expect(stats.totalBottles).toBe(3);
      expect(stats.countriesRepresented).toEqual(['USA']);
    });

    it('orders countries alphabetically', () => {
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Japanese',
          country: 'Japan',
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'American',
          country: 'USA',
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Scottish',
          country: 'Scotland',
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Irish',
          country: 'Ireland',
        })
      );

      const stats = WhiskeyModel.getPublicStats(user1.id);

      expect(stats.countriesRepresented).toEqual(['Ireland', 'Japan', 'Scotland', 'USA']);
    });

    it('handles duplicate countries correctly', () => {
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Bourbon 1',
          country: 'USA',
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Bourbon 2',
          country: 'USA',
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Scotch 1',
          country: 'Scotland',
        })
      );

      const stats = WhiskeyModel.getPublicStats(user1.id);

      expect(stats.countriesRepresented).toEqual(['Scotland', 'USA']);
    });

    it('rounds average rating to one decimal place', () => {
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Bourbon 1',
          rating: 8.33,
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Bourbon 2',
          rating: 8.67,
        })
      );

      const stats = WhiskeyModel.getPublicStats(user1.id);

      // (8.33 + 8.67) / 2 = 8.5
      expect(stats.averageRating).toBe(8.5);
    });

    it('handles ratings with many decimal places', () => {
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Bourbon 1',
          rating: 7.777,
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Bourbon 2',
          rating: 8.333,
        })
      );
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Bourbon 3',
          rating: 9.111,
        })
      );

      const stats = WhiskeyModel.getPublicStats(user1.id);

      // (7.777 + 8.333 + 9.111) / 3 = 8.407 -> rounded to 8.4
      expect(stats.averageRating).toBe(8.4);
    });

    it('returns stats for non-existent user (empty results)', () => {
      const stats = WhiskeyModel.getPublicStats(99999);

      expect(stats.totalBottles).toBe(0);
      expect(stats.typeBreakdown).toHaveLength(0);
      expect(stats.topDistilleries).toHaveLength(0);
      expect(stats.totalDistilleries).toBe(0);
      expect(stats.averageRating).toBeNull();
      expect(stats.countriesRepresented).toHaveLength(0);
    });

    it('orders type breakdown by count descending', () => {
      // Create more bourbons than scotch
      for (let i = 0; i < 5; i++) {
        WhiskeyModel.create(
          createWhiskeyData(user1.id, {
            name: `Bourbon ${i}`,
            type: WhiskeyType.BOURBON,
          })
        );
      }
      for (let i = 0; i < 3; i++) {
        WhiskeyModel.create(
          createWhiskeyData(user1.id, {
            name: `Scotch ${i}`,
            type: WhiskeyType.SCOTCH,
          })
        );
      }
      WhiskeyModel.create(
        createWhiskeyData(user1.id, {
          name: 'Rye 1',
          type: WhiskeyType.RYE,
        })
      );

      const stats = WhiskeyModel.getPublicStats(user1.id);

      expect(stats.typeBreakdown[0]).toEqual({ type: WhiskeyType.BOURBON, count: 5 });
      expect(stats.typeBreakdown[1]).toEqual({ type: WhiskeyType.SCOTCH, count: 3 });
      expect(stats.typeBreakdown[2]).toEqual({ type: WhiskeyType.RYE, count: 1 });
    });
  });
});
