import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '011_add_metadata_fields',
  up(db) {
    db.exec('ALTER TABLE whiskeys ADD COLUMN country TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN mash_bill TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN proof REAL');
    db.exec('ALTER TABLE whiskeys ADD COLUMN limited_edition INTEGER DEFAULT 0');
    db.exec('ALTER TABLE whiskeys ADD COLUMN awards TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN chill_filtered INTEGER');
    db.exec('ALTER TABLE whiskeys ADD COLUMN natural_color INTEGER');
  },
};
