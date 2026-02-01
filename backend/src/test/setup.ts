import Database from 'better-sqlite3';
import { beforeEach, afterAll } from 'vitest';

// Create in-memory database for testing
export const testDb = new Database(':memory:');

// Enable foreign keys
testDb.pragma('foreign_keys = ON');

// Initialize schema
function initializeTestSchema() {
  // Create users table
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'viewer')),
      first_name TEXT,
      last_name TEXT,
      profile_photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create whiskeys table
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS whiskeys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('bourbon', 'scotch', 'irish', 'japanese', 'rye', 'tennessee', 'canadian', 'other')),
      distillery TEXT NOT NULL,
      region TEXT,
      age INTEGER,
      abv REAL,
      size TEXT,
      quantity INTEGER,
      msrp REAL,
      secondary_price REAL,
      description TEXT,
      tasting_notes TEXT,
      rating REAL CHECK(rating >= 0 AND rating <= 10),
      purchase_date TEXT,
      purchase_price REAL,
      purchase_location TEXT,
      bottle_code TEXT,
      is_opened INTEGER DEFAULT 0,
      date_opened TEXT,
      remaining_volume REAL,
      storage_location TEXT,
      status TEXT DEFAULT 'in_collection',
      cask_type TEXT,
      cask_finish TEXT,
      barrel_number TEXT,
      bottle_number TEXT,
      vintage_year TEXT,
      bottled_date TEXT,
      color TEXT,
      nose_notes TEXT,
      palate_notes TEXT,
      finish_notes TEXT,
      times_tasted INTEGER DEFAULT 0,
      last_tasted_date TEXT,
      food_pairings TEXT,
      current_market_value REAL,
      value_gain_loss REAL,
      is_investment_bottle INTEGER DEFAULT 0,
      country TEXT,
      mash_bill TEXT,
      proof REAL,
      limited_edition INTEGER DEFAULT 0,
      awards TEXT,
      chill_filtered INTEGER,
      natural_color INTEGER,
      image_url TEXT,
      label_image_url TEXT,
      receipt_image_url TEXT,
      is_for_sale INTEGER DEFAULT 0,
      asking_price REAL,
      is_for_trade INTEGER DEFAULT 0,
      shared_with TEXT,
      private_notes TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

// Initialize schema once
initializeTestSchema();

// Clear tables before each test
beforeEach(() => {
  testDb.exec('DELETE FROM whiskeys');
  testDb.exec('DELETE FROM users');
  // Reset auto-increment counters
  testDb.exec("DELETE FROM sqlite_sequence WHERE name='users' OR name='whiskeys'");
});

// Close database after all tests
afterAll(() => {
  testDb.close();
});

// Mock the database module to use test database
import { vi } from 'vitest';

vi.mock('../utils/database', async () => {
  return {
    db: testDb,
    initializeDatabase: vi.fn(),
    closeDatabase: vi.fn()
  };
});
