import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '006_add_purchase_tracking',
  up(db) {
    db.exec('ALTER TABLE whiskeys ADD COLUMN size TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN quantity INTEGER');
    db.exec('ALTER TABLE whiskeys ADD COLUMN msrp REAL');
    db.exec('ALTER TABLE whiskeys ADD COLUMN secondary_price REAL');
    db.exec('ALTER TABLE whiskeys ADD COLUMN purchase_date TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN purchase_price REAL');
    db.exec('ALTER TABLE whiskeys ADD COLUMN purchase_location TEXT');
    db.exec('ALTER TABLE whiskeys ADD COLUMN bottle_code TEXT');
  },
};
