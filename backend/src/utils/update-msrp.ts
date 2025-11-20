import { initializeDatabase } from './database';
import { db } from './database';

async function updateMSRP() {
  console.log('Updating MSRP values for whiskeys...');

  initializeDatabase();

  // MSRP data for all whiskeys - based on 2025 market research
  const msrpData = [
    // Bourbons
    { name: "Buffalo Trace", msrp: 28 },
    { name: "Maker's Mark", msrp: 30 },
    { name: "Woodford Reserve", msrp: 40 },
    { name: "Blanton's Single Barrel", msrp: 70 },
    { name: "Eagle Rare 10 Year", msrp: 40 },
    { name: "Knob Creek Small Batch", msrp: 35 },
    { name: "Four Roses Small Batch", msrp: 37 },
    { name: "Wild Turkey 101", msrp: 26 },
    { name: "Elijah Craig Small Batch", msrp: 34 },
    { name: "Old Forester 1920 Prohibition Style", msrp: 58 },

    // Scotches
    { name: "Glenfiddich 12 Year", msrp: 48 },
    { name: "Macallan 12 Year Sherry Oak", msrp: 75 },
    { name: "Laphroaig 10 Year", msrp: 55 },
    { name: "Lagavulin 16 Year", msrp: 95 },
    { name: "Glenlivet 12 Year", msrp: 50 },
    { name: "Highland Park 12 Year Viking Honour", msrp: 74 },
    { name: "Talisker 10 Year", msrp: 70 },
    { name: "Oban 14 Year", msrp: 87 },
    { name: "Ardbeg 10 Year", msrp: 55 },
    { name: "Balvenie DoubleWood 12 Year", msrp: 75 },

    // Irish Whiskeys
    { name: "Jameson Irish Whiskey", msrp: 32 },
    { name: "Redbreast 12 Year", msrp: 72 },
    { name: "Bushmills Black Bush", msrp: 33 },
    { name: "Tullamore D.E.W.", msrp: 26 },
    { name: "Green Spot", msrp: 65 },
    { name: "Powers Gold Label", msrp: 30 },
    { name: "Teeling Small Batch", msrp: 40 },
    { name: "Connemara Peated Single Malt", msrp: 44 },
    { name: "Yellow Spot 12 Year", msrp: 105 },
    { name: "Method and Madness Single Pot Still", msrp: 75 }
  ];

  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  const updateStmt = db.prepare(`
    UPDATE whiskeys
    SET msrp = ?
    WHERE name = ?
  `);

  for (const item of msrpData) {
    try {
      const result = updateStmt.run(item.msrp, item.name);

      if (result.changes > 0) {
        console.log(`✓ Updated: ${item.name} - MSRP: $${item.msrp}`);
        successCount++;
      } else {
        console.log(`⚠ Not found: ${item.name}`);
        notFoundCount++;
      }
    } catch (error) {
      console.error(`✗ Failed to update: ${item.name}`, error);
      errorCount++;
    }
  }

  console.log(`\nUpdate completed!`);
  console.log(`Successfully updated: ${successCount} whiskeys`);
  if (notFoundCount > 0) {
    console.log(`Not found in database: ${notFoundCount} whiskeys`);
  }
  if (errorCount > 0) {
    console.log(`Failed: ${errorCount} whiskeys`);
  }

  process.exit(0);
}

updateMSRP().catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});
