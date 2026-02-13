/**
 * Shared schema definitions for Whiskey Canon database.
 *
 * This is the single source of truth for CREATE TABLE statements.
 * Used by both the production database initialization and the test setup.
 */

export const USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'viewer')),
    first_name TEXT,
    last_name TEXT,
    profile_photo TEXT,
    email_verified INTEGER DEFAULT 0,
    verification_code TEXT,
    verification_code_expires_at TEXT,
    verification_code_attempts INTEGER DEFAULT 0,
    password_reset_token TEXT,
    password_reset_expires_at TEXT,
    is_profile_public INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

export const WHISKEYS_TABLE = `
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
    obtained_from TEXT,
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
`;

export const WHISKEY_COMMENTS_TABLE = `
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
`;

export const BACKUP_SCHEDULES_TABLE = `
  CREATE TABLE IF NOT EXISTS backup_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    interval TEXT NOT NULL DEFAULT 'weekly',
    format TEXT NOT NULL DEFAULT 'json',
    retention_days INTEGER DEFAULT 30,
    last_run_at DATETIME,
    next_run_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`;

export const BACKUPS_TABLE = `
  CREATE TABLE IF NOT EXISTS backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    format TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    size_bytes INTEGER,
    whiskey_count INTEGER,
    comment_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`;

export const INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_whiskeys_type ON whiskeys(type);
  CREATE INDEX IF NOT EXISTS idx_whiskeys_distillery ON whiskeys(distillery);
  CREATE INDEX IF NOT EXISTS idx_whiskeys_created_by ON whiskeys(created_by);
  CREATE INDEX IF NOT EXISTS idx_whiskey_comments_whiskey_id ON whiskey_comments(whiskey_id);
  CREATE INDEX IF NOT EXISTS idx_whiskey_comments_user_id ON whiskey_comments(user_id);
  CREATE INDEX IF NOT EXISTS idx_backups_user_id ON backups(user_id);
  CREATE INDEX IF NOT EXISTS idx_backup_schedules_user_id ON backup_schedules(user_id);
`;

/**
 * Create all tables and indexes on the given database.
 * Works with both the production `db` and the test in-memory `testDb`.
 */
export function createAllTables(database: { exec: (sql: string) => void }) {
  database.exec(USERS_TABLE);
  database.exec(WHISKEYS_TABLE);
  database.exec(WHISKEY_COMMENTS_TABLE);
  database.exec(BACKUP_SCHEDULES_TABLE);
  database.exec(BACKUPS_TABLE);
  database.exec(INDEXES);
}
