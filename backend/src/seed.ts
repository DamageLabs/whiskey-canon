import { db } from './utils/database';
import { UserModel } from './models/User';
import { Role } from './types';

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Clear existing data
    console.log('Clearing existing data...');
    db.exec('DELETE FROM whiskeys');
    db.exec('DELETE FROM users');
    console.log('✓ Cleared existing data\n');

    // Create users
    console.log('Creating users...');
    const admin = await UserModel.create(
      'admin',
      'admin@whiskeycanon.com',
      'Wh1sk3yTest!!',
      Role.ADMIN,
      'Admin',
      'User'
    );

    const editor = await UserModel.create(
      'collector',
      'collector@whiskeycanon.com',
      'Wh1sk3yTest!!',
      Role.EDITOR,
      'John',
      'Collector'
    );

    const viewer = await UserModel.create(
      'enthusiast',
      'enthusiast@whiskeycanon.com',
      'Wh1sk3yTest!!',
      Role.VIEWER,
      'Sarah',
      'Enthusiast'
    );

    console.log(`✓ Created ${3} users\n`);

    // Sample whiskey data
    console.log('Creating whiskeys...');
    const whiskeys = [
      // Premium Bourbons
      {
        name: "Pappy Van Winkle's Family Reserve 15 Year",
        type: 'bourbon',
        distillery: 'Buffalo Trace Distillery',
        region: 'Kentucky',
        country: 'USA',
        age: 15,
        abv: 53.5,
        proof: 107,
        size: '750ml',
        quantity: 1,
        msrp: 119.99,
        secondary_price: 1800.00,
        purchase_price: 1500.00,
        current_market_value: 1800.00,
        purchase_date: '2023-01-15',
        purchase_location: 'Bourbon Heaven',
        description: 'One of the most sought-after bourbons in the world',
        rating: 9.5,
        is_opened: false,
        status: 'in_collection',
        limited_edition: true,
        is_investment_bottle: true,
        natural_color: true,
        chill_filtered: false,
        tasting_notes: 'Rich caramel, vanilla, and oak with a long smooth finish',
        nose_notes: 'Caramel, vanilla, dried fruit',
        palate_notes: 'Sweet oak, butterscotch, hint of spice',
        finish_notes: 'Long, smooth, lingering sweetness',
        times_tasted: 0,
        created_by: admin.id
      },
      {
        name: "Blanton's Single Barrel",
        type: 'bourbon',
        distillery: 'Buffalo Trace Distillery',
        region: 'Kentucky',
        country: 'USA',
        abv: 46.5,
        proof: 93,
        size: '750ml',
        quantity: 2,
        msrp: 59.99,
        secondary_price: 120.00,
        purchase_price: 65.00,
        current_market_value: 120.00,
        purchase_date: '2023-06-20',
        purchase_location: 'Local Liquor Store',
        description: 'Single barrel bourbon with a distinctive bottle',
        rating: 8.5,
        is_opened: true,
        date_opened: '2023-08-01',
        remaining_volume: 60,
        status: 'in_collection',
        barrel_number: 'Barrel 5-123',
        tasting_notes: 'Citrus, honey, and caramel notes',
        times_tasted: 4,
        last_tasted_date: '2024-11-01',
        food_pairings: 'Dark chocolate, grilled steak',
        created_by: admin.id
      },
      {
        name: 'Buffalo Trace',
        type: 'bourbon',
        distillery: 'Buffalo Trace Distillery',
        region: 'Kentucky',
        country: 'USA',
        abv: 45,
        proof: 90,
        size: '750ml',
        quantity: 3,
        msrp: 29.99,
        secondary_price: 35.00,
        purchase_price: 25.99,
        current_market_value: 35.00,
        purchase_date: '2024-01-10',
        purchase_location: 'Total Wine',
        description: 'Classic Kentucky straight bourbon',
        rating: 8.0,
        is_opened: true,
        date_opened: '2024-01-15',
        remaining_volume: 85,
        status: 'in_collection',
        tasting_notes: 'Vanilla, caramel, and subtle spice',
        times_tasted: 8,
        last_tasted_date: '2024-11-10',
        created_by: editor.id
      },
      {
        name: 'Eagle Rare 10 Year',
        type: 'bourbon',
        distillery: 'Buffalo Trace Distillery',
        region: 'Kentucky',
        country: 'USA',
        age: 10,
        abv: 45,
        proof: 90,
        size: '750ml',
        quantity: 1,
        msrp: 35.99,
        secondary_price: 60.00,
        purchase_price: 40.00,
        current_market_value: 60.00,
        purchase_date: '2024-03-15',
        description: 'Aged longer than most bourbons',
        rating: 8.3,
        is_opened: true,
        date_opened: '2024-04-01',
        remaining_volume: 45,
        status: 'in_collection',
        times_tasted: 6,
        created_by: admin.id
      },
      {
        name: 'Elijah Craig Small Batch',
        type: 'bourbon',
        distillery: 'Heaven Hill Distillery',
        region: 'Kentucky',
        country: 'USA',
        abv: 47,
        proof: 94,
        size: '750ml',
        quantity: 2,
        msrp: 32.99,
        purchase_price: 30.00,
        current_market_value: 35.00,
        purchase_date: '2024-05-01',
        rating: 7.8,
        is_opened: true,
        date_opened: '2024-05-10',
        remaining_volume: 70,
        status: 'in_collection',
        times_tasted: 5,
        created_by: editor.id
      },

      // Scotch Whiskies
      {
        name: 'Glenfiddich 12 Year',
        type: 'scotch',
        distillery: 'Glenfiddich Distillery',
        region: 'Speyside',
        country: 'Scotland',
        age: 12,
        abv: 40,
        proof: 80,
        size: '750ml',
        quantity: 2,
        msrp: 49.99,
        purchase_price: 45.00,
        current_market_value: 50.00,
        purchase_date: '2024-02-14',
        description: 'Classic Speyside single malt',
        rating: 8.2,
        is_opened: true,
        date_opened: '2024-03-01',
        remaining_volume: 55,
        status: 'in_collection',
        tasting_notes: 'Pear, apple, subtle oak',
        times_tasted: 7,
        created_by: admin.id
      },
      {
        name: 'Ardbeg 10 Year',
        type: 'scotch',
        distillery: 'Ardbeg Distillery',
        region: 'Islay',
        country: 'Scotland',
        age: 10,
        abv: 46,
        proof: 92,
        size: '750ml',
        quantity: 1,
        msrp: 59.99,
        purchase_price: 55.00,
        current_market_value: 65.00,
        purchase_date: '2023-12-01',
        description: 'Heavily peated Islay single malt',
        rating: 9.0,
        is_opened: true,
        date_opened: '2023-12-25',
        remaining_volume: 40,
        status: 'in_collection',
        tasting_notes: 'Intense smoke, iodine, citrus',
        nose_notes: 'Peat smoke, seaweed, lemon',
        palate_notes: 'Powerful smoke, sweet malt, espresso',
        finish_notes: 'Long, smoky, slightly sweet',
        times_tasted: 10,
        last_tasted_date: '2024-11-05',
        chill_filtered: false,
        natural_color: true,
        created_by: admin.id
      },
      {
        name: 'Macallan 18 Year Sherry Oak',
        type: 'scotch',
        distillery: 'Macallan Distillery',
        region: 'Speyside',
        country: 'Scotland',
        age: 18,
        abv: 43,
        proof: 86,
        size: '750ml',
        quantity: 1,
        msrp: 349.99,
        secondary_price: 450.00,
        purchase_price: 340.00,
        current_market_value: 450.00,
        purchase_date: '2023-11-20',
        description: 'Luxury sherry cask matured single malt',
        rating: 9.3,
        is_opened: false,
        status: 'in_collection',
        limited_edition: false,
        is_investment_bottle: true,
        cask_type: 'Sherry',
        awards: 'Multiple Gold Medals',
        created_by: admin.id
      },
      {
        name: 'Lagavulin 16 Year',
        type: 'scotch',
        distillery: 'Lagavulin Distillery',
        region: 'Islay',
        country: 'Scotland',
        age: 16,
        abv: 43,
        proof: 86,
        size: '750ml',
        quantity: 1,
        msrp: 89.99,
        purchase_price: 85.00,
        current_market_value: 95.00,
        purchase_date: '2024-04-20',
        description: 'Iconic peated Islay single malt',
        rating: 9.1,
        is_opened: true,
        date_opened: '2024-05-01',
        remaining_volume: 75,
        status: 'in_collection',
        times_tasted: 4,
        created_by: admin.id
      },

      // Irish Whiskeys
      {
        name: 'Redbreast 12 Year',
        type: 'irish',
        distillery: 'Midleton Distillery',
        region: 'Cork',
        country: 'Ireland',
        age: 12,
        abv: 40,
        proof: 80,
        size: '750ml',
        quantity: 1,
        msrp: 69.99,
        purchase_price: 65.00,
        current_market_value: 70.00,
        purchase_date: '2024-06-15',
        description: 'Single pot still Irish whiskey',
        rating: 8.7,
        is_opened: true,
        date_opened: '2024-07-01',
        remaining_volume: 65,
        status: 'in_collection',
        times_tasted: 5,
        created_by: editor.id
      },
      {
        name: 'Green Spot',
        type: 'irish',
        distillery: 'Midleton Distillery',
        region: 'Cork',
        country: 'Ireland',
        age: 8,
        abv: 40,
        proof: 80,
        size: '750ml',
        quantity: 1,
        msrp: 59.99,
        purchase_price: 55.00,
        current_market_value: 60.00,
        purchase_date: '2024-08-01',
        description: 'Single pot still Irish whiskey',
        rating: 8.4,
        is_opened: true,
        date_opened: '2024-09-01',
        remaining_volume: 80,
        status: 'in_collection',
        times_tasted: 3,
        created_by: editor.id
      },
      {
        name: 'Jameson Irish Whiskey',
        type: 'irish',
        distillery: 'Midleton Distillery',
        region: 'Cork',
        country: 'Ireland',
        age: 4,
        abv: 40,
        proof: 80,
        size: '750ml',
        quantity: 2,
        msrp: 29.99,
        purchase_price: 25.00,
        current_market_value: 30.00,
        purchase_date: '2024-09-15',
        description: 'Classic Irish blended whiskey',
        rating: 7.5,
        is_opened: true,
        date_opened: '2024-10-01',
        remaining_volume: 90,
        status: 'in_collection',
        times_tasted: 6,
        created_by: viewer.id
      },

      // Japanese Whisky
      {
        name: 'Yamazaki 12 Year',
        type: 'japanese',
        distillery: 'Yamazaki Distillery',
        region: 'Osaka',
        country: 'Japan',
        age: 12,
        abv: 43,
        proof: 86,
        size: '700ml',
        quantity: 1,
        msrp: 124.99,
        secondary_price: 250.00,
        purchase_price: 200.00,
        current_market_value: 250.00,
        purchase_date: '2023-10-10',
        description: 'Pioneering Japanese single malt',
        rating: 9.2,
        is_opened: false,
        status: 'in_collection',
        is_investment_bottle: true,
        awards: 'World Whisky of the Year 2013',
        created_by: admin.id
      },
      {
        name: 'Hibiki Harmony',
        type: 'japanese',
        distillery: 'Suntory',
        region: 'Various',
        country: 'Japan',
        abv: 43,
        proof: 86,
        size: '700ml',
        quantity: 1,
        msrp: 89.99,
        secondary_price: 150.00,
        purchase_price: 130.00,
        current_market_value: 150.00,
        purchase_date: '2024-02-28',
        description: 'Blended Japanese whisky',
        rating: 8.8,
        is_opened: true,
        date_opened: '2024-03-15',
        remaining_volume: 70,
        status: 'in_collection',
        times_tasted: 4,
        created_by: admin.id
      },
      {
        name: 'Nikka From The Barrel',
        type: 'japanese',
        distillery: 'Nikka',
        region: 'Various',
        country: 'Japan',
        abv: 51.4,
        proof: 102.8,
        size: '500ml',
        quantity: 2,
        msrp: 69.99,
        purchase_price: 65.00,
        current_market_value: 75.00,
        purchase_date: '2024-07-20',
        description: 'Blended whisky bottled at cask strength',
        rating: 8.6,
        is_opened: true,
        date_opened: '2024-08-01',
        remaining_volume: 55,
        status: 'in_collection',
        times_tasted: 5,
        created_by: editor.id
      },

      // Rye Whiskeys
      {
        name: 'WhistlePig 10 Year',
        type: 'rye',
        distillery: 'WhistlePig Farm',
        region: 'Vermont',
        country: 'USA',
        age: 10,
        abv: 50,
        proof: 100,
        size: '750ml',
        quantity: 1,
        msrp: 84.99,
        purchase_price: 80.00,
        current_market_value: 90.00,
        purchase_date: '2024-05-10',
        description: 'Straight rye whiskey aged 10 years',
        rating: 8.9,
        is_opened: true,
        date_opened: '2024-06-01',
        remaining_volume: 50,
        status: 'in_collection',
        times_tasted: 7,
        created_by: admin.id
      },
      {
        name: 'Rittenhouse Rye',
        type: 'rye',
        distillery: 'Heaven Hill Distillery',
        region: 'Kentucky',
        country: 'USA',
        abv: 50,
        proof: 100,
        size: '750ml',
        quantity: 1,
        msrp: 29.99,
        purchase_price: 27.00,
        current_market_value: 30.00,
        purchase_date: '2024-08-15',
        description: 'Bottled-in-bond rye whiskey',
        rating: 8.1,
        is_opened: true,
        date_opened: '2024-09-01',
        remaining_volume: 65,
        status: 'in_collection',
        times_tasted: 4,
        created_by: editor.id
      },

      // Tennessee Whiskey
      {
        name: "Jack Daniel's Single Barrel",
        type: 'tennessee',
        distillery: 'Jack Daniel Distillery',
        region: 'Tennessee',
        country: 'USA',
        abv: 47,
        proof: 94,
        size: '750ml',
        quantity: 1,
        msrp: 49.99,
        purchase_price: 45.00,
        current_market_value: 50.00,
        purchase_date: '2024-10-01',
        description: 'Single barrel Tennessee whiskey',
        rating: 8.0,
        is_opened: true,
        date_opened: '2024-10-15',
        remaining_volume: 85,
        status: 'in_collection',
        barrel_number: 'Barrel 24-1234',
        times_tasted: 2,
        created_by: editor.id
      },

      // Some consumed bottles for statistics
      {
        name: 'Woodford Reserve',
        type: 'bourbon',
        distillery: 'Woodford Reserve Distillery',
        region: 'Kentucky',
        country: 'USA',
        age: 7,
        abv: 45.2,
        proof: 90.4,
        size: '750ml',
        quantity: 1,
        msrp: 36.99,
        purchase_price: 32.00,
        purchase_date: '2023-08-01',
        rating: 8.3,
        status: 'consumed',
        times_tasted: 12,
        tasting_notes: 'Full-bodied with notes of dried fruit and vanilla',
        created_by: admin.id
      },
      {
        name: 'Maker\'s Mark',
        type: 'bourbon',
        distillery: 'Maker\'s Mark Distillery',
        region: 'Kentucky',
        country: 'USA',
        age: 6,
        abv: 45,
        proof: 90,
        size: '750ml',
        quantity: 1,
        msrp: 29.99,
        purchase_price: 26.00,
        purchase_date: '2023-05-15',
        rating: 7.8,
        status: 'consumed',
        times_tasted: 10,
        created_by: editor.id
      },

      // Bottles for sale
      {
        name: 'Glenfiddich 18 Year',
        type: 'scotch',
        distillery: 'Glenfiddich Distillery',
        region: 'Speyside',
        country: 'Scotland',
        age: 18,
        abv: 40,
        proof: 80,
        size: '750ml',
        quantity: 1,
        msrp: 119.99,
        purchase_price: 110.00,
        current_market_value: 130.00,
        purchase_date: '2023-03-10',
        rating: 8.9,
        is_opened: false,
        status: 'in_collection',
        is_for_sale: true,
        asking_price: 125.00,
        created_by: admin.id
      },
    ];

    const stmt = db.prepare(`
      INSERT INTO whiskeys (
        name, type, distillery, region, country, age, abv, proof, size, quantity,
        msrp, secondary_price, purchase_price, current_market_value,
        purchase_date, purchase_location, description, rating,
        is_opened, date_opened, remaining_volume, status,
        barrel_number, limited_edition, is_investment_bottle,
        natural_color, chill_filtered, tasting_notes, nose_notes,
        palate_notes, finish_notes, times_tasted, last_tasted_date,
        food_pairings, cask_type, awards, is_for_sale, asking_price,
        created_by, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);

    for (const whiskey of whiskeys) {
      stmt.run(
        whiskey.name,
        whiskey.type,
        whiskey.distillery,
        whiskey.region || null,
        whiskey.country || null,
        whiskey.age || null,
        whiskey.abv || null,
        whiskey.proof || null,
        whiskey.size || null,
        whiskey.quantity || null,
        whiskey.msrp || null,
        whiskey.secondary_price || null,
        whiskey.purchase_price || null,
        whiskey.current_market_value || null,
        whiskey.purchase_date || null,
        whiskey.purchase_location || null,
        whiskey.description || null,
        whiskey.rating || null,
        whiskey.is_opened ? 1 : 0,
        whiskey.date_opened || null,
        whiskey.remaining_volume || null,
        whiskey.status || 'in_collection',
        whiskey.barrel_number || null,
        whiskey.limited_edition ? 1 : 0,
        whiskey.is_investment_bottle ? 1 : 0,
        whiskey.natural_color ? 1 : 0,
        whiskey.chill_filtered ? 1 : 0,
        whiskey.tasting_notes || null,
        whiskey.nose_notes || null,
        whiskey.palate_notes || null,
        whiskey.finish_notes || null,
        whiskey.times_tasted || 0,
        whiskey.last_tasted_date || null,
        whiskey.food_pairings || null,
        whiskey.cask_type || null,
        whiskey.awards || null,
        whiskey.is_for_sale ? 1 : 0,
        whiskey.asking_price || null,
        whiskey.created_by
      );
    }

    console.log(`✓ Created ${whiskeys.length} whiskeys\n`);

    // Print summary
    console.log('📊 Seed Summary:');
    console.log('================');
    console.log(`Users created: 3`);
    console.log(`  - Admin: admin / Wh1sk3yTest!!`);
    console.log(`  - Editor: collector / Wh1sk3yTest!!`);
    console.log(`  - Viewer: enthusiast / Wh1sk3yTest!!`);
    console.log(`\nWhiskeys created: ${whiskeys.length}`);

    const typeCount = whiskeys.reduce((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\nBy Type:`);
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });

    const statusCount = whiskeys.reduce((acc, w) => {
      acc[w.status || 'in_collection'] = (acc[w.status || 'in_collection'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\nBy Status:`);
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    const openedCount = whiskeys.filter(w => w.is_opened).length;
    const unopenedCount = whiskeys.filter(w => !w.is_opened).length;

    console.log(`\nOpened: ${openedCount}`);
    console.log(`Unopened: ${unopenedCount}`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nYou can now login with:');
    console.log('  Username: admin');
    console.log('  Password: Wh1sk3yTest!!\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed completed. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seed };
