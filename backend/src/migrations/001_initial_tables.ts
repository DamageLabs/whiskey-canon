import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '001_initial_tables',
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'viewer')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS whiskeys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('bourbon', 'scotch', 'irish', 'japanese', 'rye', 'tennessee', 'canadian', 'other')),
        distillery TEXT NOT NULL,
        region TEXT,
        age INTEGER,
        abv REAL,
        description TEXT,
        tasting_notes TEXT,
        rating REAL CHECK(rating >= 0 AND rating <= 10),
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS whiskey_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        whiskey_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (whiskey_id) REFERENCES whiskeys(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  },
  down(db) {
    db.exec('DROP TABLE IF EXISTS whiskey_comments');
    db.exec('DROP TABLE IF EXISTS whiskeys');
    db.exec('DROP TABLE IF EXISTS users');
  },
};
