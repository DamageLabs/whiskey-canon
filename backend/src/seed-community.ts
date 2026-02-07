import { UserModel } from './models/User';
import { WhiskeyModel } from './models/Whiskey';
import { Role, WhiskeyType, WhiskeyStatus } from './types';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function randomDate(startYear: number, endYear: number): string {
  const year = randomInt(startYear, endYear);
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function seedCommunityUsers() {
  console.log('🌱 Seeding two community users with public profiles...\n');

  // --- User 1: whiskey_wanderer (25 bottles, diverse explorer) ---
  const wanderer = await UserModel.create(
    'whiskey_wanderer',
    'wanderer@demo.com',
    'demo123',
    Role.EDITOR,
    'Emily',
    'Torres'
  );
  UserModel.updateVisibility(wanderer.id, true);
  console.log(`✓ Created whiskey_wanderer (id: ${wanderer.id}) — profile set to public`);

  // --- User 2: cask_hunter (38 bottles, scotch & bourbon hunter) ---
  const hunter = await UserModel.create(
    'cask_hunter',
    'hunter@demo.com',
    'demo123',
    Role.EDITOR,
    'Declan',
    'Murphy'
  );
  UserModel.updateVisibility(hunter.id, true);
  console.log(`✓ Created cask_hunter (id: ${hunter.id}) — profile set to public`);

  // --- Whiskey data pools ---
  const bourbonPool = [
    { name: "Blanton's Single Barrel", distillery: 'Buffalo Trace Distillery', age: 6, abv: 46.5, msrp: 64.99, secondary: 150, rating: 8.7 },
    { name: 'Buffalo Trace', distillery: 'Buffalo Trace Distillery', abv: 45.0, msrp: 25.99, secondary: 35, rating: 8.0 },
    { name: 'Eagle Rare 10 Year', distillery: 'Buffalo Trace Distillery', age: 10, abv: 45.0, msrp: 32.99, secondary: 65, rating: 8.5 },
    { name: "Maker's Mark 46", distillery: "Maker's Mark Distillery", abv: 47.0, msrp: 39.99, secondary: 42, rating: 8.2 },
    { name: 'Woodford Reserve Double Oaked', distillery: 'Woodford Reserve Distillery', abv: 45.2, msrp: 59.99, secondary: 62, rating: 8.3 },
    { name: 'Old Forester 1920 Prohibition Style', distillery: 'Brown-Forman', age: 4, abv: 57.5, msrp: 69.99, secondary: 75, rating: 8.9 },
    { name: 'Four Roses Single Barrel', distillery: 'Four Roses Distillery', abv: 50.0, msrp: 49.99, secondary: 52, rating: 8.5 },
    { name: 'Elijah Craig Barrel Proof', distillery: 'Heaven Hill', age: 12, abv: 65.5, msrp: 69.99, secondary: 80, rating: 9.0 },
    { name: 'Wild Turkey Rare Breed', distillery: 'Wild Turkey Distillery', abv: 58.4, msrp: 49.99, secondary: 52, rating: 8.6 },
    { name: 'Knob Creek 9 Year', distillery: 'Jim Beam', age: 9, abv: 50.0, msrp: 34.99, secondary: 38, rating: 8.1 },
    { name: "Booker's Bourbon", distillery: 'Jim Beam', age: 7, abv: 63.0, msrp: 89.99, secondary: 95, rating: 8.8 },
    { name: 'Weller 12 Year', distillery: 'Buffalo Trace Distillery', age: 12, abv: 45.0, msrp: 29.99, secondary: 250, rating: 8.6 },
    { name: 'Henry McKenna 10 Year', distillery: 'Heaven Hill', age: 10, abv: 50.0, msrp: 34.99, secondary: 50, rating: 8.3 },
    { name: '1792 Small Batch', distillery: 'Barton 1792 Distillery', abv: 46.85, msrp: 29.99, secondary: 32, rating: 7.8 },
  ];

  const scotchPool = [
    { name: 'Lagavulin 16 Year', distillery: 'Lagavulin Distillery', region: 'Islay', age: 16, abv: 43.0, msrp: 99.99, secondary: 105, rating: 9.1 },
    { name: 'Ardbeg 10 Year', distillery: 'Ardbeg Distillery', region: 'Islay', age: 10, abv: 46.0, msrp: 54.99, secondary: 58, rating: 8.9 },
    { name: 'Ardbeg Uigeadail', distillery: 'Ardbeg Distillery', region: 'Islay', abv: 54.2, msrp: 89.99, secondary: 95, rating: 9.3 },
    { name: 'Laphroaig Quarter Cask', distillery: 'Laphroaig Distillery', region: 'Islay', abv: 48.0, msrp: 59.99, secondary: 62, rating: 8.8 },
    { name: 'Glenfiddich 18 Year', distillery: 'Glenfiddich Distillery', region: 'Speyside', age: 18, abv: 40.0, msrp: 119.99, secondary: 125, rating: 8.6 },
    { name: 'Glenlivet 18 Year', distillery: 'The Glenlivet Distillery', region: 'Speyside', age: 18, abv: 43.0, msrp: 119.99, secondary: 125, rating: 8.5 },
    { name: 'Highland Park 12 Year', distillery: 'Highland Park Distillery', region: 'Islands', age: 12, abv: 40.0, msrp: 54.99, secondary: 58, rating: 8.3 },
    { name: 'Talisker 10 Year', distillery: 'Talisker Distillery', region: 'Islands', age: 10, abv: 45.8, msrp: 64.99, secondary: 68, rating: 8.6 },
    { name: 'Springbank 10 Year', distillery: 'Springbank Distillery', region: 'Campbeltown', age: 10, abv: 46.0, msrp: 69.99, secondary: 95, rating: 8.7 },
    { name: 'Oban 14 Year', distillery: 'Oban Distillery', region: 'Highlands', age: 14, abv: 43.0, msrp: 79.99, secondary: 83, rating: 8.4 },
    { name: 'Balvenie 14 Year Caribbean Cask', distillery: 'Balvenie Distillery', region: 'Speyside', age: 14, abv: 43.0, msrp: 79.99, secondary: 83, rating: 8.6 },
    { name: 'Bunnahabhain 12 Year', distillery: 'Bunnahabhain Distillery', region: 'Islay', age: 12, abv: 46.3, msrp: 59.99, secondary: 62, rating: 8.4 },
    { name: 'Macallan 12 Year Double Cask', distillery: 'The Macallan Distillery', region: 'Speyside', age: 12, abv: 40.0, msrp: 69.99, secondary: 75, rating: 8.5 },
    { name: 'Craigellachie 13 Year', distillery: 'Craigellachie Distillery', region: 'Speyside', age: 13, abv: 46.0, msrp: 59.99, secondary: 62, rating: 8.3 },
  ];

  const irishPool = [
    { name: 'Redbreast 12 Year', distillery: 'Midleton Distillery', age: 12, abv: 40.0, msrp: 59.99, secondary: 62, rating: 8.7 },
    { name: 'Redbreast 15 Year', distillery: 'Midleton Distillery', age: 15, abv: 46.0, msrp: 99.99, secondary: 105, rating: 9.0 },
    { name: 'Green Spot', distillery: 'Midleton Distillery', abv: 40.0, msrp: 49.99, secondary: 52, rating: 8.4 },
    { name: 'Yellow Spot 12 Year', distillery: 'Midleton Distillery', age: 12, abv: 46.0, msrp: 89.99, secondary: 95, rating: 8.7 },
    { name: 'Teeling Small Batch', distillery: 'Teeling Whiskey Company', abv: 46.0, msrp: 39.99, secondary: 42, rating: 8.2 },
    { name: "Writers Tears Copper Pot", distillery: 'Walsh Whiskey', abv: 40.0, msrp: 44.99, secondary: 47, rating: 8.3 },
  ];

  const japanesePool = [
    { name: 'Yamazaki 12 Year', distillery: 'Yamazaki Distillery', age: 12, abv: 43.0, msrp: 125.99, secondary: 250, rating: 9.0 },
    { name: 'Hibiki Harmony', distillery: 'Suntory', abv: 43.0, msrp: 89.99, secondary: 150, rating: 8.8 },
    { name: 'Hakushu 12 Year', distillery: 'Hakushu Distillery', age: 12, abv: 43.0, msrp: 125.99, secondary: 250, rating: 8.9 },
    { name: 'Nikka From The Barrel', distillery: 'Nikka Whisky', abv: 51.4, msrp: 69.99, secondary: 85, rating: 8.6 },
    { name: 'Nikka Coffey Grain', distillery: 'Nikka Whisky', abv: 45.0, msrp: 69.99, secondary: 85, rating: 8.4 },
  ];

  const ryePool = [
    { name: 'WhistlePig 10 Year', distillery: 'WhistlePig Farm', age: 10, abv: 50.0, msrp: 79.99, secondary: 85, rating: 8.8 },
    { name: 'Sazerac Rye', distillery: 'Buffalo Trace Distillery', abv: 45.0, msrp: 29.99, secondary: 35, rating: 8.1 },
    { name: 'High West Double Rye!', distillery: 'High West Distillery', abv: 46.0, msrp: 39.99, secondary: 42, rating: 8.3 },
    { name: "Michter's US*1 Rye", distillery: "Michter's Distillery", abv: 42.4, msrp: 44.99, secondary: 50, rating: 8.4 },
    { name: 'Pikesville Rye', distillery: 'Heaven Hill', abv: 55.0, msrp: 49.99, secondary: 60, rating: 8.6 },
  ];

  const noseNotes = ['Vanilla, caramel, honey', 'Peat smoke, sea salt, citrus', 'Dried fruit, sherry, oak', 'Fresh apple, malt, floral', 'Toffee, cinnamon, butterscotch'];
  const palateNotes = ['Rich oak, dark chocolate, cherry', 'Smoky brine, pepper, dark fruit', 'Orange peel, ginger, walnut', 'Honey, vanilla, spiced pear', 'Corn sweetness, leather, tobacco'];
  const finishNotes = ['Long warm finish with lingering spice', 'Clean campfire fade', 'Elegant and lasting with dried fruit', 'Medium finish with caramel sweetness', 'Bold, slow fade with dark chocolate'];

  // Helper to create a whiskey entry for a given user
  function createWhiskey(userId: number, data: any, type: WhiskeyType, country: string) {
    const purchaseDate = randomDate(2021, 2025);
    const isOpened = Math.random() > 0.4;
    const dateOpened = isOpened ? randomDate(parseInt(purchaseDate.split('-')[0]), 2025) : null;
    const size = country === 'Scotland' ? '700ml' : '750ml';
    const volume = parseInt(size);

    WhiskeyModel.create({
      name: data.name,
      type,
      distillery: data.distillery,
      region: data.region || (country === 'USA' ? 'Kentucky' : ''),
      age: data.age,
      abv: data.abv,
      description: `${data.name} from ${data.distillery}`,
      tasting_notes: `${randomPick(noseNotes)}. ${randomPick(palateNotes)}.`,
      nose_notes: randomPick(noseNotes),
      palate_notes: randomPick(palateNotes),
      finish_notes: randomPick(finishNotes),
      rating: Math.round((data.rating + (Math.random() - 0.5) * 0.6) * 10) / 10,
      size,
      quantity: 1,
      msrp: data.msrp,
      secondary_price: data.secondary,
      purchase_date: purchaseDate,
      purchase_price: Math.round(data.msrp * (0.85 + Math.random() * 0.4) * 100) / 100,
      purchase_location: randomPick(['Total Wine', 'Local Shop', 'K&L Wine', 'Online', 'Spec\'s', 'Duty Free', 'Distillery Gift Shop']),
      is_opened: isOpened,
      date_opened: dateOpened || undefined,
      remaining_volume: isOpened ? randomInt(200, volume - 50) : volume,
      storage_location: randomPick(['Bar Cart', 'Display Shelf', 'Cabinet', 'Whiskey Room', 'Kitchen']),
      status: WhiskeyStatus.IN_COLLECTION,
      country,
      proof: Math.round(data.abv * 2 * 10) / 10,
      current_market_value: data.secondary,
      is_investment_bottle: data.secondary > data.msrp * 2,
      limited_edition: Math.random() > 0.8,
      chill_filtered: Math.random() > 0.6,
      natural_color: Math.random() > 0.5,
      created_by: userId,
    });
  }

  // --- Whiskey Wanderer: 25 bottles, diverse world explorer ---
  console.log('\nCreating whiskey_wanderer collection (25 bottles)...');
  // Mix: 6 bourbon, 6 scotch, 5 irish, 5 japanese, 3 rye
  const wandererPlan = [
    ...Array.from({ length: 6 }, () => ({ pool: bourbonPool, type: WhiskeyType.BOURBON, country: 'USA' })),
    ...Array.from({ length: 6 }, () => ({ pool: scotchPool, type: WhiskeyType.SCOTCH, country: 'Scotland' })),
    ...Array.from({ length: 5 }, () => ({ pool: irishPool, type: WhiskeyType.IRISH, country: 'Ireland' })),
    ...Array.from({ length: 5 }, () => ({ pool: japanesePool, type: WhiskeyType.JAPANESE, country: 'Japan' })),
    ...Array.from({ length: 3 }, () => ({ pool: ryePool, type: WhiskeyType.RYE, country: 'USA' })),
  ];

  for (const entry of wandererPlan) {
    createWhiskey(wanderer.id, randomPick(entry.pool), entry.type, entry.country);
  }
  console.log('✓ Created 25 whiskeys for whiskey_wanderer');

  // --- Cask Hunter: 38 bottles, scotch & bourbon focused ---
  console.log('\nCreating cask_hunter collection (38 bottles)...');
  // Mix: 16 scotch, 14 bourbon, 4 rye, 2 irish, 2 japanese
  const hunterPlan = [
    ...Array.from({ length: 16 }, () => ({ pool: scotchPool, type: WhiskeyType.SCOTCH, country: 'Scotland' })),
    ...Array.from({ length: 14 }, () => ({ pool: bourbonPool, type: WhiskeyType.BOURBON, country: 'USA' })),
    ...Array.from({ length: 4 }, () => ({ pool: ryePool, type: WhiskeyType.RYE, country: 'USA' })),
    ...Array.from({ length: 2 }, () => ({ pool: irishPool, type: WhiskeyType.IRISH, country: 'Ireland' })),
    ...Array.from({ length: 2 }, () => ({ pool: japanesePool, type: WhiskeyType.JAPANESE, country: 'Japan' })),
  ];

  for (const entry of hunterPlan) {
    createWhiskey(hunter.id, randomPick(entry.pool), entry.type, entry.country);
  }
  console.log('✓ Created 38 whiskeys for cask_hunter');

  // --- Summary ---
  console.log('\n📊 Community Seed Summary:');
  console.log('========================');
  console.log('👤 whiskey_wanderer (Emily Torres) — 25 bottles, public profile');
  console.log('👤 cask_hunter (Declan Murphy) — 38 bottles, public profile');
  console.log('\nLogin: whiskey_wanderer / demo123  or  cask_hunter / demo123');
  console.log('\n✅ Community users seeded successfully!');
  process.exit(0);
}

seedCommunityUsers().catch((error) => {
  console.error('Error seeding community users:', error);
  process.exit(1);
});
