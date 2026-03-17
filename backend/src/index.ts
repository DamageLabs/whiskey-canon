import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config, validateConfig } from './utils/config';
import { db, initializeDatabase } from './utils/database';
import { logger, httpLogger as pinoHttpMiddleware } from './utils/logger';
import { attachUser } from './middleware/auth';
import { csrfProtection } from './middleware/csrf';
import authRoutes from './routes/auth';
import whiskeyRoutes from './routes/whiskeys';
import adminRoutes from './routes/admin';
import statisticsRoutes from './routes/statistics';
import commentRoutes from './routes/comments';
import usersRoutes from './routes/users';
import contactRoutes from './routes/contact';
import backupRoutes from './routes/backups';
import lookupRoutes from './routes/lookup';
import { startBackupScheduler } from './utils/backup-scheduler';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SqliteStore = require('better-sqlite3-session-store')(session);

const app = express();

// Trust proxy (required for secure cookies behind Nginx)
app.set('trust proxy', 1);

// Validate and log configuration
validateConfig();

// Initialize database
initializeDatabase();

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    strictTransportSecurity: config.isProduction,
  })
);

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

app.use(pinoHttpMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(
  session({
    store: new SqliteStore({
      client: db,
      expired: {
        clear: true,
        intervalMs: 900000, // 15 min cleanup
      },
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.isProduction,
      httpOnly: true,
      sameSite: config.isProduction ? 'strict' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// Attach user to request
app.use(attachUser);

// CSRF protection
app.use(csrfProtection);

// Serve static files from uploads directory
const uploadsPath = path.join(__dirname, '../uploads');
logger.info({ uploadsPath }, 'Serving static files');
app.use('/uploads', express.static(uploadsPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/whiskeys', lookupRoutes);
app.use('/api/whiskeys', whiskeyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/backups', backupRoutes);

// Health check
app.get('/api/health', (req, res) => {
  let dbStatus = 'ok';
  try {
    db.prepare('SELECT 1').get();
  } catch {
    dbStatus = 'error';
  }

  const status = dbStatus === 'ok' ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({
    status,
    service: 'whiskey-canon',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      database: dbStatus,
    },
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.status === 403 && err.code === 'EBADCSRFTOKEN') {
    req.log.warn('Invalid CSRF token');
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  req.log.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error', requestId: req.id });
});

app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'Server started');

  // Start backup scheduler
  startBackupScheduler();
});
