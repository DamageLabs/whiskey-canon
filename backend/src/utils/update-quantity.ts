import { initializeDatabase } from './database';
import { db } from './database';

async function updateQuantity() {
  console.log('Updating whiskeys with zero quantity to 1...');

  initializeDatabase();

  // Update all whiskeys where quantity is NULL or 0 to 1
  const updateStmt = db.prepare(`
    UPDATE whiskeys
    SET quantity = 1
    WHERE quantity IS NULL OR quantity = 0
  `);

  try {
    const result = updateStmt.run();
    console.log(`✓ Updated ${result.changes} whiskey(ies) to quantity: 1`);
  } catch (error) {
    console.error('✗ Failed to update quantities:', error);
    process.exit(1);
  }

  console.log(`\nUpdate completed!`);
  process.exit(0);
}

updateQuantity().catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});
