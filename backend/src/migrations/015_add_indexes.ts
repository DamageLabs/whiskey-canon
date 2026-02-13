import { Migration } from '../utils/migration-runner';

export const migration: Migration = {
  name: '015_add_indexes',
  up(db) {
    // Core foreign key and query indexes
    db.exec('CREATE INDEX IF NOT EXISTS idx_whiskeys_type ON whiskeys(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_whiskeys_distillery ON whiskeys(distillery)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_whiskeys_created_by ON whiskeys(created_by)');
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_whiskey_comments_whiskey_id ON whiskey_comments(whiskey_id)'
    );
    db.exec('CREATE INDEX IF NOT EXISTS idx_whiskey_comments_user_id ON whiskey_comments(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_backups_user_id ON backups(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_backup_schedules_user_id ON backup_schedules(user_id)');

    // Performance indexes for large collections
    db.exec('CREATE INDEX IF NOT EXISTS idx_whiskeys_rating ON whiskeys(rating)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_whiskeys_name ON whiskeys(name)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_whiskeys_purchase_date ON whiskeys(purchase_date)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_whiskeys_status ON whiskeys(status)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_whiskeys_is_opened ON whiskeys(is_opened)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  },
};
