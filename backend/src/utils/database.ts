import Database, { Database as DatabaseType } from 'better-sqlite3';
import { config } from './config';
import { runMigrations } from './migration-runner';
import { allMigrations } from '../migrations';

const dbPath = config.databasePath;

export const db: DatabaseType = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  runMigrations(db, allMigrations);
  console.log('Database initialized successfully');
}

export function closeDatabase() {
  db.close();
}
