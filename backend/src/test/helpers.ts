import express from 'express';
import session from 'express-session';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { testDb } from './setup';
import { attachUser } from '../middleware/auth';
import authRoutes from '../routes/auth';
import { Role } from '../types';

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
    INSERT INTO users (username, email, password, role, first_name, last_name)
    VALUES (?, ?, ?, ?, ?, ?)
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
