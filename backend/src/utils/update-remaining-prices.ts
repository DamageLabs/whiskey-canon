import { initializeDatabase } from './database';
import { db } from './database';

async function updateRemainingPrices() {
  console.log('Updating MSRP and secondary prices for remaining whiskeys...');

  initializeDatabase();

  // Price data for whiskeys that were missing prices
  // Based on 2025 market research
  const priceData = [
    // Japanese Whiskeys
    { id: 36, name: "Hibiki Harmony", msrp: 100, secondary_price: 100 },
    { id: 44, name: "Nikka From The Barrel", msrp: 55, secondary_price: 70 },
    { id: 49, name: "Hibiki Harmony", msrp: 100, secondary_price: 100 },
    { id: 56, name: "Nikka From The Barrel", msrp: 55, secondary_price: 70 },

    // Rye Whiskeys
    { id: 38, name: "Rittenhouse Rye", msrp: 28, secondary_price: 28 },
    { id: 41, name: "Rittenhouse Rye", msrp: 28, secondary_price: 28 },
    { id: 50, name: "Rittenhouse Rye", msrp: 28, secondary_price: 28 },
    { id: 51, name: "Sazerac Rye", msrp: 30, secondary_price: 32 },

    // Highland Park (using Viking Honour prices)
    { id: 52, name: "Highland Park 12 Year", msrp: 74, secondary_price: 46 },
    { id: 58, name: "Highland Park 12 Year", msrp: 74, secondary_price: 46 },

    // Tennessee Whiskey
    { id: 59, name: "Jack Daniel's Old No. 7", msrp: 27, secondary_price: 27 }
  ];

  let successCount = 0;
  let errorCount = 0;

  const updateStmt = db.prepare(`
    UPDATE whiskeys
    SET msrp = ?, secondary_price = ?
    WHERE id = ?
  `);

  for (const item of priceData) {
    try {
      const result = updateStmt.run(item.msrp, item.secondary_price, item.id);

      if (result.changes > 0) {
        console.log(`✓ Updated ID ${item.id}: ${item.name} - MSRP: $${item.msrp}, Secondary: $${item.secondary_price}`);
        successCount++;
      } else {
        console.log(`⚠ Not found: ID ${item.id} - ${item.name}`);
      }
    } catch (error) {
      console.error(`✗ Failed to update ID ${item.id}: ${item.name}`, error);
      errorCount++;
    }
  }

  console.log(`\nUpdate completed!`);
  console.log(`Successfully updated: ${successCount} whiskeys`);
  if (errorCount > 0) {
    console.log(`Failed: ${errorCount} whiskeys`);
  }

  process.exit(0);
}

updateRemainingPrices().catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});
