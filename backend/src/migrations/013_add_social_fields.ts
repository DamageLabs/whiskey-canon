import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '013_add_social_fields',
  up(db) {
    db.exec('ALTER TABLE whiskeys ADD COLUMN obtained_from TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN is_for_sale INTEGER DEFAULT 0');
    db.exec('ALTER TABLE whiskeys ADD COLUMN asking_price REAL');
    db.exec('ALTER TABLE whiskeys ADD COLUMN is_for_trade INTEGER DEFAULT 0');
    db.exec('ALTER TABLE whiskeys ADD COLUMN shared_with TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN private_notes TEXT');
  },
};
