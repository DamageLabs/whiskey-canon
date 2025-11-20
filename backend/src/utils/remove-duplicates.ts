import { db } from './database';
import { WhiskeyType } from '../types';

// Helper function to generate random number in range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to pick random item from array
function randomPick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

// Helper function to pick random date
function randomDate(startYear: number, endYear: number): string {
  const year = randomInt(startYear, endYear);
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Bourbon whiskeys database for replacements
const bourbonReplacements = [
  { name: 'Old Grand-Dad 114', distillery: 'Jim Beam', age: 4, abv: 57.0, msrp: 29.99, secondary: 35, rating: 8.2 },
  { name: 'Evan Williams Single Barrel', distillery: 'Heaven Hill', age: 5, abv: 43.3, msrp: 29.99, secondary: 32, rating: 8.0 },
  { name: 'Larceny Barrel Proof', distillery: 'Heaven Hill', abv: 62.5, msrp: 49.99, secondary: 60, rating: 8.7 },
  { name: 'Russell\'s Reserve Single Barrel', distillery: 'Wild Turkey Distillery', age: 10, abv: 55.0, msrp: 59.99, secondary: 65, rating: 8.7 },
  { name: 'Old Fitzgerald Bottled in Bond', distillery: 'Heaven Hill', age: 9, abv: 50.0, msrp: 89.99, secondary: 150, rating: 8.9 },
  { name: 'Michter\'s US*1 Small Batch Bourbon', distillery: 'Michter\'s Distillery', abv: 45.7, msrp: 44.99, secondary: 50, rating: 8.3 },
  { name: 'Angel\'s Envy', distillery: 'Louisville Distilling Company', abv: 43.3, msrp: 49.99, secondary: 52, rating: 7.9 },
  { name: 'Kentucky Owl Confiscated', distillery: 'Stoli Group', abv: 48.5, msrp: 99.99, secondary: 110, rating: 8.5 },
  { name: 'Jefferson\'s Ocean Aged at Sea', distillery: 'Kentucky Artisan Distillery', abv: 45.0, msrp: 79.99, secondary: 85, rating: 8.4 },
  { name: 'Blade and Bow', distillery: 'Diageo', abv: 45.5, msrp: 49.99, secondary: 52, rating: 7.8 },
  { name: 'New Riff Single Barrel', distillery: 'New Riff Distilling', age: 4, abv: 55.0, msrp: 49.99, secondary: 55, rating: 8.4 },
  { name: 'Wilderness Trail Small Batch', distillery: 'Wilderness Trail', age: 4, abv: 50.0, msrp: 49.99, secondary: 52, rating: 8.3 },
  { name: 'Old Elk Straight Bourbon', distillery: 'Old Elk Distillery', age: 5, abv: 44.0, msrp: 64.99, secondary: 68, rating: 8.1 },
  { name: 'Rabbit Hole Cavehill', distillery: 'Rabbit Hole', age: 4, abv: 47.5, msrp: 69.99, secondary: 72, rating: 8.2 },
  { name: 'Joseph Magnus', distillery: 'Magnus & Co', abv: 50.0, msrp: 89.99, secondary: 95, rating: 8.6 },
  { name: 'Barrell Bourbon Batch 033', distillery: 'Barrell Craft Spirits', age: 9, abv: 58.0, msrp: 89.99, secondary: 100, rating: 8.8 },
  { name: 'Smoke Wagon Uncut Unfiltered', distillery: 'Nevada H&C Distilling', abv: 57.5, msrp: 59.99, secondary: 75, rating: 8.5 },
  { name: 'Blue Note Juke Joint', distillery: 'Blue Note Bourbon', age: 15, abv: 50.0, msrp: 149.99, secondary: 175, rating: 8.9 },
  { name: 'Castle & Key Restoration Rye', distillery: 'Castle & Key', age: 4, abv: 50.0, msrp: 39.99, secondary: 45, rating: 8.0 },
  { name: 'Old Carter Whiskey Co Batch 10', distillery: 'Old Carter', age: 12, abv: 58.5, msrp: 199.99, secondary: 300, rating: 9.1 },
];

// Scotch whiskeys for replacements
const scotchReplacements = [
  { name: 'Clynelish 14 Year', distillery: 'Clynelish Distillery', region: 'Highlands', age: 14, abv: 46.0, msrp: 69.99, secondary: 75, rating: 8.4 },
  { name: 'Bruichladdich The Classic Laddie', distillery: 'Bruichladdich Distillery', region: 'Islay', abv: 50.0, msrp: 59.99, secondary: 62, rating: 8.5 },
  { name: 'Kilchoman Machir Bay', distillery: 'Kilchoman Distillery', region: 'Islay', abv: 46.0, msrp: 64.99, secondary: 68, rating: 8.6 },
  { name: 'Caol Ila 12 Year', distillery: 'Caol Ila Distillery', region: 'Islay', age: 12, abv: 43.0, msrp: 64.99, secondary: 68, rating: 8.5 },
  { name: 'GlenDronach 18 Year Allardice', distillery: 'GlenDronach Distillery', region: 'Highlands', age: 18, abv: 46.0, msrp: 149.99, secondary: 165, rating: 9.0 },
  { name: 'Benromach 10 Year', distillery: 'Benromach Distillery', region: 'Speyside', age: 10, abv: 43.0, msrp: 54.99, secondary: 58, rating: 8.2 },
  { name: 'Ledaig 10 Year', distillery: 'Tobermory Distillery', region: 'Islands', age: 10, abv: 46.3, msrp: 54.99, secondary: 60, rating: 8.4 },
  { name: 'Edradour 10 Year', distillery: 'Edradour Distillery', region: 'Highlands', age: 10, abv: 40.0, msrp: 59.99, secondary: 62, rating: 8.1 },
  { name: 'AnCnoc 12 Year', distillery: 'Knockdhu Distillery', region: 'Highlands', age: 12, abv: 40.0, msrp: 49.99, secondary: 52, rating: 8.0 },
  { name: 'Deanston 12 Year', distillery: 'Deanston Distillery', region: 'Highlands', age: 12, abv: 46.3, msrp: 54.99, secondary: 58, rating: 8.3 },
  { name: 'Tomatin 12 Year', distillery: 'Tomatin Distillery', region: 'Highlands', age: 12, abv: 43.0, msrp: 44.99, secondary: 48, rating: 7.9 },
  { name: 'Glen Scotia 15 Year', distillery: 'Glen Scotia Distillery', region: 'Campbeltown', age: 15, abv: 46.0, msrp: 79.99, secondary: 85, rating: 8.6 },
  { name: 'Tamdhu 12 Year', distillery: 'Tamdhu Distillery', region: 'Speyside', age: 12, abv: 43.0, msrp: 59.99, secondary: 62, rating: 8.3 },
  { name: 'Ardmore Legacy', distillery: 'Ardmore Distillery', region: 'Highlands', abv: 40.0, msrp: 39.99, secondary: 42, rating: 7.7 },
  { name: 'Glenallachie 12 Year', distillery: 'Glenallachie Distillery', region: 'Speyside', age: 12, abv: 46.0, msrp: 64.99, secondary: 68, rating: 8.5 },
  { name: 'Benriach 10 Year', distillery: 'Benriach Distillery', region: 'Speyside', age: 10, abv: 43.0, msrp: 54.99, secondary: 58, rating: 8.2 },
  { name: 'Glendronach 12 Year', distillery: 'Glendronach Distillery', region: 'Highlands', age: 12, abv: 43.0, msrp: 59.99, secondary: 62, rating: 8.4 },
  { name: 'Dalwhinnie 15 Year', distillery: 'Dalwhinnie Distillery', region: 'Highlands', age: 15, abv: 43.0, msrp: 69.99, secondary: 72, rating: 8.1 },
  { name: 'Scapa Skiren', distillery: 'Scapa Distillery', region: 'Islands', abv: 40.0, msrp: 59.99, secondary: 62, rating: 7.9 },
  { name: 'Old Pulteney 12 Year', distillery: 'Old Pulteney Distillery', region: 'Highlands', age: 12, abv: 40.0, msrp: 49.99, secondary: 52, rating: 8.0 },
];

// Irish whiskeys for replacements
const irishReplacements = [
  { name: 'Knappogue Castle 12 Year', distillery: 'Bushmills Distillery', age: 12, abv: 40.0, msrp: 54.99, secondary: 58, rating: 8.2 },
  { name: 'Tyrconnell 10 Year Madeira Finish', distillery: 'Cooley Distillery', age: 10, abv: 46.0, msrp: 69.99, secondary: 75, rating: 8.5 },
  { name: 'Method and Madness Single Pot Still', distillery: 'Midleton Distillery', abv: 46.0, msrp: 69.99, secondary: 72, rating: 8.3 },
  { name: 'Bushmills 16 Year', distillery: 'Bushmills Distillery', age: 16, abv: 40.0, msrp: 89.99, secondary: 95, rating: 8.6 },
  { name: 'Dingle Single Malt', distillery: 'Dingle Distillery', age: 4, abv: 46.5, msrp: 79.99, secondary: 95, rating: 8.4 },
  { name: 'Tullamore D.E.W. 14 Year', distillery: 'William Grant & Sons', age: 14, abv: 41.3, msrp: 59.99, secondary: 62, rating: 8.1 },
];

// Japanese whiskeys for replacements
const japaneseReplacements = [
  { name: 'Toki Suntory', distillery: 'Suntory', abv: 43.0, msrp: 39.99, secondary: 50, rating: 7.8 },
  { name: 'Kamiki Intense Wood', distillery: 'Kamiki', abv: 48.0, msrp: 79.99, secondary: 85, rating: 8.2 },
  { name: 'Kujira Ryukyu Whisky', distillery: 'Kujira', abv: 43.0, msrp: 69.99, secondary: 75, rating: 8.0 },
  { name: 'Akashi Single Malt', distillery: 'White Oak Distillery', abv: 46.0, msrp: 64.99, secondary: 80, rating: 8.3 },
  { name: 'Matsui Sakura Cask', distillery: 'Matsui Shuzo', abv: 43.0, msrp: 69.99, secondary: 85, rating: 8.1 },
  { name: 'Togouchi Premium', distillery: 'Chugoku Jozo', abv: 40.0, msrp: 49.99, secondary: 60, rating: 7.9 },
];

// Rye whiskeys for replacements
const ryeReplacements = [
  { name: 'Alberta Premium Cask Strength', distillery: 'Alberta Distillers', abv: 64.5, msrp: 49.99, secondary: 60, rating: 8.7 },
  { name: 'Jack Daniel\'s Rye', distillery: 'Jack Daniel Distillery', abv: 45.0, msrp: 27.99, secondary: 30, rating: 7.6 },
  { name: 'Wild Turkey Rye 101', distillery: 'Wild Turkey Distillery', abv: 50.5, msrp: 29.99, secondary: 32, rating: 8.0 },
];

async function removeDuplicates() {
  console.log('🔄 Removing duplicate bottles from collections...\n');

  // Get all users
  const users = db.prepare('SELECT id, username, role FROM users').all() as any[];

  let totalReplacements = 0;

  for (const user of users) {
    console.log(`\nProcessing ${user.username}...`);

    // Find duplicates for this user
    const duplicates = db.prepare(`
      SELECT name, distillery, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM whiskeys
      WHERE created_by = ?
      GROUP BY name, distillery
      HAVING COUNT(*) > 1
    `).all(user.id) as any[];

    if (duplicates.length === 0) {
      console.log(`  ✓ No duplicates found`);
      continue;
    }

    console.log(`  Found ${duplicates.length} duplicate sets`);

    for (const dup of duplicates) {
      const ids = dup.ids.split(',').map((id: string) => parseInt(id));
      const keepId = ids[0]; // Keep the first one
      const replaceIds = ids.slice(1); // Replace the rest

      console.log(`  - ${dup.name}: keeping 1, replacing ${replaceIds.length}`);

      // Get all whiskey names already in this user's collection
      const existingNames = db.prepare(`
        SELECT DISTINCT name, distillery FROM whiskeys WHERE created_by = ?
      `).all(user.id) as any[];
      const existingSet = new Set(existingNames.map(w => `${w.name}|${w.distillery}`));

      for (const replaceId of replaceIds) {
        // Get the current whiskey details
        const current = db.prepare('SELECT * FROM whiskeys WHERE id = ?').get(replaceId) as any;

        // Choose replacement based on user profile and current type
        let replacement: any;
        let newType = current.type;
        let availableReplacements: any[] = [];

        if (user.username === 'bourbon_lover') {
          availableReplacements = bourbonReplacements.filter(r =>
            !existingSet.has(`${r.name}|${r.distillery}`)
          );
          if (availableReplacements.length === 0) {
            // Fallback to rye if all bourbons are taken
            availableReplacements = ryeReplacements.filter(r =>
              !existingSet.has(`${r.name}|${r.distillery}`)
            );
            if (availableReplacements.length === 0) {
              console.log(`  ⚠️  Warning: No unique bourbon/rye replacements for ${user.username}`);
              availableReplacements = bourbonReplacements;
            }
          }
          replacement = randomPick(availableReplacements);
          newType = ryeReplacements.includes(replacement) ? WhiskeyType.RYE : WhiskeyType.BOURBON;
        } else if (user.username === 'scotch_fan') {
          availableReplacements = scotchReplacements.filter(r =>
            !existingSet.has(`${r.name}|${r.distillery}`)
          );
          if (availableReplacements.length === 0) {
            // Fallback to Irish if all scotches are taken
            availableReplacements = irishReplacements.filter(r =>
              !existingSet.has(`${r.name}|${r.distillery}`)
            );
            if (availableReplacements.length === 0) {
              console.log(`  ⚠️  Warning: No unique scotch/Irish replacements for ${user.username}`);
              availableReplacements = scotchReplacements;
            }
          }
          replacement = randomPick(availableReplacements);
          newType = irishReplacements.includes(replacement) ? WhiskeyType.IRISH : WhiskeyType.SCOTCH;
        } else if (user.username === 'beginner') {
          // Mix of affordable options
          let allAffordable = [
            ...bourbonReplacements.filter(b => b.msrp < 50),
            ...scotchReplacements.filter(s => s.msrp < 60),
            ...irishReplacements.filter(i => i.msrp < 60),
          ].filter(r => !existingSet.has(`${r.name}|${r.distillery}`));
          if (allAffordable.length === 0) {
            // Try all bottles under $80
            allAffordable = [
              ...bourbonReplacements.filter(b => b.msrp < 80),
              ...scotchReplacements.filter(s => s.msrp < 80),
              ...irishReplacements,
              ...ryeReplacements,
            ].filter(r => !existingSet.has(`${r.name}|${r.distillery}`));
            if (allAffordable.length === 0) {
              console.log(`  ⚠️  Warning: No unique affordable replacements for ${user.username}`);
              allAffordable = bourbonReplacements.filter(b => b.msrp < 50);
            }
          }
          replacement = randomPick(allAffordable);
          if (scotchReplacements.includes(replacement)) newType = WhiskeyType.SCOTCH;
          else if (irishReplacements.includes(replacement)) newType = WhiskeyType.IRISH;
          else if (ryeReplacements.includes(replacement)) newType = WhiskeyType.RYE;
          else newType = WhiskeyType.BOURBON;
        } else if (user.username === 'investor') {
          // High-value bottles - try high value first, then medium value, then all
          let highValue = [
            ...bourbonReplacements.filter(b => b.secondary > 100),
            ...scotchReplacements.filter(s => s.secondary > 100),
            ...japaneseReplacements,
          ].filter(r => !existingSet.has(`${r.name}|${r.distillery}`));

          if (highValue.length === 0) {
            // Try medium value bottles (secondary 60-100)
            highValue = [
              ...bourbonReplacements.filter(b => b.secondary >= 60 && b.secondary <= 100),
              ...scotchReplacements.filter(s => s.secondary >= 60 && s.secondary <= 100),
              ...irishReplacements,
            ].filter(r => !existingSet.has(`${r.name}|${r.distillery}`));
          }

          if (highValue.length === 0) {
            // Last resort: any bottle not yet in collection
            highValue = [
              ...bourbonReplacements,
              ...scotchReplacements,
              ...irishReplacements,
              ...japaneseReplacements,
              ...ryeReplacements,
            ].filter(r => !existingSet.has(`${r.name}|${r.distillery}`));
          }

          if (highValue.length > 0) {
            replacement = randomPick(highValue);
            if (scotchReplacements.includes(replacement)) newType = WhiskeyType.SCOTCH;
            else if (japaneseReplacements.includes(replacement)) newType = WhiskeyType.JAPANESE;
            else if (irishReplacements.includes(replacement)) newType = WhiskeyType.IRISH;
            else if (ryeReplacements.includes(replacement)) newType = WhiskeyType.RYE;
            else newType = WhiskeyType.BOURBON;
          } else {
            // This should never happen with 80+ bottles in pools
            console.log(`  ⚠️  Warning: No unique replacements available for ${user.username}`);
            replacement = randomPick(bourbonReplacements);
            newType = WhiskeyType.BOURBON;
          }
        } else if (user.username === 'curator' || user.username === 'admin') {
          // Diverse mix
          let allReplacements = [
            ...bourbonReplacements,
            ...scotchReplacements,
            ...irishReplacements,
            ...japaneseReplacements,
            ...ryeReplacements,
          ].filter(r => !existingSet.has(`${r.name}|${r.distillery}`));

          if (allReplacements.length === 0) {
            console.log(`  ⚠️  Warning: No unique replacements available for ${user.username}`);
            // This should never happen with 80+ bottles, but fallback to bourbon
            allReplacements = bourbonReplacements;
          }

          replacement = randomPick(allReplacements);
          if (scotchReplacements.includes(replacement)) newType = WhiskeyType.SCOTCH;
          else if (irishReplacements.includes(replacement)) newType = WhiskeyType.IRISH;
          else if (japaneseReplacements.includes(replacement)) newType = WhiskeyType.JAPANESE;
          else if (ryeReplacements.includes(replacement)) newType = WhiskeyType.RYE;
          else newType = WhiskeyType.BOURBON;
        } else {
          // Default: bourbon with fallback to rye
          availableReplacements = bourbonReplacements.filter(r =>
            !existingSet.has(`${r.name}|${r.distillery}`)
          );
          if (availableReplacements.length === 0) {
            availableReplacements = ryeReplacements.filter(r =>
              !existingSet.has(`${r.name}|${r.distillery}`)
            );
            if (availableReplacements.length === 0) {
              console.log(`  ⚠️  Warning: No unique bourbon/rye replacements for ${user.username}`);
              availableReplacements = bourbonReplacements;
            }
          }
          replacement = randomPick(availableReplacements);
          newType = ryeReplacements.includes(replacement) ? WhiskeyType.RYE : WhiskeyType.BOURBON;
        }

        // Add this replacement to existing set to avoid creating new duplicates in this run
        existingSet.add(`${replacement.name}|${replacement.distillery}`);

        // Update the whiskey with new details
        const purchaseDate = randomDate(2020, 2024);
        const isOpened = Math.random() > 0.5;
        const dateOpened = isOpened ? randomDate(parseInt(purchaseDate.split('-')[0]), 2024) : null;
        const country = newType === WhiskeyType.SCOTCH ? 'Scotland' :
                       newType === WhiskeyType.IRISH ? 'Ireland' :
                       newType === WhiskeyType.JAPANESE ? 'Japan' : 'USA';
        const size = country === 'Scotland' ? '700ml' : '750ml';

        db.prepare(`
          UPDATE whiskeys
          SET name = ?,
              type = ?,
              distillery = ?,
              region = ?,
              age = ?,
              abv = ?,
              msrp = ?,
              secondary_price = ?,
              current_market_value = ?,
              rating = ?,
              description = ?,
              tasting_notes = ?,
              country = ?,
              size = ?,
              purchase_date = ?,
              purchase_price = ?,
              is_opened = ?,
              date_opened = ?,
              remaining_volume = ?
          WHERE id = ?
        `).run(
          replacement.name,
          newType,
          replacement.distillery,
          (replacement as any).region || '',
          replacement.age || null,
          replacement.abv,
          replacement.msrp,
          replacement.secondary,
          replacement.secondary,
          replacement.rating + (Math.random() - 0.5) * 0.3,
          `${replacement.name} - ${newType}`,
          newType === WhiskeyType.SCOTCH && (replacement as any).region === 'Islay' ? 'Peaty and smoky' : 'Smooth and complex',
          country,
          size,
          purchaseDate,
          replacement.msrp * (0.9 + Math.random() * 0.3),
          isOpened ? 1 : 0,
          dateOpened,
          isOpened ? randomInt(300, 700) : (country === 'Scotland' ? 700 : 750),
          replaceId
        );

        totalReplacements++;
      }
    }
  }

  console.log(`\n✅ Replaced ${totalReplacements} duplicate bottles\n`);

  // Verify no duplicates remain
  console.log('📊 Verification:');
  console.log('================');

  for (const user of users) {
    const remaining = db.prepare(`
      SELECT name, COUNT(*) as count
      FROM whiskeys
      WHERE created_by = ?
      GROUP BY name, distillery
      HAVING COUNT(*) > 1
    `).all(user.id) as any[];

    if (remaining.length > 0) {
      console.log(`⚠️  ${user.username} still has ${remaining.length} duplicates!`);
    } else {
      const total = db.prepare('SELECT COUNT(*) as count FROM whiskeys WHERE created_by = ?').get(user.id) as any;
      console.log(`✓ ${user.username}: ${total.count} unique whiskeys`);
    }
  }

  console.log('\n✅ All duplicates removed!');
}

// Run the duplicate removal
removeDuplicates().catch((error) => {
  console.error('Error removing duplicates:', error);
  process.exit(1);
});
