import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../whiskey.db');

export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  // Create users table
  db.exec(`
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
  db.exec(`
    CREATE TABLE IF NOT EXISTS whiskeys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('bourbon', 'scotch', 'irish', 'japanese', 'rye', 'tennessee', 'canadian', 'other')),
      distillery TEXT NOT NULL,
      region TEXT,
      age INTEGER,
      abv REAL,
      size TEXT,
      description TEXT,
      tasting_notes TEXT,
      rating REAL CHECK(rating >= 0 AND rating <= 10),
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Add new columns to users table if they don't exist (for existing databases)
  try {
    const userTableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
    const userColumnNames = userTableInfo.map(col => col.name);

    if (!userColumnNames.includes('first_name')) {
      db.exec('ALTER TABLE users ADD COLUMN first_name TEXT');
      console.log('Added first_name column to users table');
    }

    if (!userColumnNames.includes('last_name')) {
      db.exec('ALTER TABLE users ADD COLUMN last_name TEXT');
      console.log('Added last_name column to users table');
    }

    if (!userColumnNames.includes('profile_photo')) {
      db.exec('ALTER TABLE users ADD COLUMN profile_photo TEXT');
      console.log('Added profile_photo column to users table');
    }
  } catch (error) {
    // Table doesn't exist yet, will be created above
  }

  // Add new columns to whiskeys table if they don't exist (for existing databases)
  try {
    const tableInfo = db.prepare("PRAGMA table_info(whiskeys)").all() as Array<{ name: string }>;
    const columnNames = tableInfo.map(col => col.name);

    if (!columnNames.includes('size')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN size TEXT');
      console.log('Added size column to whiskeys table');
    }

    if (!columnNames.includes('quantity')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN quantity INTEGER');
      console.log('Added quantity column to whiskeys table');
    }

    if (!columnNames.includes('msrp')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN msrp REAL');
      console.log('Added msrp column to whiskeys table');
    }

    if (!columnNames.includes('secondary_price')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN secondary_price REAL');
      console.log('Added secondary_price column to whiskeys table');
    }

    // Purchase & Acquisition Tracking
    if (!columnNames.includes('purchase_date')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN purchase_date TEXT');
      console.log('Added purchase_date column to whiskeys table');
    }
    if (!columnNames.includes('purchase_price')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN purchase_price REAL');
      console.log('Added purchase_price column to whiskeys table');
    }
    if (!columnNames.includes('purchase_location')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN purchase_location TEXT');
      console.log('Added purchase_location column to whiskeys table');
    }
    if (!columnNames.includes('bottle_code')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN bottle_code TEXT');
      console.log('Added bottle_code column to whiskeys table');
    }

    // Inventory Management
    if (!columnNames.includes('is_opened')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN is_opened INTEGER DEFAULT 0');
      console.log('Added is_opened column to whiskeys table');
    }
    if (!columnNames.includes('date_opened')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN date_opened TEXT');
      console.log('Added date_opened column to whiskeys table');
    }
    if (!columnNames.includes('remaining_volume')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN remaining_volume REAL');
      console.log('Added remaining_volume column to whiskeys table');
    }
    if (!columnNames.includes('storage_location')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN storage_location TEXT');
      console.log('Added storage_location column to whiskeys table');
    }
    if (!columnNames.includes('status')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN status TEXT DEFAULT \'in_collection\'');
      console.log('Added status column to whiskeys table');
    }

    // Cask & Production Details
    if (!columnNames.includes('cask_type')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN cask_type TEXT');
      console.log('Added cask_type column to whiskeys table');
    }
    if (!columnNames.includes('cask_finish')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN cask_finish TEXT');
      console.log('Added cask_finish column to whiskeys table');
    }
    if (!columnNames.includes('barrel_number')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN barrel_number TEXT');
      console.log('Added barrel_number column to whiskeys table');
    }
    if (!columnNames.includes('bottle_number')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN bottle_number TEXT');
      console.log('Added bottle_number column to whiskeys table');
    }
    if (!columnNames.includes('vintage_year')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN vintage_year TEXT');
      console.log('Added vintage_year column to whiskeys table');
    }
    if (!columnNames.includes('bottled_date')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN bottled_date TEXT');
      console.log('Added bottled_date column to whiskeys table');
    }

    // Enhanced Tasting Experience
    if (!columnNames.includes('color')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN color TEXT');
      console.log('Added color column to whiskeys table');
    }
    if (!columnNames.includes('nose_notes')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN nose_notes TEXT');
      console.log('Added nose_notes column to whiskeys table');
    }
    if (!columnNames.includes('palate_notes')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN palate_notes TEXT');
      console.log('Added palate_notes column to whiskeys table');
    }
    if (!columnNames.includes('finish_notes')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN finish_notes TEXT');
      console.log('Added finish_notes column to whiskeys table');
    }
    if (!columnNames.includes('times_tasted')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN times_tasted INTEGER DEFAULT 0');
      console.log('Added times_tasted column to whiskeys table');
    }
    if (!columnNames.includes('last_tasted_date')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN last_tasted_date TEXT');
      console.log('Added last_tasted_date column to whiskeys table');
    }
    if (!columnNames.includes('food_pairings')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN food_pairings TEXT');
      console.log('Added food_pairings column to whiskeys table');
    }

    // Investment & Value Tracking
    if (!columnNames.includes('current_market_value')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN current_market_value REAL');
      console.log('Added current_market_value column to whiskeys table');
    }
    if (!columnNames.includes('value_gain_loss')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN value_gain_loss REAL');
      console.log('Added value_gain_loss column to whiskeys table');
    }
    if (!columnNames.includes('is_investment_bottle')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN is_investment_bottle INTEGER DEFAULT 0');
      console.log('Added is_investment_bottle column to whiskeys table');
    }

    // Additional Metadata
    if (!columnNames.includes('country')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN country TEXT');
      console.log('Added country column to whiskeys table');
    }
    if (!columnNames.includes('mash_bill')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN mash_bill TEXT');
      console.log('Added mash_bill column to whiskeys table');
    }
    if (!columnNames.includes('proof')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN proof REAL');
      console.log('Added proof column to whiskeys table');
    }
    if (!columnNames.includes('limited_edition')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN limited_edition INTEGER DEFAULT 0');
      console.log('Added limited_edition column to whiskeys table');
    }
    if (!columnNames.includes('awards')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN awards TEXT');
      console.log('Added awards column to whiskeys table');
    }
    if (!columnNames.includes('chill_filtered')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN chill_filtered INTEGER');
      console.log('Added chill_filtered column to whiskeys table');
    }
    if (!columnNames.includes('natural_color')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN natural_color INTEGER');
      console.log('Added natural_color column to whiskeys table');
    }

    // Visual & Documentation
    if (!columnNames.includes('image_url')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN image_url TEXT');
      console.log('Added image_url column to whiskeys table');
    }
    if (!columnNames.includes('label_image_url')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN label_image_url TEXT');
      console.log('Added label_image_url column to whiskeys table');
    }
    if (!columnNames.includes('receipt_image_url')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN receipt_image_url TEXT');
      console.log('Added receipt_image_url column to whiskeys table');
    }

    // Social & Sharing
    if (!columnNames.includes('is_for_sale')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN is_for_sale INTEGER DEFAULT 0');
      console.log('Added is_for_sale column to whiskeys table');
    }
    if (!columnNames.includes('asking_price')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN asking_price REAL');
      console.log('Added asking_price column to whiskeys table');
    }
    if (!columnNames.includes('is_for_trade')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN is_for_trade INTEGER DEFAULT 0');
      console.log('Added is_for_trade column to whiskeys table');
    }
    if (!columnNames.includes('shared_with')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN shared_with TEXT');
      console.log('Added shared_with column to whiskeys table');
    }
    if (!columnNames.includes('private_notes')) {
      db.exec('ALTER TABLE whiskeys ADD COLUMN private_notes TEXT');
      console.log('Added private_notes column to whiskeys table');
    }
  } catch (error) {
    // Table doesn't exist yet, will be created above
  }

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_whiskeys_type ON whiskeys(type);
    CREATE INDEX IF NOT EXISTS idx_whiskeys_distillery ON whiskeys(distillery);
    CREATE INDEX IF NOT EXISTS idx_whiskeys_created_by ON whiskeys(created_by);
  `);

  console.log('Database initialized successfully');
}

export function closeDatabase() {
  db.close();
}
