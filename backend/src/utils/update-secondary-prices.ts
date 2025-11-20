import { db } from './database';

// Update secondary prices for whiskeys that don't have them
function updateSecondaryPrices() {
  console.log('🔄 Updating secondary prices and market values for whiskeys...\n');

  // Get whiskeys without secondary prices but with MSRP
  const whiskeysWithoutSecondary = db.prepare(`
    SELECT id, name, type, msrp, rating, limited_edition, is_investment_bottle, age
    FROM whiskeys
    WHERE secondary_price IS NULL AND msrp IS NOT NULL
  `).all() as any[];

  console.log(`Found ${whiskeysWithoutSecondary.length} whiskeys without secondary prices\n`);

  let updated = 0;

  for (const whiskey of whiskeysWithoutSecondary) {
    let multiplier = 1.1; // Base multiplier

    // Adjust multiplier based on characteristics
    if (whiskey.limited_edition === 1 || whiskey.is_investment_bottle === 1) {
      multiplier = 1.5 + Math.random() * 0.5; // 1.5-2.0x for investment/limited bottles
    } else if (whiskey.age && whiskey.age >= 18) {
      multiplier = 1.3 + Math.random() * 0.3; // 1.3-1.6x for aged bottles
    } else if (whiskey.rating && whiskey.rating >= 9.0) {
      multiplier = 1.4 + Math.random() * 0.3; // 1.4-1.7x for highly rated
    } else if (whiskey.age && whiskey.age >= 12) {
      multiplier = 1.2 + Math.random() * 0.2; // 1.2-1.4x for 12+ year
    } else if (whiskey.rating && whiskey.rating >= 8.5) {
      multiplier = 1.2 + Math.random() * 0.2; // 1.2-1.4x for well-rated
    } else if (whiskey.msrp < 40) {
      multiplier = 1.05 + Math.random() * 0.15; // 1.05-1.2x for budget bottles
    } else {
      multiplier = 1.1 + Math.random() * 0.2; // 1.1-1.3x for standard bottles
    }

    const secondaryPrice = parseFloat((whiskey.msrp * multiplier).toFixed(2));

    // Update both secondary_price and current_market_value
    db.prepare(`
      UPDATE whiskeys
      SET secondary_price = ?,
          current_market_value = ?
      WHERE id = ?
    `).run(secondaryPrice, secondaryPrice, whiskey.id);

    updated++;
  }

  console.log(`✅ Updated ${updated} whiskeys with secondary prices\n`);

  // Now update current_market_value for whiskeys that have secondary_price but no current_market_value
  const whiskeysWithoutMarketValue = db.prepare(`
    SELECT id, name, secondary_price
    FROM whiskeys
    WHERE current_market_value IS NULL AND secondary_price IS NOT NULL
  `).all() as any[];

  console.log(`Found ${whiskeysWithoutMarketValue.length} whiskeys without current market values\n`);

  let marketValueUpdated = 0;

  for (const whiskey of whiskeysWithoutMarketValue) {
    // Use secondary_price as current_market_value
    db.prepare(`
      UPDATE whiskeys
      SET current_market_value = ?
      WHERE id = ?
    `).run(whiskey.secondary_price, whiskey.id);

    marketValueUpdated++;
  }

  console.log(`✅ Updated ${marketValueUpdated} whiskeys with current market values\n`);

  // Show summary
  const summary = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(secondary_price) as with_secondary,
      ROUND(AVG(secondary_price), 2) as avg_secondary,
      ROUND(MIN(secondary_price), 2) as min_secondary,
      ROUND(MAX(secondary_price), 2) as max_secondary
    FROM whiskeys
  `).get() as any;

  console.log('📊 Summary:');
  console.log('===========');
  console.log(`Total whiskeys: ${summary.total}`);
  console.log(`With secondary prices: ${summary.with_secondary}`);
  console.log(`Average secondary price: $${summary.avg_secondary}`);
  console.log(`Price range: $${summary.min_secondary} - $${summary.max_secondary}`);
}

// Run the update
updateSecondaryPrices();
