import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createAuthenticatedAgent, createTestWhiskey } from '../test/helpers';
import { testDb } from '../test/setup';
import { Role, WhiskeyType } from '../types';
import type { Application } from 'express';

describe('Statistics Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Authentication', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/api/statistics');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/statistics', () => {
    it('returns statistics structure', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      expect(response.body.statistics).toBeDefined();
      expect(response.body.statistics.financial).toBeDefined();
      expect(response.body.statistics.inventory).toBeDefined();
      expect(response.body.statistics.composition).toBeDefined();
      expect(response.body.statistics.quality).toBeDefined();
      expect(response.body.statistics.acquisition).toBeDefined();
      expect(response.body.statistics.special).toBeDefined();
      expect(response.body.statistics.tasting).toBeDefined();
      expect(response.body.statistics.sharing).toBeDefined();
    });

    it('returns zero counts for empty collection', async () => {
      const { agent } = await createAuthenticatedAgent(app);

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      expect(response.body.statistics.financial.total_bottles).toBe(0);
    });

    it('calculates financial statistics', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      // Create whiskeys with financial data
      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, purchase_price, msrp, current_market_value, secondary_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('Whiskey 1', 'bourbon', 'Distillery A', user.id, 50, 60, 80, 90);

      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, purchase_price, msrp, current_market_value, secondary_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('Whiskey 2', 'bourbon', 'Distillery B', user.id, 100, 120, 150, 200);

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      expect(response.body.statistics.financial.total_bottles).toBe(2);
      expect(response.body.statistics.financial.total_spent).toBe(150);
      expect(response.body.statistics.financial.total_msrp).toBe(180);
      expect(response.body.statistics.financial.total_current_value).toBe(230);
      expect(response.body.statistics.financial.total_secondary_value).toBe(290);
      expect(response.body.statistics.financial.avg_secondary_value).toBe(145);
    });

    it('returns most valuable bottles by secondary price', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, secondary_price)
        VALUES (?, ?, ?, ?, ?)
      `).run('Cheap Whiskey', 'bourbon', 'Distillery', user.id, 50);

      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, secondary_price)
        VALUES (?, ?, ?, ?, ?)
      `).run('Expensive Whiskey', 'bourbon', 'Distillery', user.id, 500);

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      expect(response.body.statistics.financial.mostValuable).toHaveLength(2);
      expect(response.body.statistics.financial.mostValuable[0].name).toBe('Expensive Whiskey');
      expect(response.body.statistics.financial.mostValuable[0].secondary_price).toBe(500);
    });

    it('calculates inventory statistics', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      // Create opened and unopened whiskeys
      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, is_opened, remaining_volume, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('Opened', 'bourbon', 'Distillery', user.id, 1, 50, 'in_collection');

      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, is_opened, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Unopened', 'bourbon', 'Distillery', user.id, 0, 'in_collection');

      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, status)
        VALUES (?, ?, ?, ?, ?)
      `).run('Consumed', 'bourbon', 'Distillery', user.id, 'consumed');

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      expect(response.body.statistics.inventory.opened_count).toBe(1);
      expect(response.body.statistics.inventory.unopened_count).toBe(2);
      expect(response.body.statistics.inventory.consumed_count).toBe(1);
      expect(response.body.statistics.inventory.in_collection_count).toBe(2);
    });

    it('counts whiskeys without status as in_collection', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      // Create whiskeys without status field (NULL)
      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by)
        VALUES (?, ?, ?, ?)
      `).run('No Status', 'bourbon', 'Distillery', user.id);

      // Create whiskey with empty string status
      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, status)
        VALUES (?, ?, ?, ?, ?)
      `).run('Empty Status', 'bourbon', 'Distillery', user.id, '');

      // Create whiskey with explicit in_collection status
      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, status)
        VALUES (?, ?, ?, ?, ?)
      `).run('Explicit Status', 'bourbon', 'Distillery', user.id, 'in_collection');

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      // All three should be counted as in_collection
      expect(response.body.statistics.inventory.in_collection_count).toBe(3);
    });

    it('returns bottles running low', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, is_opened, remaining_volume)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Running Low', 'bourbon', 'Distillery', user.id, 1, 10);

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      expect(response.body.statistics.inventory.runningLow).toHaveLength(1);
      expect(response.body.statistics.inventory.runningLow[0].name).toBe('Running Low');
    });

    it('calculates type distribution', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      createTestWhiskey(user.id, { type: WhiskeyType.BOURBON });
      createTestWhiskey(user.id, { type: WhiskeyType.BOURBON });
      createTestWhiskey(user.id, { type: WhiskeyType.SCOTCH });

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      const typeDistribution = response.body.statistics.composition.typeDistribution;
      const bourbon = typeDistribution.find((t: any) => t.type === 'bourbon');
      const scotch = typeDistribution.find((t: any) => t.type === 'scotch');

      expect(bourbon.count).toBe(2);
      expect(scotch.count).toBe(1);
    });

    it('returns top distilleries', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      createTestWhiskey(user.id, { distillery: 'Buffalo Trace' });
      createTestWhiskey(user.id, { distillery: 'Buffalo Trace' });
      createTestWhiskey(user.id, { distillery: 'Makers Mark' });

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      const topDistilleries = response.body.statistics.composition.topDistilleries;
      expect(topDistilleries[0].distillery).toBe('Buffalo Trace');
      expect(topDistilleries[0].count).toBe(2);
    });

    it('calculates rating statistics', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, rating)
        VALUES (?, ?, ?, ?, ?)
      `).run('Good', 'bourbon', 'Distillery', user.id, 8.5);

      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, rating)
        VALUES (?, ?, ?, ?, ?)
      `).run('Great', 'bourbon', 'Distillery', user.id, 9.5);

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      expect(response.body.statistics.quality.rated_count).toBe(2);
      expect(response.body.statistics.quality.highest_rating).toBe(9.5);
      expect(response.body.statistics.quality.lowest_rating).toBe(8.5);
    });

    it('returns highest rated bottles', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, rating)
        VALUES (?, ?, ?, ?, ?)
      `).run('Top Rated', 'bourbon', 'Distillery', user.id, 9.8);

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      expect(response.body.statistics.quality.highestRated[0].name).toBe('Top Rated');
      expect(response.body.statistics.quality.highestRated[0].rating).toBe(9.8);
    });

    it('calculates special items statistics', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, limited_edition, natural_color, barrel_number, awards)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('Special', 'bourbon', 'Distillery', user.id, 1, 1, 'B-123', 'Gold Medal');

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      expect(response.body.statistics.special.limited_edition_count).toBe(1);
      expect(response.body.statistics.special.natural_color_count).toBe(1);
      expect(response.body.statistics.special.single_barrel_count).toBe(1);
      expect(response.body.statistics.special.award_winning_count).toBe(1);
    });

    it('calculates tasting statistics', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, times_tasted, tasting_notes, nose_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('Tasted', 'bourbon', 'Distillery', user.id, 5, 'Great whiskey', 'Vanilla, caramel');

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      expect(response.body.statistics.tasting.total_tasting_sessions).toBe(5);
      expect(response.body.statistics.tasting.bottles_with_notes).toBe(1);
      expect(response.body.statistics.tasting.bottles_with_nose_notes).toBe(1);
    });

    it('calculates sharing statistics', async () => {
      const { agent, user } = await createAuthenticatedAgent(app);

      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, is_for_sale, is_for_trade, shared_with)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('For Sale', 'bourbon', 'Distillery', user.id, 1, 0, null);

      testDb.prepare(`
        INSERT INTO whiskeys (name, type, distillery, created_by, is_for_sale, is_for_trade, shared_with)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('For Trade', 'bourbon', 'Distillery', user.id, 0, 1, 'Friends');

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      expect(response.body.statistics.sharing.for_sale_count).toBe(1);
      expect(response.body.statistics.sharing.for_trade_count).toBe(1);
      expect(response.body.statistics.sharing.shared_bottles_count).toBe(1);
    });

    it('only returns statistics for authenticated user\'s whiskeys', async () => {
      const { agent, user } = await createAuthenticatedAgent(app, 'user1', 'user1@test.com');
      const user2 = await createTestUser('user2', 'user2@test.com', 'Wh1sk3yTest!!');

      // Create whiskeys for both users
      createTestWhiskey(user.id, { name: 'User1 Whiskey' });
      createTestWhiskey(user2.id, { name: 'User2 Whiskey' });
      createTestWhiskey(user2.id, { name: 'User2 Whiskey 2' });

      const response = await agent.get('/api/statistics');

      expect(response.status).toBe(200);
      expect(response.body.statistics.financial.total_bottles).toBe(1);
    });
  });
});
