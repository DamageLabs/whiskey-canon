import { UserModel } from './models/User';
import { WhiskeyModel } from './models/Whiskey';
import { Role, WhiskeyType } from './types';
import { db } from './utils/database';

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

async function seedDemoData() {
  console.log('🌱 Starting demo database seed...\n');

  // Clear existing data
  console.log('Clearing existing data...');
  db.exec('DELETE FROM whiskeys');
  db.exec('DELETE FROM users');
  console.log('✓ Cleared existing data\n');

  // Create demo users
  console.log('Creating demo users...');

  const bourbonCollector = await UserModel.create(
    'bourbon_lover',
    'bourbon@demo.com',
    'demo123',
    Role.EDITOR,
    'James',
    'Anderson'
  );

  const scotchEnthusiast = await UserModel.create(
    'scotch_fan',
    'scotch@demo.com',
    'demo123',
    Role.EDITOR,
    'Margaret',
    'Campbell'
  );

  const whiskeyCurator = await UserModel.create(
    'curator',
    'curator@demo.com',
    'demo123',
    Role.EDITOR,
    'Robert',
    'MacLeod'
  );

  const newCollector = await UserModel.create(
    'beginner',
    'beginner@demo.com',
    'demo123',
    Role.VIEWER,
    'Sarah',
    'Johnson'
  );

  const investor = await UserModel.create(
    'investor',
    'investor@demo.com',
    'demo123',
    Role.EDITOR,
    'Michael',
    'Chen'
  );

  const admin = await UserModel.create(
    'admin',
    'admin@demo.com',
    'admin123',
    Role.ADMIN,
    'Admin',
    'User'
  );

  console.log('✓ Created 6 demo users\n');

  // Bourbon whiskeys database
  const bourbonData = [
    { name: "Pappy Van Winkle's Family Reserve 23 Year", distillery: 'Buffalo Trace Distillery', age: 23, abv: 47.8, msrp: 299.99, secondary: 4500, rating: 9.8 },
    { name: "Pappy Van Winkle's Family Reserve 20 Year", distillery: 'Buffalo Trace Distillery', age: 20, abv: 45.2, msrp: 199.99, secondary: 3500, rating: 9.7 },
    { name: "Pappy Van Winkle's Family Reserve 15 Year", distillery: 'Buffalo Trace Distillery', age: 15, abv: 53.5, msrp: 119.99, secondary: 1800, rating: 9.5 },
    { name: "Blanton's Single Barrel", distillery: 'Buffalo Trace Distillery', age: 6, abv: 46.5, msrp: 64.99, secondary: 150, rating: 8.7 },
    { name: 'Buffalo Trace', distillery: 'Buffalo Trace Distillery', abv: 45.0, msrp: 25.99, secondary: 35, rating: 8.0 },
    { name: 'Eagle Rare 10 Year', distillery: 'Buffalo Trace Distillery', age: 10, abv: 45.0, msrp: 32.99, secondary: 65, rating: 8.5 },
    { name: 'E.H. Taylor Small Batch', distillery: 'Buffalo Trace Distillery', abv: 50.0, msrp: 39.99, secondary: 75, rating: 8.8 },
    { name: 'George T. Stagg', distillery: 'Buffalo Trace Distillery', age: 15, abv: 64.1, msrp: 99.99, secondary: 1200, rating: 9.6 },
    { name: 'Weller 12 Year', distillery: 'Buffalo Trace Distillery', age: 12, abv: 45.0, msrp: 29.99, secondary: 250, rating: 8.6 },
    { name: 'Weller Full Proof', distillery: 'Buffalo Trace Distillery', abv: 57.0, msrp: 49.99, secondary: 300, rating: 8.9 },
    { name: "Maker's Mark", distillery: "Maker's Mark Distillery", abv: 45.0, msrp: 27.99, secondary: 30, rating: 7.5 },
    { name: "Maker's Mark 46", distillery: "Maker's Mark Distillery", abv: 47.0, msrp: 39.99, secondary: 42, rating: 8.2 },
    { name: "Maker's Mark Cask Strength", distillery: "Maker's Mark Distillery", abv: 55.5, msrp: 44.99, secondary: 50, rating: 8.5 },
    { name: 'Woodford Reserve', distillery: 'Woodford Reserve Distillery', abv: 45.2, msrp: 32.99, secondary: 35, rating: 7.8 },
    { name: 'Woodford Reserve Double Oaked', distillery: 'Woodford Reserve Distillery', abv: 45.2, msrp: 59.99, secondary: 62, rating: 8.3 },
    { name: 'Old Forester 1920 Prohibition Style', distillery: 'Brown-Forman', age: 4, abv: 57.5, msrp: 69.99, secondary: 75, rating: 8.9 },
    { name: 'Old Forester 1910 Old Fine Whisky', distillery: 'Brown-Forman', age: 4, abv: 46.5, msrp: 54.99, secondary: 58, rating: 8.6 },
    { name: 'Knob Creek 9 Year', distillery: 'Jim Beam', age: 9, abv: 50.0, msrp: 34.99, secondary: 38, rating: 8.1 },
    { name: 'Knob Creek Single Barrel', distillery: 'Jim Beam', age: 9, abv: 60.0, msrp: 49.99, secondary: 55, rating: 8.4 },
    { name: 'Booker\'s Bourbon', distillery: 'Jim Beam', age: 7, abv: 63.0, msrp: 89.99, secondary: 95, rating: 8.8 },
    { name: 'Four Roses Single Barrel', distillery: 'Four Roses Distillery', abv: 50.0, msrp: 49.99, secondary: 52, rating: 8.5 },
    { name: 'Four Roses Small Batch', distillery: 'Four Roses Distillery', abv: 45.0, msrp: 34.99, secondary: 37, rating: 8.2 },
    { name: 'Elijah Craig Small Batch', distillery: 'Heaven Hill', abv: 47.0, msrp: 28.99, secondary: 32, rating: 8.0 },
    { name: 'Elijah Craig Barrel Proof', distillery: 'Heaven Hill', age: 12, abv: 65.5, msrp: 69.99, secondary: 80, rating: 9.0 },
    { name: 'Henry McKenna 10 Year', distillery: 'Heaven Hill', age: 10, abv: 50.0, msrp: 34.99, secondary: 50, rating: 8.3 },
    { name: 'Wild Turkey 101', distillery: 'Wild Turkey Distillery', abv: 50.5, msrp: 24.99, secondary: 27, rating: 7.9 },
    { name: 'Wild Turkey Rare Breed', distillery: 'Wild Turkey Distillery', abv: 58.4, msrp: 49.99, secondary: 52, rating: 8.6 },
    { name: 'Russell\'s Reserve 10 Year', distillery: 'Wild Turkey Distillery', age: 10, abv: 45.0, msrp: 39.99, secondary: 42, rating: 8.4 },
    { name: 'Basil Hayden\'s', distillery: 'Jim Beam', abv: 40.0, msrp: 44.99, secondary: 47, rating: 7.5 },
    { name: '1792 Small Batch', distillery: 'Barton 1792 Distillery', abv: 46.85, msrp: 29.99, secondary: 32, rating: 7.8 },
  ];

  // Scotch whiskeys database
  const scotchData = [
    { name: 'Macallan 18 Year Sherry Oak', distillery: 'The Macallan Distillery', region: 'Speyside', age: 18, abv: 43.0, msrp: 299.99, secondary: 350, rating: 9.3 },
    { name: 'Macallan 25 Year Sherry Oak', distillery: 'The Macallan Distillery', region: 'Speyside', age: 25, abv: 43.0, msrp: 2499.99, secondary: 3200, rating: 9.7 },
    { name: 'Macallan 12 Year Double Cask', distillery: 'The Macallan Distillery', region: 'Speyside', age: 12, abv: 40.0, msrp: 69.99, secondary: 75, rating: 8.5 },
    { name: 'Lagavulin 16 Year', distillery: 'Lagavulin Distillery', region: 'Islay', age: 16, abv: 43.0, msrp: 99.99, secondary: 105, rating: 9.1 },
    { name: 'Lagavulin 8 Year', distillery: 'Lagavulin Distillery', region: 'Islay', age: 8, abv: 48.0, msrp: 64.99, secondary: 68, rating: 8.7 },
    { name: 'Ardbeg 10 Year', distillery: 'Ardbeg Distillery', region: 'Islay', age: 10, abv: 46.0, msrp: 54.99, secondary: 58, rating: 8.9 },
    { name: 'Ardbeg Uigeadail', distillery: 'Ardbeg Distillery', region: 'Islay', abv: 54.2, msrp: 89.99, secondary: 95, rating: 9.3 },
    { name: 'Ardbeg Corryvreckan', distillery: 'Ardbeg Distillery', region: 'Islay', abv: 57.1, msrp: 99.99, secondary: 105, rating: 9.2 },
    { name: 'Laphroaig 10 Year', distillery: 'Laphroaig Distillery', region: 'Islay', age: 10, abv: 40.0, msrp: 49.99, secondary: 52, rating: 8.6 },
    { name: 'Laphroaig Quarter Cask', distillery: 'Laphroaig Distillery', region: 'Islay', abv: 48.0, msrp: 59.99, secondary: 62, rating: 8.8 },
    { name: 'Glenfiddich 12 Year', distillery: 'Glenfiddich Distillery', region: 'Speyside', age: 12, abv: 40.0, msrp: 44.99, secondary: 47, rating: 7.8 },
    { name: 'Glenfiddich 15 Year', distillery: 'Glenfiddich Distillery', region: 'Speyside', age: 15, abv: 40.0, msrp: 64.99, secondary: 68, rating: 8.2 },
    { name: 'Glenfiddich 18 Year', distillery: 'Glenfiddich Distillery', region: 'Speyside', age: 18, abv: 40.0, msrp: 119.99, secondary: 125, rating: 8.6 },
    { name: 'Glenlivet 12 Year', distillery: 'The Glenlivet Distillery', region: 'Speyside', age: 12, abv: 40.0, msrp: 44.99, secondary: 47, rating: 7.7 },
    { name: 'Glenlivet 18 Year', distillery: 'The Glenlivet Distillery', region: 'Speyside', age: 18, abv: 43.0, msrp: 119.99, secondary: 125, rating: 8.5 },
    { name: 'Highland Park 12 Year', distillery: 'Highland Park Distillery', region: 'Islands', age: 12, abv: 40.0, msrp: 54.99, secondary: 58, rating: 8.3 },
    { name: 'Highland Park 18 Year', distillery: 'Highland Park Distillery', region: 'Islands', age: 18, abv: 43.0, msrp: 179.99, secondary: 185, rating: 8.8 },
    { name: 'Talisker 10 Year', distillery: 'Talisker Distillery', region: 'Islands', age: 10, abv: 45.8, msrp: 64.99, secondary: 68, rating: 8.6 },
    { name: 'Springbank 10 Year', distillery: 'Springbank Distillery', region: 'Campbeltown', age: 10, abv: 46.0, msrp: 69.99, secondary: 95, rating: 8.7 },
    { name: 'Springbank 18 Year', distillery: 'Springbank Distillery', region: 'Campbeltown', age: 18, abv: 46.0, msrp: 199.99, secondary: 250, rating: 9.1 },
    { name: 'Oban 14 Year', distillery: 'Oban Distillery', region: 'Highlands', age: 14, abv: 43.0, msrp: 79.99, secondary: 83, rating: 8.4 },
    { name: 'Balvenie 12 Year DoubleWood', distillery: 'Balvenie Distillery', region: 'Speyside', age: 12, abv: 40.0, msrp: 64.99, secondary: 68, rating: 8.5 },
    { name: 'Balvenie 14 Year Caribbean Cask', distillery: 'Balvenie Distillery', region: 'Speyside', age: 14, abv: 43.0, msrp: 79.99, secondary: 83, rating: 8.6 },
    { name: 'Aberlour 12 Year', distillery: 'Aberlour Distillery', region: 'Speyside', age: 12, abv: 40.0, msrp: 54.99, secondary: 58, rating: 8.2 },
    { name: 'Bunnahabhain 12 Year', distillery: 'Bunnahabhain Distillery', region: 'Islay', age: 12, abv: 46.3, msrp: 59.99, secondary: 62, rating: 8.4 },
    { name: 'Bowmore 12 Year', distillery: 'Bowmore Distillery', region: 'Islay', age: 12, abv: 40.0, msrp: 49.99, secondary: 52, rating: 8.0 },
    { name: 'Craigellachie 13 Year', distillery: 'Craigellachie Distillery', region: 'Speyside', age: 13, abv: 46.0, msrp: 59.99, secondary: 62, rating: 8.3 },
    { name: 'Glenmorangie Original 10 Year', distillery: 'Glenmorangie Distillery', region: 'Highlands', age: 10, abv: 40.0, msrp: 44.99, secondary: 47, rating: 7.9 },
    { name: 'Glenmorangie 18 Year', distillery: 'Glenmorangie Distillery', region: 'Highlands', age: 18, abv: 43.0, msrp: 119.99, secondary: 125, rating: 8.6 },
    { name: 'Monkey Shoulder', distillery: 'William Grant & Sons', region: 'Speyside', abv: 40.0, msrp: 34.99, secondary: 37, rating: 7.8 },
  ];

  // Irish whiskeys database
  const irishData = [
    { name: 'Redbreast 12 Year', distillery: 'Midleton Distillery', age: 12, abv: 40.0, msrp: 59.99, secondary: 62, rating: 8.7 },
    { name: 'Redbreast 15 Year', distillery: 'Midleton Distillery', age: 15, abv: 46.0, msrp: 99.99, secondary: 105, rating: 9.0 },
    { name: 'Redbreast 21 Year', distillery: 'Midleton Distillery', age: 21, abv: 46.0, msrp: 249.99, secondary: 280, rating: 9.2 },
    { name: 'Green Spot', distillery: 'Midleton Distillery', abv: 40.0, msrp: 49.99, secondary: 52, rating: 8.4 },
    { name: 'Yellow Spot 12 Year', distillery: 'Midleton Distillery', age: 12, abv: 46.0, msrp: 89.99, secondary: 95, rating: 8.7 },
    { name: 'Jameson Irish Whiskey', distillery: 'Midleton Distillery', abv: 40.0, msrp: 29.99, secondary: 32, rating: 7.5 },
    { name: 'Jameson Black Barrel', distillery: 'Midleton Distillery', abv: 40.0, msrp: 39.99, secondary: 42, rating: 8.0 },
    { name: 'Powers Gold Label', distillery: 'Midleton Distillery', abv: 40.0, msrp: 34.99, secondary: 37, rating: 7.8 },
    { name: 'Teeling Small Batch', distillery: 'Teeling Whiskey Company', abv: 46.0, msrp: 39.99, secondary: 42, rating: 8.2 },
    { name: 'Writers Tears Copper Pot', distillery: 'Walsh Whiskey', abv: 40.0, msrp: 44.99, secondary: 47, rating: 8.3 },
  ];

  // Japanese whiskeys database
  const japaneseData = [
    { name: 'Yamazaki 12 Year', distillery: 'Yamazaki Distillery', age: 12, abv: 43.0, msrp: 125.99, secondary: 250, rating: 9.0 },
    { name: 'Yamazaki 18 Year', distillery: 'Yamazaki Distillery', age: 18, abv: 43.0, msrp: 399.99, secondary: 800, rating: 9.5 },
    { name: 'Hibiki Harmony', distillery: 'Suntory', abv: 43.0, msrp: 89.99, secondary: 150, rating: 8.8 },
    { name: 'Hibiki 21 Year', distillery: 'Suntory', age: 21, abv: 43.0, msrp: 699.99, secondary: 1500, rating: 9.4 },
    { name: 'Hakushu 12 Year', distillery: 'Hakushu Distillery', age: 12, abv: 43.0, msrp: 125.99, secondary: 250, rating: 8.9 },
    { name: 'Nikka Coffey Grain', distillery: 'Nikka Whisky', abv: 45.0, msrp: 69.99, secondary: 85, rating: 8.4 },
    { name: 'Nikka From The Barrel', distillery: 'Nikka Whisky', abv: 51.4, msrp: 69.99, secondary: 85, rating: 8.6 },
    { name: 'Nikka Yoichi Single Malt', distillery: 'Yoichi Distillery', abv: 45.0, msrp: 79.99, secondary: 120, rating: 8.7 },
    { name: 'Mars Iwai Tradition', distillery: 'Mars Shinshu Distillery', abv: 40.0, msrp: 39.99, secondary: 45, rating: 7.9 },
    { name: 'Chichibu The Peated', distillery: 'Chichibu Distillery', abv: 55.5, msrp: 149.99, secondary: 300, rating: 9.1 },
  ];

  // Rye whiskeys database
  const ryeData = [
    { name: 'WhistlePig 10 Year', distillery: 'WhistlePig Farm', age: 10, abv: 50.0, msrp: 79.99, secondary: 85, rating: 8.8 },
    { name: 'WhistlePig 15 Year', distillery: 'WhistlePig Farm', age: 15, abv: 46.0, msrp: 299.99, secondary: 320, rating: 9.0 },
    { name: 'Sazerac Rye', distillery: 'Buffalo Trace Distillery', abv: 45.0, msrp: 29.99, secondary: 35, rating: 8.1 },
    { name: 'Rittenhouse Rye', distillery: 'Heaven Hill', abv: 50.0, msrp: 27.99, secondary: 32, rating: 8.0 },
    { name: 'High West Double Rye!', distillery: 'High West Distillery', abv: 46.0, msrp: 39.99, secondary: 42, rating: 8.3 },
    { name: 'Bulleit Rye', distillery: 'MGP', abv: 45.0, msrp: 29.99, secondary: 32, rating: 7.7 },
    { name: 'Old Overholt', distillery: 'Jim Beam', abv: 40.0, msrp: 19.99, secondary: 22, rating: 7.2 },
    { name: 'Pikesville Rye', distillery: 'Heaven Hill', abv: 55.0, msrp: 49.99, secondary: 60, rating: 8.6 },
    { name: 'Knob Creek Rye', distillery: 'Jim Beam', abv: 50.0, msrp: 39.99, secondary: 42, rating: 8.2 },
    { name: 'Michter\'s US*1 Rye', distillery: 'Michter\'s Distillery', abv: 42.4, msrp: 44.99, secondary: 50, rating: 8.4 },
  ];

  // Tennessee whiskeys database
  const tennesseeData = [
    { name: 'Jack Daniel\'s Old No. 7', distillery: 'Jack Daniel Distillery', abv: 40.0, msrp: 27.99, secondary: 30, rating: 7.3 },
    { name: 'Jack Daniel\'s Single Barrel', distillery: 'Jack Daniel Distillery', abv: 47.0, msrp: 49.99, secondary: 52, rating: 8.2 },
    { name: 'Jack Daniel\'s Sinatra Select', distillery: 'Jack Daniel Distillery', abv: 45.0, msrp: 159.99, secondary: 175, rating: 8.6 },
    { name: 'George Dickel 12 Year', distillery: 'George Dickel Distillery', age: 12, abv: 45.0, msrp: 32.99, secondary: 35, rating: 7.9 },
    { name: 'George Dickel Bottled in Bond', distillery: 'George Dickel Distillery', abv: 50.0, msrp: 39.99, secondary: 42, rating: 8.3 },
  ];

  // Create collections for each user
  let totalWhiskeys = 0;

  // Bourbon Lover - 25-30 bourbon-focused bottles
  console.log('Creating bourbon_lover collection...');
  const bourbonCount = randomInt(25, 30);
  for (let i = 0; i < bourbonCount; i++) {
    const bourbon = randomPick(bourbonData);
    const purchaseDate = randomDate(2020, 2024);
    const isOpened = Math.random() > 0.4;
    const dateOpened = isOpened ? randomDate(parseInt(purchaseDate.split('-')[0]), 2024) : null;

    WhiskeyModel.create({
      name: bourbon.name,
      type: WhiskeyType.BOURBON,
      distillery: bourbon.distillery,
      region: 'Kentucky',
      age: bourbon.age,
      abv: bourbon.abv,
      description: `Premium ${bourbon.name}`,
      tasting_notes: 'Rich caramel, vanilla, and oak notes',
      nose_notes: 'Caramel, vanilla, oak',
      palate_notes: 'Sweet corn, caramel, oak, spice',
      finish_notes: 'Long, warm finish',
      rating: bourbon.rating + (Math.random() - 0.5) * 0.4,
      size: '750ml',
      quantity: 1,
      msrp: bourbon.msrp,
      secondary_price: bourbon.secondary,
      purchase_date: purchaseDate,
      purchase_price: bourbon.msrp * (0.9 + Math.random() * 0.4),
      purchase_location: randomPick(['Total Wine', 'ABC Store', 'Local Shop', 'Online', 'Distillery']),
      is_opened: isOpened ? 1 : 0,
      date_opened: dateOpened,
      remaining_volume: isOpened ? randomInt(300, 700) : 750,
      storage_location: randomPick(['Home Bar', 'Display Shelf', 'Cabinet', 'Climate Cabinet']),
      status: 'in_collection',
      country: 'USA',
      proof: bourbon.abv * 2,
      current_market_value: bourbon.secondary,
      created_by: bourbonCollector.id,
    });
  }
  totalWhiskeys += bourbonCount;
  console.log(`✓ Created ${bourbonCount} whiskeys for bourbon_lover\n`);

  // Scotch Fan - 30-35 scotch-focused bottles
  console.log('Creating scotch_fan collection...');
  const scotchCount = randomInt(30, 35);
  for (let i = 0; i < scotchCount; i++) {
    const scotch = randomPick(scotchData);
    const purchaseDate = randomDate(2019, 2024);
    const isOpened = Math.random() > 0.35;
    const dateOpened = isOpened ? randomDate(parseInt(purchaseDate.split('-')[0]), 2024) : null;

    WhiskeyModel.create({
      name: scotch.name,
      type: WhiskeyType.SCOTCH,
      distillery: scotch.distillery,
      region: scotch.region,
      age: scotch.age,
      abv: scotch.abv,
      description: `Single malt Scotch from ${scotch.region}`,
      tasting_notes: scotch.region === 'Islay' ? 'Peaty, smoky, maritime' : 'Fruity, smooth, complex',
      nose_notes: scotch.region === 'Islay' ? 'Peat smoke, iodine, sea salt' : 'Fruit, vanilla, honey',
      palate_notes: scotch.region === 'Islay' ? 'Peat, smoke, brine' : 'Malt, fruit, oak',
      finish_notes: 'Long, elegant finish',
      rating: scotch.rating + (Math.random() - 0.5) * 0.4,
      size: '700ml',
      quantity: 1,
      msrp: scotch.msrp,
      secondary_price: scotch.secondary,
      purchase_date: purchaseDate,
      purchase_price: scotch.msrp * (0.85 + Math.random() * 0.5),
      purchase_location: randomPick(['Duty Free', 'UK Import', 'Specialty Store', 'Online', 'Scotland Direct']),
      is_opened: isOpened ? 1 : 0,
      date_opened: dateOpened,
      remaining_volume: isOpened ? randomInt(300, 650) : 700,
      storage_location: randomPick(['Display Shelf', 'Cabinet', 'Climate Cabinet', 'Whisky Room']),
      status: 'in_collection',
      country: 'Scotland',
      proof: scotch.abv * 1.75,
      current_market_value: scotch.secondary,
      chill_filtered: 0,
      natural_color: 1,
      created_by: scotchEnthusiast.id,
    });
  }
  totalWhiskeys += scotchCount;
  console.log(`✓ Created ${scotchCount} whiskeys for scotch_fan\n`);

  // Curator - 35-40 diverse high-end bottles
  console.log('Creating curator collection...');
  const curatorCount = randomInt(35, 40);
  const allTypes = [...bourbonData, ...scotchData, ...japaneseData, ...irishData, ...ryeData];
  for (let i = 0; i < curatorCount; i++) {
    const whiskey = randomPick(allTypes);
    const purchaseDate = randomDate(2018, 2024);
    const isOpened = Math.random() > 0.6;
    const dateOpened = isOpened ? randomDate(parseInt(purchaseDate.split('-')[0]), 2024) : null;

    let type = WhiskeyType.BOURBON;
    let country = 'USA';
    if (scotchData.includes(whiskey)) { type = WhiskeyType.SCOTCH; country = 'Scotland'; }
    if (japaneseData.includes(whiskey)) { type = WhiskeyType.JAPANESE; country = 'Japan'; }
    if (irishData.includes(whiskey)) { type = WhiskeyType.IRISH; country = 'Ireland'; }
    if (ryeData.includes(whiskey)) { type = WhiskeyType.RYE; country = 'USA'; }

    WhiskeyModel.create({
      name: whiskey.name,
      type: type,
      distillery: whiskey.distillery,
      region: (whiskey as any).region || '',
      age: whiskey.age,
      abv: whiskey.abv,
      description: `Premium ${type} whiskey`,
      tasting_notes: 'Complex and refined',
      rating: whiskey.rating + (Math.random() - 0.5) * 0.3,
      size: country === 'Scotland' ? '700ml' : '750ml',
      quantity: 1,
      msrp: whiskey.msrp,
      secondary_price: whiskey.secondary,
      purchase_date: purchaseDate,
      purchase_price: whiskey.msrp * (0.9 + Math.random() * 0.3),
      purchase_location: randomPick(['Auction', 'Private Sale', 'Specialty Store', 'International', 'Distillery Direct']),
      is_opened: isOpened ? 1 : 0,
      date_opened: dateOpened,
      remaining_volume: isOpened ? randomInt(400, 700) : (country === 'Scotland' ? 700 : 750),
      storage_location: 'Climate Cabinet',
      status: 'in_collection',
      country: country,
      current_market_value: whiskey.secondary,
      is_investment_bottle: whiskey.msrp > 150 ? 1 : 0,
      created_by: whiskeyCurator.id,
    });
  }
  totalWhiskeys += curatorCount;
  console.log(`✓ Created ${curatorCount} whiskeys for curator\n`);

  // Beginner - 10-15 entry-level bottles
  console.log('Creating beginner collection...');
  const beginnerCount = randomInt(10, 15);
  const entryLevel = [
    ...bourbonData.filter(b => b.msrp < 50),
    ...scotchData.filter(s => s.msrp < 60),
    ...irishData.filter(i => i.msrp < 50),
    ...japaneseData.filter(j => j.msrp < 80),
  ];

  for (let i = 0; i < beginnerCount; i++) {
    const whiskey = randomPick(entryLevel);
    const purchaseDate = randomDate(2023, 2024);
    const isOpened = Math.random() > 0.3;
    const dateOpened = isOpened ? randomDate(parseInt(purchaseDate.split('-')[0]), 2024) : null;

    let type = WhiskeyType.BOURBON;
    let country = 'USA';
    if (scotchData.includes(whiskey)) { type = WhiskeyType.SCOTCH; country = 'Scotland'; }
    if (japaneseData.includes(whiskey)) { type = WhiskeyType.JAPANESE; country = 'Japan'; }
    if (irishData.includes(whiskey)) { type = WhiskeyType.IRISH; country = 'Ireland'; }

    WhiskeyModel.create({
      name: whiskey.name,
      type: type,
      distillery: whiskey.distillery,
      region: (whiskey as any).region || '',
      age: whiskey.age,
      abv: whiskey.abv,
      description: `Great introduction to ${type}`,
      tasting_notes: 'Smooth and approachable',
      rating: whiskey.rating + (Math.random() - 0.5) * 0.5,
      size: country === 'Scotland' ? '700ml' : '750ml',
      quantity: 1,
      msrp: whiskey.msrp,
      purchase_date: purchaseDate,
      purchase_price: whiskey.msrp * (0.95 + Math.random() * 0.15),
      purchase_location: randomPick(['Grocery Store', 'Total Wine', 'ABC Store', 'Local Shop']),
      is_opened: isOpened ? 1 : 0,
      date_opened: dateOpened,
      remaining_volume: isOpened ? randomInt(400, 700) : (country === 'Scotland' ? 700 : 750),
      storage_location: 'Kitchen Cabinet',
      status: 'in_collection',
      country: country,
      current_market_value: whiskey.secondary || whiskey.msrp * 1.1,
      created_by: newCollector.id,
    });
  }
  totalWhiskeys += beginnerCount;
  console.log(`✓ Created ${beginnerCount} whiskeys for beginner\n`);

  // Investor - 20-25 rare investment bottles
  console.log('Creating investor collection...');
  const investorCount = randomInt(20, 25);
  const investmentGrade = [
    ...bourbonData.filter(b => b.msrp > 100 || b.secondary > 200),
    ...scotchData.filter(s => s.msrp > 150 || s.secondary > 200),
    ...japaneseData.filter(j => j.msrp > 100),
  ];

  for (let i = 0; i < investorCount; i++) {
    const whiskey = randomPick(investmentGrade);
    const purchaseDate = randomDate(2018, 2023);

    let type = WhiskeyType.BOURBON;
    let country = 'USA';
    if (scotchData.includes(whiskey)) { type = WhiskeyType.SCOTCH; country = 'Scotland'; }
    if (japaneseData.includes(whiskey)) { type = WhiskeyType.JAPANESE; country = 'Japan'; }

    WhiskeyModel.create({
      name: whiskey.name,
      type: type,
      distillery: whiskey.distillery,
      region: (whiskey as any).region || '',
      age: whiskey.age,
      abv: whiskey.abv,
      description: `Investment-grade ${type}`,
      tasting_notes: 'Exceptional quality and rarity',
      rating: whiskey.rating + (Math.random() - 0.5) * 0.2,
      size: country === 'Scotland' ? '700ml' : '750ml',
      quantity: randomInt(1, 3),
      msrp: whiskey.msrp,
      secondary_price: whiskey.secondary,
      purchase_date: purchaseDate,
      purchase_price: whiskey.msrp * (0.8 + Math.random() * 0.5),
      purchase_location: randomPick(['Auction', 'Private Sale', 'Investment Dealer', 'International']),
      is_opened: 0,
      storage_location: randomPick(['Bank Vault', 'Climate Cabinet', 'Safe']),
      status: 'in_collection',
      country: country,
      current_market_value: whiskey.secondary,
      is_investment_bottle: 1,
      limited_edition: 1,
      created_by: investor.id,
    });
  }
  totalWhiskeys += investorCount;
  console.log(`✓ Created ${investorCount} whiskeys for investor\n`);

  // Admin - 15-20 personal favorites
  console.log('Creating admin collection...');
  const adminCount = randomInt(15, 20);
  const adminFavorites = [...bourbonData.slice(0, 10), ...scotchData.slice(0, 10), ...japaneseData];

  for (let i = 0; i < adminCount; i++) {
    const whiskey = randomPick(adminFavorites);
    const purchaseDate = randomDate(2020, 2024);
    const isOpened = Math.random() > 0.5;
    const dateOpened = isOpened ? randomDate(parseInt(purchaseDate.split('-')[0]), 2024) : null;

    let type = WhiskeyType.BOURBON;
    let country = 'USA';
    if (scotchData.includes(whiskey)) { type = WhiskeyType.SCOTCH; country = 'Scotland'; }
    if (japaneseData.includes(whiskey)) { type = WhiskeyType.JAPANESE; country = 'Japan'; }

    WhiskeyModel.create({
      name: whiskey.name,
      type: type,
      distillery: whiskey.distillery,
      region: (whiskey as any).region || '',
      age: whiskey.age,
      abv: whiskey.abv,
      description: `Personal favorite ${type}`,
      tasting_notes: 'Personally selected for quality',
      rating: whiskey.rating + (Math.random() - 0.5) * 0.4,
      size: country === 'Scotland' ? '700ml' : '750ml',
      quantity: 1,
      msrp: whiskey.msrp,
      purchase_date: purchaseDate,
      purchase_price: whiskey.msrp,
      purchase_location: randomPick(['Online', 'Local Shop', 'Distillery', 'Specialty Store']),
      is_opened: isOpened ? 1 : 0,
      date_opened: dateOpened,
      remaining_volume: isOpened ? randomInt(300, 700) : (country === 'Scotland' ? 700 : 750),
      storage_location: 'Office Bar',
      status: 'in_collection',
      country: country,
      current_market_value: whiskey.secondary || whiskey.msrp * 1.15,
      created_by: admin.id,
    });
  }
  totalWhiskeys += adminCount;
  console.log(`✓ Created ${adminCount} whiskeys for admin\n`);

  // Summary
  console.log('📊 Demo Seed Summary:');
  console.log('====================');
  console.log('Users created: 6\n');
  console.log(`👤 bourbon_lover (James Anderson) - ${bourbonCount} whiskeys`);
  console.log(`👤 scotch_fan (Margaret Campbell) - ${scotchCount} whiskeys`);
  console.log(`👤 curator (Robert MacLeod) - ${curatorCount} whiskeys`);
  console.log(`👤 beginner (Sarah Johnson) - ${beginnerCount} whiskeys`);
  console.log(`👤 investor (Michael Chen) - ${investorCount} whiskeys`);
  console.log(`👤 admin (Admin User) - ${adminCount} whiskeys`);
  console.log(`\nTotal whiskeys: ${totalWhiskeys}`);
  console.log(`\n✅ Demo database seeded successfully!`);
  console.log('\nDemo Login Credentials:');
  console.log('=======================');
  console.log('bourbon_lover / demo123');
  console.log('scotch_fan / demo123');
  console.log('curator / demo123');
  console.log('beginner / demo123');
  console.log('investor / demo123');
  console.log('admin / admin123');
  console.log('\nSeed completed. Exiting...');
  process.exit(0);
}

seedDemoData().catch((error) => {
  console.error('Error seeding demo data:', error);
  process.exit(1);
});
