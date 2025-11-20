import { db } from './database';

// Update all ratings to have exactly 2 decimal places
function updateRatings() {
  console.log('🔄 Updating ratings to 2 decimal places...\n');

  // Get all whiskeys with ratings
  const whiskeys = db.prepare(`
    SELECT id, name, rating
    FROM whiskeys
    WHERE rating IS NOT NULL
  `).all() as any[];

  console.log(`Found ${whiskeys.length} whiskeys with ratings\n`);

  let updated = 0;

  for (const whiskey of whiskeys) {
    // Round to 2 decimal places
    const roundedRating = parseFloat(whiskey.rating.toFixed(2));

    // Update the rating
    db.prepare(`
      UPDATE whiskeys
      SET rating = ?
      WHERE id = ?
    `).run(roundedRating, whiskey.id);

    updated++;
  }

  console.log(`✅ Updated ${updated} whiskey ratings\n`);

  // Show summary with examples
  console.log('📊 Sample Updated Ratings:');
  console.log('=========================');

  const samples = db.prepare(`
    SELECT name, rating
    FROM whiskeys
    WHERE rating IS NOT NULL
    ORDER BY rating DESC
    LIMIT 10
  `).all() as any[];

  for (const sample of samples) {
    console.log(`${sample.name}: ${sample.rating}`);
  }

  console.log('\n✅ All ratings now have exactly 2 decimal places!');
}

// Run the update
updateRatings();
