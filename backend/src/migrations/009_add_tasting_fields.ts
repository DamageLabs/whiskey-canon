import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '009_add_tasting_fields',
  up(db) {
    db.exec('ALTER TABLE whiskeys ADD COLUMN color TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN nose_notes TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN palate_notes TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN finish_notes TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN times_tasted INTEGER DEFAULT 0');
    db.exec('ALTER TABLE whiskeys ADD COLUMN last_tasted_date TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN food_pairings TEXT');
  },
};
