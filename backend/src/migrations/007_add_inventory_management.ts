import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '007_add_inventory_management',
  up(db) {
    db.exec('ALTER TABLE whiskeys ADD COLUMN is_opened INTEGER DEFAULT 0');
    db.exec('ALTER TABLE whiskeys ADD COLUMN date_opened TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN remaining_volume REAL');
    db.exec('ALTER TABLE whiskeys ADD COLUMN storage_location TEXT');
    db.exec("ALTER TABLE whiskeys ADD COLUMN status TEXT DEFAULT 'in_collection'");
  },
};
