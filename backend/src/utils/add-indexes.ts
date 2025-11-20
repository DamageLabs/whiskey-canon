import { db } from './database';

/**
 * Add database indexes for performance optimization
 * Indexes significantly speed up queries on large collections
 */
function addIndexes() {
  console.log('🔧 Adding database indexes for performance...\n');

  const indexes = [
    {
      name: 'idx_whiskeys_created_by',
      table: 'whiskeys',
      column: 'created_by',
      description: 'Speed up queries filtering by user'
    },
    {
      name: 'idx_whiskeys_type',
      table: 'whiskeys',
      column: 'type',
      description: 'Speed up filtering by whiskey type'
    },
    {
      name: 'idx_whiskeys_rating',
      table: 'whiskeys',
      column: 'rating',
      description: 'Speed up sorting by rating'
    },
    {
      name: 'idx_whiskeys_name',
      table: 'whiskeys',
      column: 'name',
      description: 'Speed up search by name'
    },
    {
      name: 'idx_whiskeys_distillery',
      table: 'whiskeys',
      column: 'distillery',
      description: 'Speed up filtering by distillery'
    },
    {
      name: 'idx_whiskeys_purchase_date',
      table: 'whiskeys',
      column: 'purchase_date',
      description: 'Speed up date range queries'
    },
    {
      name: 'idx_whiskeys_status',
      table: 'whiskeys',
      column: 'status',
      description: 'Speed up filtering by status'
    },
    {
      name: 'idx_whiskeys_is_opened',
      table: 'whiskeys',
      column: 'is_opened',
      description: 'Speed up opened/sealed filtering'
    },
    {
      name: 'idx_users_username',
      table: 'users',
      column: 'username',
      description: 'Speed up login queries'
    },
    {
      name: 'idx_users_email',
      table: 'users',
      column: 'email',
      description: 'Speed up email lookups'
    }
  ];

  let created = 0;
  let skipped = 0;

  for (const index of indexes) {
    try {
      // Check if index already exists
      const existing = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='index' AND name=?
      `).get(index.name);

      if (existing) {
        console.log(`⏭️  ${index.name}: Already exists`);
        skipped++;
        continue;
      }

      // Create index
      db.prepare(`
        CREATE INDEX ${index.name} ON ${index.table}(${index.column})
      `).run();

      console.log(`✅ ${index.name}: Created - ${index.description}`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating ${index.name}:`, error);
    }
  }

  console.log('\n📊 Index Creation Summary:');
  console.log('========================');
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Total indexes: ${indexes.length}`);

  // Show all indexes
  console.log('\n📋 Current Database Indexes:');
  console.log('============================');
  const allIndexes = db.prepare(`
    SELECT name, tbl_name
    FROM sqlite_master
    WHERE type='index'
    AND name NOT LIKE 'sqlite_%'
    ORDER BY tbl_name, name
  `).all() as any[];

  for (const idx of allIndexes) {
    console.log(`  ${idx.tbl_name}.${idx.name}`);
  }

  console.log('\n✅ Database optimization complete!');
  console.log('💡 Queries will now be significantly faster on large collections.');
}

// Run the index creation
addIndexes();
