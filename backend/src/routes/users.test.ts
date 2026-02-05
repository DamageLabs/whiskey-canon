import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import session from 'express-session';
import usersRoutes from './users';
import { UserModel } from '../models/User';
import { WhiskeyModel } from '../models/Whiskey';
import { Role } from '../types';
import { attachUser } from '../middleware/auth';

// Mock the User model
vi.mock('../models/User', () => ({
  UserModel: {
    getPublicProfile: vi.fn(),
    findPublicProfiles: vi.fn(),
    findById: vi.fn(),
  },
}));

// Mock the Whiskey model
vi.mock('../models/Whiskey', () => ({
  WhiskeyModel: {
    getPublicStats: vi.fn(),
  },
}));

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use(attachUser);
  app.use('/api/users', usersRoutes);
  return app;
};

describe('Users Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/users/:username', () => {
    it('returns 404 for non-existent user', async () => {
      vi.mocked(UserModel.getPublicProfile).mockReturnValue(undefined);

      const response = await request(app).get('/api/users/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Profile not found');
    });

    it('returns 404 for private profile when not authenticated', async () => {
      vi.mocked(UserModel.getPublicProfile).mockReturnValue({
        id: 1,
        username: 'testuser',
        role: Role.EDITOR,
        is_profile_public: 0,
        created_at: '2024-01-01',
      });

      const response = await request(app).get('/api/users/testuser');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Profile not found');
    });

    it('returns public profile for unauthenticated user', async () => {
      vi.mocked(UserModel.getPublicProfile).mockReturnValue({
        id: 1,
        username: 'testuser',
        role: Role.EDITOR,
        first_name: 'Test',
        last_name: 'User',
        is_profile_public: 1,
        created_at: '2024-01-01',
      });

      const response = await request(app).get('/api/users/testuser');

      expect(response.status).toBe(200);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.username).toBe('testuser');
      expect(response.body.profile.is_profile_public).toBe(1);
    });

    it('returns profile for owner regardless of visibility', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        role: Role.EDITOR,
        email_verified: 1,
        verification_code_attempts: 0,
        is_profile_public: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      vi.mocked(UserModel.findById).mockReturnValue(mockUser);
      vi.mocked(UserModel.getPublicProfile).mockReturnValue({
        id: 1,
        username: 'testuser',
        role: Role.EDITOR,
        is_profile_public: 0,
        created_at: '2024-01-01',
      });

      // Create app with session
      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        session({
          secret: 'test-secret',
          resave: false,
          saveUninitialized: true,
        })
      );

      // Set up session middleware to simulate logged in user
      testApp.use((req, res, next) => {
        req.session.userId = 1;
        next();
      });
      testApp.use(attachUser);
      testApp.use('/api/users', usersRoutes);

      const response = await request(testApp).get('/api/users/testuser');

      expect(response.status).toBe(200);
      expect(response.body.profile).toBeDefined();
    });

    it('returns profile for admin regardless of visibility', async () => {
      const mockAdmin = {
        id: 2,
        username: 'admin',
        email: 'admin@example.com',
        password: 'hashed',
        role: Role.ADMIN,
        email_verified: 1,
        verification_code_attempts: 0,
        is_profile_public: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      vi.mocked(UserModel.findById).mockReturnValue(mockAdmin);
      vi.mocked(UserModel.getPublicProfile).mockReturnValue({
        id: 1,
        username: 'testuser',
        role: Role.EDITOR,
        is_profile_public: 0,
        created_at: '2024-01-01',
      });

      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        session({
          secret: 'test-secret',
          resave: false,
          saveUninitialized: true,
        })
      );
      testApp.use((req, res, next) => {
        req.session.userId = 2;
        next();
      });
      testApp.use(attachUser);
      testApp.use('/api/users', usersRoutes);

      const response = await request(testApp).get('/api/users/testuser');

      expect(response.status).toBe(200);
      expect(response.body.profile).toBeDefined();
    });
  });

  describe('GET /api/users', () => {
    it('returns list of public profiles', async () => {
      vi.mocked(UserModel.findPublicProfiles).mockReturnValue([
        {
          id: 1,
          username: 'user1',
          role: Role.EDITOR,
          is_profile_public: 1,
          created_at: '2024-01-01',
        },
        {
          id: 2,
          username: 'user2',
          role: Role.EDITOR,
          is_profile_public: 1,
          created_at: '2024-01-02',
        },
      ]);

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body.profiles).toBeDefined();
      expect(response.body.profiles).toHaveLength(2);
    });

    it('returns empty list when no public profiles exist', async () => {
      vi.mocked(UserModel.findPublicProfiles).mockReturnValue([]);

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body.profiles).toEqual([]);
    });
  });

  describe('GET /api/users/:username/stats', () => {
    const mockStats = {
      totalBottles: 10,
      typeBreakdown: [
        { type: 'bourbon', count: 5 },
        { type: 'scotch', count: 5 },
      ],
      topDistilleries: [
        { distillery: 'Buffalo Trace', count: 3 },
        { distillery: 'Macallan', count: 2 },
      ],
      totalDistilleries: 5,
      averageRating: 8.5,
      countriesRepresented: ['USA', 'Scotland'],
    };

    it('returns 404 for non-existent user', async () => {
      vi.mocked(UserModel.getPublicProfile).mockReturnValue(undefined);

      const response = await request(app).get('/api/users/nonexistent/stats');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Profile not found');
    });

    it('returns 404 for private profile when not authenticated', async () => {
      vi.mocked(UserModel.getPublicProfile).mockReturnValue({
        id: 1,
        username: 'testuser',
        role: Role.EDITOR,
        is_profile_public: 0,
        created_at: '2024-01-01',
      });

      const response = await request(app).get('/api/users/testuser/stats');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Profile not found');
    });

    it('returns stats for public profile', async () => {
      vi.mocked(UserModel.getPublicProfile).mockReturnValue({
        id: 1,
        username: 'testuser',
        role: Role.EDITOR,
        is_profile_public: 1,
        created_at: '2024-01-01',
      });
      vi.mocked(WhiskeyModel.getPublicStats).mockReturnValue(mockStats);

      const response = await request(app).get('/api/users/testuser/stats');

      expect(response.status).toBe(200);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalBottles).toBe(10);
      expect(response.body.stats.typeBreakdown).toHaveLength(2);
      expect(response.body.stats.topDistilleries).toHaveLength(2);
      expect(response.body.stats.totalDistilleries).toBe(5);
      expect(response.body.stats.averageRating).toBe(8.5);
      expect(response.body.stats.countriesRepresented).toEqual(['USA', 'Scotland']);
    });

    it('returns stats for owner regardless of visibility', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        role: Role.EDITOR,
        email_verified: 1,
        verification_code_attempts: 0,
        is_profile_public: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      vi.mocked(UserModel.findById).mockReturnValue(mockUser);
      vi.mocked(UserModel.getPublicProfile).mockReturnValue({
        id: 1,
        username: 'testuser',
        role: Role.EDITOR,
        is_profile_public: 0,
        created_at: '2024-01-01',
      });
      vi.mocked(WhiskeyModel.getPublicStats).mockReturnValue(mockStats);

      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        session({
          secret: 'test-secret',
          resave: false,
          saveUninitialized: true,
        })
      );
      testApp.use((req, res, next) => {
        req.session.userId = 1;
        next();
      });
      testApp.use(attachUser);
      testApp.use('/api/users', usersRoutes);

      const response = await request(testApp).get('/api/users/testuser/stats');

      expect(response.status).toBe(200);
      expect(response.body.stats).toBeDefined();
      expect(WhiskeyModel.getPublicStats).toHaveBeenCalledWith(1);
    });

    it('returns stats for admin regardless of visibility', async () => {
      const mockAdmin = {
        id: 2,
        username: 'admin',
        email: 'admin@example.com',
        password: 'hashed',
        role: Role.ADMIN,
        email_verified: 1,
        verification_code_attempts: 0,
        is_profile_public: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      vi.mocked(UserModel.findById).mockReturnValue(mockAdmin);
      vi.mocked(UserModel.getPublicProfile).mockReturnValue({
        id: 1,
        username: 'testuser',
        role: Role.EDITOR,
        is_profile_public: 0,
        created_at: '2024-01-01',
      });
      vi.mocked(WhiskeyModel.getPublicStats).mockReturnValue(mockStats);

      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        session({
          secret: 'test-secret',
          resave: false,
          saveUninitialized: true,
        })
      );
      testApp.use((req, res, next) => {
        req.session.userId = 2;
        next();
      });
      testApp.use(attachUser);
      testApp.use('/api/users', usersRoutes);

      const response = await request(testApp).get('/api/users/testuser/stats');

      expect(response.status).toBe(200);
      expect(response.body.stats).toBeDefined();
      expect(WhiskeyModel.getPublicStats).toHaveBeenCalledWith(1);
    });

    it('returns stats with empty collection', async () => {
      const emptyStats = {
        totalBottles: 0,
        typeBreakdown: [],
        topDistilleries: [],
        totalDistilleries: 0,
        averageRating: null,
        countriesRepresented: [],
      };

      vi.mocked(UserModel.getPublicProfile).mockReturnValue({
        id: 1,
        username: 'newuser',
        role: Role.EDITOR,
        is_profile_public: 1,
        created_at: '2024-01-01',
      });
      vi.mocked(WhiskeyModel.getPublicStats).mockReturnValue(emptyStats);

      const response = await request(app).get('/api/users/newuser/stats');

      expect(response.status).toBe(200);
      expect(response.body.stats.totalBottles).toBe(0);
      expect(response.body.stats.typeBreakdown).toEqual([]);
      expect(response.body.stats.averageRating).toBeNull();
    });

    it('calls getPublicStats with correct user id', async () => {
      vi.mocked(UserModel.getPublicProfile).mockReturnValue({
        id: 42,
        username: 'testuser',
        role: Role.EDITOR,
        is_profile_public: 1,
        created_at: '2024-01-01',
      });
      vi.mocked(WhiskeyModel.getPublicStats).mockReturnValue(mockStats);

      await request(app).get('/api/users/testuser/stats');

      expect(WhiskeyModel.getPublicStats).toHaveBeenCalledWith(42);
    });
  });

  describe('Editor role authorization', () => {
    const createAppWithUser = (userId: number, userRole: Role) => {
      const mockUser = {
        id: userId,
        username: `user${userId}`,
        email: `user${userId}@example.com`,
        password: 'hashed',
        role: userRole,
        email_verified: 1,
        verification_code_attempts: 0,
        is_profile_public: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      vi.mocked(UserModel.findById).mockReturnValue(mockUser);

      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        session({
          secret: 'test-secret',
          resave: false,
          saveUninitialized: true,
        })
      );
      testApp.use((req, res, next) => {
        req.session.userId = userId;
        next();
      });
      testApp.use(attachUser);
      testApp.use('/api/users', usersRoutes);
      return testApp;
    };

    describe('GET /api/users/:username - Editor access', () => {
      it('returns 404 when editor tries to access another users private profile', async () => {
        const editorApp = createAppWithUser(2, Role.EDITOR);

        vi.mocked(UserModel.getPublicProfile).mockReturnValue({
          id: 1,
          username: 'privateuser',
          role: Role.EDITOR,
          is_profile_public: 0,
          created_at: '2024-01-01',
        });

        const response = await request(editorApp).get('/api/users/privateuser');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Profile not found');
      });

      it('returns profile when editor accesses another users public profile', async () => {
        const editorApp = createAppWithUser(2, Role.EDITOR);

        vi.mocked(UserModel.getPublicProfile).mockReturnValue({
          id: 1,
          username: 'publicuser',
          role: Role.EDITOR,
          is_profile_public: 1,
          created_at: '2024-01-01',
        });

        const response = await request(editorApp).get('/api/users/publicuser');

        expect(response.status).toBe(200);
        expect(response.body.profile).toBeDefined();
      });

      it('returns 404 when viewer tries to access private profile', async () => {
        const viewerApp = createAppWithUser(3, Role.VIEWER);

        vi.mocked(UserModel.getPublicProfile).mockReturnValue({
          id: 1,
          username: 'privateuser',
          role: Role.EDITOR,
          is_profile_public: 0,
          created_at: '2024-01-01',
        });

        const response = await request(viewerApp).get('/api/users/privateuser');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Profile not found');
      });
    });

    describe('GET /api/users/:username/stats - Editor access', () => {
      const mockStats = {
        totalBottles: 5,
        typeBreakdown: [{ type: 'bourbon', count: 5 }],
        topDistilleries: [{ distillery: 'Test', count: 5 }],
        totalDistilleries: 1,
        averageRating: 8.0,
        countriesRepresented: ['USA'],
      };

      it('returns 404 when editor tries to access another users private stats', async () => {
        const editorApp = createAppWithUser(2, Role.EDITOR);

        vi.mocked(UserModel.getPublicProfile).mockReturnValue({
          id: 1,
          username: 'privateuser',
          role: Role.EDITOR,
          is_profile_public: 0,
          created_at: '2024-01-01',
        });

        const response = await request(editorApp).get('/api/users/privateuser/stats');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Profile not found');
        expect(WhiskeyModel.getPublicStats).not.toHaveBeenCalled();
      });

      it('returns stats when editor accesses another users public stats', async () => {
        const editorApp = createAppWithUser(2, Role.EDITOR);

        vi.mocked(UserModel.getPublicProfile).mockReturnValue({
          id: 1,
          username: 'publicuser',
          role: Role.EDITOR,
          is_profile_public: 1,
          created_at: '2024-01-01',
        });
        vi.mocked(WhiskeyModel.getPublicStats).mockReturnValue(mockStats);

        const response = await request(editorApp).get('/api/users/publicuser/stats');

        expect(response.status).toBe(200);
        expect(response.body.stats).toBeDefined();
        expect(WhiskeyModel.getPublicStats).toHaveBeenCalledWith(1);
      });

      it('returns 404 when viewer tries to access private stats', async () => {
        const viewerApp = createAppWithUser(3, Role.VIEWER);

        vi.mocked(UserModel.getPublicProfile).mockReturnValue({
          id: 1,
          username: 'privateuser',
          role: Role.EDITOR,
          is_profile_public: 0,
          created_at: '2024-01-01',
        });

        const response = await request(viewerApp).get('/api/users/privateuser/stats');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Profile not found');
      });

      it('allows editor to access their own private stats', async () => {
        const editorApp = createAppWithUser(1, Role.EDITOR);

        vi.mocked(UserModel.getPublicProfile).mockReturnValue({
          id: 1,
          username: 'user1',
          role: Role.EDITOR,
          is_profile_public: 0,
          created_at: '2024-01-01',
        });
        vi.mocked(WhiskeyModel.getPublicStats).mockReturnValue(mockStats);

        const response = await request(editorApp).get('/api/users/user1/stats');

        expect(response.status).toBe(200);
        expect(response.body.stats).toBeDefined();
      });
    });
  });
});
