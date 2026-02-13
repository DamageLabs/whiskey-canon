import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '012_add_image_fields',
  up(db) {
    db.exec('ALTER TABLE whiskeys ADD COLUMN image_url TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN label_image_url TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN receipt_image_url TEXT');
  },
};
