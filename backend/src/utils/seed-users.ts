import { initializeDatabase } from './database';
import { UserModel } from '../models/User';
import { WhiskeyModel } from '../models/Whiskey';
import { Role, WhiskeyType } from '../types';

async function seedUsers() {
  console.log('Seeding database with test users and their collections...');

  initializeDatabase();

  // Define test users
  const testUsers = [
    {
      username: 'alice_admin',
      email: 'alice@whiskey-canon.com',
      password: 'Admin123!',
      role: Role.ADMIN
    },
    {
      username: 'bob_editor',
      email: 'bob@whiskey-canon.com',
      password: 'Editor123!',
      role: Role.EDITOR
    },
    {
      username: 'charlie_viewer',
      email: 'charlie@whiskey-canon.com',
      password: 'Viewer123!',
      role: Role.VIEWER
    },
    {
      username: 'diana_editor',
      email: 'diana@whiskey-canon.com',
      password: 'Editor456!',
      role: Role.EDITOR
    }
  ];

  // Whiskey data pool to randomly assign to users
  const whiskeyPool = [
    // Bourbons
    {
      name: "Buffalo Trace",
      type: WhiskeyType.BOURBON,
      distillery: "Buffalo Trace Distillery",
      region: "Kentucky",
      age: undefined,
      abv: 45,
      size: "750ml",
      description: "A smooth, complex bourbon with notes of vanilla, toffee, and candied fruit.",
      tasting_notes: "Sweet vanilla and caramel on the nose, followed by brown sugar, dark fruit, and oak.",
      rating: 8.5
    },
    {
      name: "Maker's Mark",
      type: WhiskeyType.BOURBON,
      distillery: "Maker's Mark Distillery",
      region: "Kentucky",
      age: undefined,
      abv: 45,
      size: "750ml",
      description: "A wheated bourbon known for its smooth, approachable character.",
      tasting_notes: "Sweet caramel and vanilla with wheat bread and butterscotch.",
      rating: 8.0
    },
    {
      name: "Woodford Reserve",
      type: WhiskeyType.BOURBON,
      distillery: "Woodford Reserve Distillery",
      region: "Kentucky",
      age: undefined,
      abv: 43.2,
      size: "750ml",
      description: "A premium small-batch bourbon with a rich, full-bodied flavor.",
      tasting_notes: "Complex notes of dried fruit, vanilla, and sweet aromatics.",
      rating: 8.7
    },
    {
      name: "Wild Turkey 101",
      type: WhiskeyType.BOURBON,
      distillery: "Wild Turkey Distillery",
      region: "Kentucky",
      age: undefined,
      abv: 50.5,
      size: "750ml",
      description: "A bold, high-proof bourbon that's been a favorite for decades.",
      tasting_notes: "Caramel, vanilla, and baking spices with notes of cherry.",
      rating: 8.6
    },
    // Scotches
    {
      name: "Glenfiddich 12 Year",
      type: WhiskeyType.SCOTCH,
      distillery: "Glenfiddich Distillery",
      region: "Speyside",
      age: 12,
      abv: 40,
      size: "750ml",
      description: "The world's most awarded single malt Scotch whisky.",
      tasting_notes: "Fresh pear and subtle oak with cream, malt, and a hint of honey.",
      rating: 8.3
    },
    {
      name: "Macallan 12 Year Sherry Oak",
      type: WhiskeyType.SCOTCH,
      distillery: "The Macallan Distillery",
      region: "Speyside",
      age: 12,
      abv: 43,
      size: "750ml",
      description: "Matured exclusively in hand-picked sherry seasoned oak casks.",
      tasting_notes: "Rich dried fruits, sherry, and wood smoke with hints of citrus.",
      rating: 9.0
    },
    {
      name: "Lagavulin 16 Year",
      type: WhiskeyType.SCOTCH,
      distillery: "Lagavulin Distillery",
      region: "Islay",
      age: 16,
      abv: 43,
      size: "750ml",
      description: "An intensely flavored, peat-smoke single malt from Islay.",
      tasting_notes: "Intense peat smoke with iodine and seaweed, balanced by rich sweetness.",
      rating: 9.2
    },
    {
      name: "Highland Park 12 Year",
      type: WhiskeyType.SCOTCH,
      distillery: "Highland Park Distillery",
      region: "Islands",
      age: 12,
      abv: 40,
      size: "750ml",
      description: "A perfectly balanced single malt with a unique combination of flavors.",
      tasting_notes: "Heather honey, light smoke, and aromatic peat with hints of marzipan.",
      rating: 8.5
    },
    // Irish Whiskeys
    {
      name: "Jameson Irish Whiskey",
      type: WhiskeyType.IRISH,
      distillery: "Midleton Distillery",
      region: "Cork",
      age: undefined,
      abv: 40,
      size: "750ml",
      description: "Ireland's best-selling whiskey, triple-distilled for smoothness.",
      tasting_notes: "Smooth and mellow with vanilla, toasted wood, and sherry sweetness.",
      rating: 7.8
    },
    {
      name: "Redbreast 12 Year",
      type: WhiskeyType.IRISH,
      distillery: "Midleton Distillery",
      region: "Cork",
      age: 12,
      abv: 40,
      size: "750ml",
      description: "A pot still Irish whiskey with exceptional character and complexity.",
      tasting_notes: "Rich spicy and fruity notes with toasted oak, sherry, and vanilla.",
      rating: 8.9
    },
    {
      name: "Teeling Small Batch",
      type: WhiskeyType.IRISH,
      distillery: "Teeling Distillery",
      region: "Dublin",
      age: undefined,
      abv: 46,
      size: "750ml",
      description: "A modern Irish whiskey finished in rum casks.",
      tasting_notes: "Smooth and sweet with notes of vanilla, spice, and dried fruit.",
      rating: 8.2
    },
    // Japanese
    {
      name: "Hibiki Harmony",
      type: WhiskeyType.JAPANESE,
      distillery: "Suntory",
      region: "Japan",
      age: undefined,
      abv: 43,
      size: "750ml",
      description: "A harmonious blend of Japanese malt and grain whiskies.",
      tasting_notes: "Rose, lychee, and hint of rosemary with honeycomb sweetness.",
      rating: 8.8
    },
    {
      name: "Nikka From The Barrel",
      type: WhiskeyType.JAPANESE,
      distillery: "Nikka",
      region: "Japan",
      age: undefined,
      abv: 51.4,
      size: "500ml",
      description: "A blended whisky bottled at cask strength for maximum flavor.",
      tasting_notes: "Rich and bold with dried fruits, vanilla, and oak spice.",
      rating: 8.6
    },
    // Rye
    {
      name: "Rittenhouse Rye",
      type: WhiskeyType.RYE,
      distillery: "Heaven Hill Distillery",
      region: "Kentucky",
      age: 4,
      abv: 50,
      size: "750ml",
      description: "A bold, spicy rye whiskey bottled-in-bond.",
      tasting_notes: "Intense rye spice with notes of black pepper, cinnamon, and oak.",
      rating: 8.4
    },
    {
      name: "Sazerac Rye",
      type: WhiskeyType.RYE,
      distillery: "Buffalo Trace Distillery",
      region: "Kentucky",
      age: 6,
      abv: 45,
      size: "750ml",
      description: "A classic American rye whiskey with bold flavor.",
      tasting_notes: "Clove, vanilla, and anise with a hint of candy and citrus.",
      rating: 8.1
    },
    // Tennessee
    {
      name: "Jack Daniel's Old No. 7",
      type: WhiskeyType.TENNESSEE,
      distillery: "Jack Daniel Distillery",
      region: "Tennessee",
      age: undefined,
      abv: 40,
      size: "750ml",
      description: "America's best-selling whiskey, charcoal mellowed drop by drop.",
      tasting_notes: "Sweet vanilla and caramel with toasted oak and smooth finish.",
      rating: 7.5
    }
  ];

  let userCount = 0;
  let whiskeyCount = 0;

  // Create users and populate their collections
  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existingUser = UserModel.findByUsername(userData.username);
      if (existingUser) {
        console.log(`⊘ User already exists: ${userData.username}`);
        continue;
      }

      // Create user
      const user = await UserModel.create(
        userData.username,
        userData.email,
        userData.password,
        userData.role
      );
      console.log(`✓ Created user: ${user.username} (${user.role}) - Password: ${userData.password}`);
      userCount++;

      // Randomly select 5-8 whiskeys for this user
      const numWhiskeys = Math.floor(Math.random() * 4) + 5; // 5-8 whiskeys
      const shuffled = [...whiskeyPool].sort(() => Math.random() - 0.5);
      const selectedWhiskeys = shuffled.slice(0, numWhiskeys);

      // Add whiskeys to user's collection
      for (const whiskeyData of selectedWhiskeys) {
        try {
          const whiskey = WhiskeyModel.create({
            ...whiskeyData,
            created_by: user.id
          });
          console.log(`  → Added whiskey: ${whiskey.name}`);
          whiskeyCount++;
        } catch (error) {
          console.error(`  ✗ Failed to add whiskey: ${whiskeyData.name}`, error);
        }
      }

      console.log('');
    } catch (error) {
      console.error(`✗ Failed to create user: ${userData.username}`, error);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Seeding completed!`);
  console.log(`Successfully created: ${userCount} users`);
  console.log(`Successfully added: ${whiskeyCount} whiskeys`);
  console.log(`${'='.repeat(60)}\n`);

  console.log('Test User Credentials:');
  console.log('-'.repeat(60));
  testUsers.forEach(user => {
    console.log(`Username: ${user.username.padEnd(20)} Password: ${user.password}`);
    console.log(`Role: ${user.role.padEnd(20)} Email: ${user.email}`);
    console.log('-'.repeat(60));
  });

  process.exit(0);
}

seedUsers().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
