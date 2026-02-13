import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '010_add_investment_tracking',
  up(db) {
    db.exec('ALTER TABLE whiskeys ADD COLUMN current_market_value REAL');
    db.exec('ALTER TABLE whiskeys ADD COLUMN value_gain_loss REAL');
    db.exec('ALTER TABLE whiskeys ADD COLUMN is_investment_bottle INTEGER DEFAULT 0');
  },
};
