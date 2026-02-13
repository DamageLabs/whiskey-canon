import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '016_add_anthropic_api_key',
  up(db) {
    db.exec('ALTER TABLE users ADD COLUMN anthropic_api_key TEXT DEFAULT NULL');
  },
};
