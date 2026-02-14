import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '017_add_openai_support',
  up(db) {
    db.exec('ALTER TABLE users ADD COLUMN openai_api_key TEXT DEFAULT NULL');
    db.exec("ALTER TABLE users ADD COLUMN ai_provider TEXT DEFAULT 'anthropic'");
  },
};
