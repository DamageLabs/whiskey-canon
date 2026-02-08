import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config, validateConfig } from './utils/config';
import { db, initializeDatabase } from './utils/database';
import { attachUser } from './middleware/auth';
import { csrfProtection } from './middleware/csrf';
import authRoutes from './routes/auth';
import whiskeyRoutes from './routes/whiskeys';
import adminRoutes from './routes/admin';
import statisticsRoutes from './routes/statistics';
import commentRoutes from './routes/comments';
import usersRoutes from './routes/users';
import contactRoutes from './routes/contact';

const SqliteStore = require('better-sqlite3-session-store')(session);

const app = express();

// Trust proxy (required for secure cookies behind Nginx)
app.set('trust proxy', 1);

// Validate and log configuration
validateConfig();

// Initialize database
initializeDatabase();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  strictTransportSecurity: config.isProduction,
}));

app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

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
        intervalMs: 900000 // 15 min cleanup
      }
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.isProduction,
      httpOnly: true,
      sameSite: config.isProduction ? 'strict' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
);

// Attach user to request
app.use(attachUser);

// CSRF protection
app.use(csrfProtection);

// Serve static files from uploads directory
const uploadsPath = path.join(__dirname, '../uploads');
console.log('Serving static files from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/whiskeys', whiskeyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/contact', contactRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.status === 403 && err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});
