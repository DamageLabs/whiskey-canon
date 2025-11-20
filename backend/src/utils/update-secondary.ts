import { initializeDatabase } from './database';
import { db } from './database';

async function updateSecondary() {
  console.log('Updating secondary market prices for whiskeys...');

  initializeDatabase();

  // Secondary market price data for all whiskeys - based on 2025 market research
  // Note: For widely available bottles without active secondary markets,
  // retail prices are used as they represent effective market value
  const secondaryData = [
    // Bourbons
    { name: "Buffalo Trace", secondary_price: 37 }, // Retail (no secondary premium)
    { name: "Maker's Mark", secondary_price: 30 }, // Retail (no secondary premium)
    { name: "Woodford Reserve", secondary_price: 42 }, // Retail (no secondary premium)
    { name: "Blanton's Single Barrel", secondary_price: 140 }, // Active secondary market
    { name: "Eagle Rare 10 Year", secondary_price: 100 }, // Active secondary market
    { name: "Knob Creek Small Batch", secondary_price: 35 }, // Retail (no secondary premium)
    { name: "Four Roses Small Batch", secondary_price: 37 }, // Retail (no secondary premium)
    { name: "Wild Turkey 101", secondary_price: 26 }, // Retail (no secondary premium)
    { name: "Elijah Craig Small Batch", secondary_price: 28 }, // Retail (no secondary premium)
    { name: "Old Forester 1920 Prohibition Style", secondary_price: 60 }, // Retail (no secondary premium)

    // Scotches - UK secondary market prices converted to USD (£1 = ~$1.30)
    { name: "Glenfiddich 12 Year", secondary_price: 26 }, // £20 secondary market
    { name: "Macallan 12 Year Sherry Oak", secondary_price: 83 }, // Retail/secondary
    { name: "Laphroaig 10 Year", secondary_price: 34 }, // £25.80 secondary market
    { name: "Lagavulin 16 Year", secondary_price: 65 }, // £50 secondary market
    { name: "Glenlivet 12 Year", secondary_price: 50 }, // Retail (no secondary premium)
    { name: "Highland Park 12 Year Viking Honour", secondary_price: 46 }, // £35 secondary market
    { name: "Talisker 10 Year", secondary_price: 75 }, // Retail average
    { name: "Oban 14 Year", secondary_price: 58 }, // £44.75 secondary market
    { name: "Ardbeg 10 Year", secondary_price: 52 }, // £40 secondary market
    { name: "Balvenie DoubleWood 12 Year", secondary_price: 49 }, // £37.91 secondary market

    // Irish Whiskeys
    { name: "Jameson Irish Whiskey", secondary_price: 30 }, // Retail (no secondary premium)
    { name: "Redbreast 12 Year", secondary_price: 70 }, // Retail (no secondary premium)
    { name: "Bushmills Black Bush", secondary_price: 32 }, // Retail (no secondary premium)
    { name: "Tullamore D.E.W.", secondary_price: 27 }, // Retail (no secondary premium)
    { name: "Green Spot", secondary_price: 65 }, // Retail (no secondary premium)
    { name: "Powers Gold Label", secondary_price: 30 }, // Retail (no secondary premium)
    { name: "Teeling Small Batch", secondary_price: 38 }, // Retail (no secondary premium)
    { name: "Connemara Peated Single Malt", secondary_price: 44 }, // Retail (no secondary premium)
    { name: "Yellow Spot 12 Year", secondary_price: 106 }, // Retail (no secondary premium)
    { name: "Method and Madness Single Pot Still", secondary_price: 78 } // Retail (no secondary premium)
  ];

  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  const updateStmt = db.prepare(`
    UPDATE whiskeys
    SET secondary_price = ?
    WHERE name = ?
  `);

  for (const item of secondaryData) {
    try {
      const result = updateStmt.run(item.secondary_price, item.name);

      if (result.changes > 0) {
        console.log(`✓ Updated: ${item.name} - Secondary Price: $${item.secondary_price}`);
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

updateSecondary().catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});
