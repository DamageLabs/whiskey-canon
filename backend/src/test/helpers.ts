import express from 'express';
import session from 'express-session';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { testDb } from './setup';
import { attachUser } from '../middleware/auth';
import authRoutes from '../routes/auth';
import whiskeyRoutes from '../routes/whiskeys';
import adminRoutes from '../routes/admin';
import statisticsRoutes from '../routes/statistics';
import { Role, WhiskeyType } from '../types';

/**
 * Creates a test Express app with session and auth routes configured
 */
export function createTestApp(): express.Application {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true
      }
    })
  );

  app.use(attachUser);
  app.use('/api/auth', authRoutes);
  app.use('/api/whiskeys', whiskeyRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/statistics', statisticsRoutes);

  // Error handler for debugging test failures
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Test app error:', err.message);
    res.status(500).json({ error: err.message });
  });

  return app;
}

/**
 * Creates a test user directly in the database with hashed password
 */
export async function createTestUser(
  username: string = 'testuser',
  email: string = 'test@example.com',
  password: string = 'password123',
  role: Role = Role.EDITOR,
  firstName?: string,
  lastName?: string
): Promise<{ id: number; username: string; email: string; role: Role }> {
  const hashedPassword = await bcrypt.hash(password, 10);

  const stmt = testDb.prepare(`
    INSERT INTO users (username, email, password, role, first_name, last_name, email_verified)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  const result = stmt.run(username, email, hashedPassword, role, firstName || null, lastName || null);

  return {
    id: result.lastInsertRowid as number,
    username,
    email,
    role
  };
}

/**
 * Logs in a user and returns the session cookie
 */
export async function loginUser(
  app: express.Application,
  username: string,
  password: string
): Promise<string[]> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username, password });

  const cookies = response.headers['set-cookie'];
  return Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
}

/**
 * Creates a supertest agent with an authenticated session
 */
export async function createAuthenticatedAgent(
  app: express.Application,
  username: string = 'testuser',
  email: string = 'test@example.com',
  password: string = 'password123',
  role: Role = Role.EDITOR
): Promise<{ agent: request.Agent; user: { id: number; username: string; email: string; role: Role } }> {
  const user = await createTestUser(username, email, password, role);

  const agent = request.agent(app);
  await agent
    .post('/api/auth/login')
    .send({ username, password });

  return { agent, user };
}

/**
 * Creates a test whiskey directly in the database
 */
export function createTestWhiskey(
  userId: number,
  overrides: {
    name?: string;
    type?: WhiskeyType;
    distillery?: string;
    region?: string;
    age?: number;
    abv?: number;
    rating?: number;
    description?: string;
  } = {}
): { id: number; name: string; type: WhiskeyType; distillery: string; created_by: number } {
  const data = {
    name: overrides.name || 'Test Whiskey',
    type: overrides.type || WhiskeyType.BOURBON,
    distillery: overrides.distillery || 'Test Distillery',
    region: overrides.region || null,
    age: overrides.age || null,
    abv: overrides.abv || null,
    rating: overrides.rating || null,
    description: overrides.description || null
  };

  const stmt = testDb.prepare(`
    INSERT INTO whiskeys (name, type, distillery, region, age, abv, rating, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.name,
    data.type,
    data.distillery,
    data.region,
    data.age,
    data.abv,
    data.rating,
    data.description,
    userId
  );

  return {
    id: result.lastInsertRowid as number,
    name: data.name,
    type: data.type as WhiskeyType,
    distillery: data.distillery,
    created_by: userId
  };
}
