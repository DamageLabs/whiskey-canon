import express, { Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import multer from 'multer';
import { validate } from '../middleware/validate';
import { UserModel } from '../models/User';
import { WhiskeyModel } from '../models/Whiskey';
import { Role } from '../types';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { Permission } from '../types';
import { db } from '../utils/database';
import { config } from '../utils/config';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// All admin routes require authentication
router.use(requireAuth);

// Get all users (admin only)
router.get(
  '/users',
  requirePermission(Permission.MANAGE_USERS),
  (req: AuthRequest, res: Response) => {
    try {
      const users = UserModel.findAll();
      // Remove password hashes from response
      const sanitizedUsers = users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json({ users: sanitizedUsers });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// Update user role (admin only)
router.put(
  '/users/:id/role',
  requirePermission(Permission.MANAGE_USERS),
  [
    param('id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
    body('role').isIn(Object.values(Role)).withMessage('Invalid role'),
  ],
  (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = parseInt(req.params.id);

      // Prevent admin from changing their own role
      if (userId === req.user!.id) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }

      const user = UserModel.updateRole(userId, req.body.role);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password, ...userWithoutPassword } = user;
      res.json({
        message: 'User role updated successfully',
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }
);

// Update user profile details (admin only)
router.put(
  '/users/:id',
  requirePermission(Permission.MANAGE_USERS),
  [
    param('id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters'),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const userId = parseInt(req.params.id);
      const { email, username, firstName, lastName } = req.body;

      // Check if email is already in use by another user
      if (email) {
        const existingUser = UserModel.findByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          res.status(400).json({ error: 'Email already in use' });
          return;
        }
      }

      // Check if username is already in use by another user
      if (username) {
        const existingUser = UserModel.findByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          res.status(400).json({ error: 'Username already in use' });
          return;
        }
      }

      const updates: { email?: string; firstName?: string; lastName?: string } = {};
      if (email !== undefined) updates.email = email;
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;

      const user = UserModel.updateProfile(userId, updates);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const { password, ...userWithoutPassword } = user;
      res.json({
        message: 'User profile updated successfully',
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  }
);

// Delete user (admin only)
router.delete(
  '/users/:id',
  requirePermission(Permission.MANAGE_USERS),
  param('id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  validate,
  (req: AuthRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);

      // Prevent admin from deleting themselves
      if (userId === req.user!.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const deleted = UserModel.delete(userId);

      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

// Get all whiskeys from all users (admin only)
router.get(
  '/whiskeys',
  requirePermission(Permission.MANAGE_USERS),
  (req: AuthRequest, res: Response) => {
    try {
      const whiskeys = WhiskeyModel.findAllWithOwners();
      res.json({ whiskeys });
    } catch (error) {
      console.error('Error fetching whiskeys:', error);
      res.status(500).json({ error: 'Failed to fetch whiskeys' });
    }
  }
);

// Create a full database backup (admin only)
router.post(
  '/backup',
  requirePermission(Permission.MANAGE_USERS),
  async (req: AuthRequest, res: Response) => {
    try {
      const backupDir = config.backupDir || path.join(__dirname, '../../backups');
      const adminDir = path.join(backupDir, 'admin');
      if (!fs.existsSync(adminDir)) {
        fs.mkdirSync(adminDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `full-backup-${timestamp}.db`;
      const filePath = path.join(adminDir, filename);

      // Use SQLite backup API (returns a promise)
      await db.backup(filePath);

      const sizeBytes = fs.statSync(filePath).size;

      res.status(201).json({
        message: 'Full database backup created successfully',
        backup: {
          filename,
          size_bytes: sizeBytes,
          created_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Admin backup error:', error);
      res.status(500).json({ error: 'Failed to create database backup' });
    }
  }
);

// List admin backups (admin only)
router.get(
  '/backups',
  requirePermission(Permission.MANAGE_USERS),
  (req: AuthRequest, res: Response) => {
    try {
      const backupDir = config.backupDir || path.join(__dirname, '../../backups');
      const adminDir = path.join(backupDir, 'admin');

      if (!fs.existsSync(adminDir)) {
        return res.json({ backups: [] });
      }

      const files = fs
        .readdirSync(adminDir)
        .filter((f) => f.startsWith('full-backup-') && f.endsWith('.db'))
        .map((filename) => {
          const filePath = path.join(adminDir, filename);
          const stats = fs.statSync(filePath);
          return {
            filename,
            size_bytes: stats.size,
            created_at: stats.mtime.toISOString(),
          };
        })
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

      res.json({ backups: files });
    } catch (error) {
      console.error('Admin backup list error:', error);
      res.status(500).json({ error: 'Failed to list backups' });
    }
  }
);

// Download an admin backup (admin only)
router.get(
  '/backups/:filename/download',
  requirePermission(Permission.MANAGE_USERS),
  (req: AuthRequest, res: Response) => {
    try {
      const { filename } = req.params;

      // Validate filename to prevent path traversal
      if (!/^full-backup-[\w-]+\.db$/.test(filename)) {
        return res.status(400).json({ error: 'Invalid backup filename' });
      }

      const backupDir = config.backupDir || path.join(__dirname, '../../backups');
      const filePath = path.join(backupDir, 'admin', filename);

      const resolved = path.resolve(filePath);
      const expectedDir = path.resolve(backupDir, 'admin');
      if (!resolved.startsWith(expectedDir)) {
        return res.status(400).json({ error: 'Invalid backup filename' });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Backup not found' });
      }

      res.setHeader('Content-Type', 'application/x-sqlite3');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(resolved);
    } catch (error) {
      console.error('Admin backup download error:', error);
      res.status(500).json({ error: 'Failed to download backup' });
    }
  }
);

// Delete an admin backup (admin only)
router.delete(
  '/backups/:filename',
  requirePermission(Permission.MANAGE_USERS),
  (req: AuthRequest, res: Response) => {
    try {
      const { filename } = req.params;

      if (!/^full-backup-[\w-]+\.db$/.test(filename)) {
        return res.status(400).json({ error: 'Invalid backup filename' });
      }

      const backupDir = config.backupDir || path.join(__dirname, '../../backups');
      const filePath = path.join(backupDir, 'admin', filename);

      const resolved = path.resolve(filePath);
      const expectedDir = path.resolve(backupDir, 'admin');
      if (!resolved.startsWith(expectedDir)) {
        return res.status(400).json({ error: 'Invalid backup filename' });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Backup not found' });
      }

      fs.unlinkSync(filePath);
      res.json({ message: 'Backup deleted successfully' });
    } catch (error) {
      console.error('Admin backup delete error:', error);
      res.status(500).json({ error: 'Failed to delete backup' });
    }
  }
);

// Restore database from an admin backup (admin only)
router.post(
  '/backups/:filename/restore',
  requirePermission(Permission.MANAGE_USERS),
  (req: AuthRequest, res: Response) => {
    try {
      const { filename } = req.params;

      if (!/^full-backup-[\w-]+\.db$/.test(filename)) {
        return res.status(400).json({ error: 'Invalid backup filename' });
      }

      const backupDir = config.backupDir || path.join(__dirname, '../../backups');
      const filePath = path.join(backupDir, 'admin', filename);

      const resolved = path.resolve(filePath);
      const expectedDir = path.resolve(backupDir, 'admin');
      if (!resolved.startsWith(expectedDir)) {
        return res.status(400).json({ error: 'Invalid backup filename' });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Backup not found' });
      }

      // Validate the backup is a readable SQLite database
      try {
        const testDb = new Database(filePath, { readonly: true });
        testDb.close();
      } catch {
        return res.status(400).json({ error: 'Backup file is not a valid SQLite database' });
      }

      // Attach the backup and copy data into the live database
      db.exec(`ATTACH DATABASE '${resolved.replace(/'/g, "''")}' AS backup_db`);

      try {
        // Get list of tables from the backup (exclude sqlite internals)
        const backupTables = db
          .prepare(
            `SELECT name FROM backup_db.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
          )
          .all() as Array<{ name: string }>;

        const mainTables = db
          .prepare(
            `SELECT name FROM main.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
          )
          .all() as Array<{ name: string }>;
        const mainTableNames = new Set(mainTables.map((t) => t.name));

        // Only restore tables that exist in both the backup and the live db
        const tablesToRestore = backupTables
          .map((t) => t.name)
          .filter((name) => mainTableNames.has(name));

        if (tablesToRestore.length === 0) {
          db.exec('DETACH DATABASE backup_db');
          return res.status(400).json({ error: 'Backup contains no matching tables' });
        }

        // Disable foreign keys during restore, then re-enable after
        db.pragma('foreign_keys = OFF');

        const restoreTransaction = db.transaction(() => {
          for (const table of tablesToRestore) {
            db.exec(`DELETE FROM main."${table}"`);
            db.exec(`INSERT INTO main."${table}" SELECT * FROM backup_db."${table}"`);
          }
        });

        restoreTransaction();
        db.pragma('foreign_keys = ON');

        db.exec('DETACH DATABASE backup_db');

        res.json({
          message: 'Database restored successfully',
          tablesRestored: tablesToRestore,
        });
      } catch (innerError) {
        // Ensure we detach even on failure
        try {
          db.exec('DETACH DATABASE backup_db');
        } catch {
          /* already detached */
        }
        db.pragma('foreign_keys = ON');
        throw innerError;
      }
    } catch (error) {
      console.error('Admin backup restore error:', error);
      res.status(500).json({ error: 'Failed to restore database from backup' });
    }
  }
);

// Import (upload) an existing backup file (admin only)
const backupUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.endsWith('.db')) {
      return cb(new Error('Only .db files are allowed'));
    }
    cb(null, true);
  },
});

router.post(
  '/backups/import',
  requirePermission(Permission.MANAGE_USERS),
  (req: AuthRequest, res: Response, next) => {
    backupUpload.single('backup')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      }
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Validate that the uploaded file is a valid SQLite database
      const magic = req.file.buffer.slice(0, 16).toString('ascii');
      if (!magic.startsWith('SQLite format 3')) {
        return res.status(400).json({ error: 'File is not a valid SQLite database' });
      }

      const backupDir = config.backupDir || path.join(__dirname, '../../backups');
      const adminDir = path.join(backupDir, 'admin');
      if (!fs.existsSync(adminDir)) {
        fs.mkdirSync(adminDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `full-backup-${timestamp}.db`;
      const filePath = path.join(adminDir, filename);

      fs.writeFileSync(filePath, req.file.buffer);

      // Verify the written file can be opened by SQLite
      try {
        const testDb = new Database(filePath, { readonly: true });
        testDb.close();
      } catch {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: 'File is not a valid SQLite database' });
      }

      const sizeBytes = fs.statSync(filePath).size;

      res.status(201).json({
        message: 'Backup imported successfully',
        backup: {
          filename,
          size_bytes: sizeBytes,
          created_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Admin backup import error:', error);
      res.status(500).json({ error: 'Failed to import backup' });
    }
  }
);

export default router;
