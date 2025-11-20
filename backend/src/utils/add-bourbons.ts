import { db } from '../utils/database';

interface BourbonData {
  name: string;
  distillery: string;
  region: string;
  age?: number;
  abv: number;
  size: string;
  quantity: number;
  msrp: number;
  secondary_price?: number;
  description: string;
  tasting_notes: string;
  rating: number;
  purchase_date: string;
  purchase_price: number;
  purchase_location: string;
}

const bourbons: BourbonData[] = [
  {
    name: "George T. Stagg",
    distillery: "Buffalo Trace",
    region: "Kentucky",
    age: 15,
    abv: 64.1,
    size: "750ml",
    quantity: 1,
    msrp: 99.99,
    secondary_price: 800.00,
    description: "Uncut and unfiltered straight bourbon whiskey from Buffalo Trace's prestigious Antique Collection.",
    tasting_notes: "Rich dark chocolate, tobacco, and charred oak with a long, warming finish.",
    rating: 9.50,
    purchase_date: "2023-10-15",
    purchase_price: 99.99,
    purchase_location: "ABC Spirits"
  },
  {
    name: "William Larue Weller",
    distillery: "Buffalo Trace",
    region: "Kentucky",
    age: 12,
    abv: 62.85,
    size: "750ml",
    quantity: 1,
    msrp: 99.99,
    secondary_price: 1200.00,
    description: "Wheated bourbon from the Buffalo Trace Antique Collection, uncut and unfiltered.",
    tasting_notes: "Caramel, vanilla, dried fruits with a creamy wheated mouthfeel.",
    rating: 9.40,
    purchase_date: "2023-11-01",
    purchase_price: 99.99,
    purchase_location: "State Liquor Store"
  },
  {
    name: "Booker's Bourbon",
    distillery: "Jim Beam",
    region: "Kentucky",
    age: 7,
    abv: 63.7,
    size: "750ml",
    quantity: 2,
    msrp: 89.99,
    secondary_price: 120.00,
    description: "Small batch bourbon bottled straight from the barrel uncut and unfiltered.",
    tasting_notes: "Vanilla, oak, and brown sugar with intense barrel char notes.",
    rating: 8.50,
    purchase_date: "2024-01-20",
    purchase_price: 89.99,
    purchase_location: "Total Wine"
  },
  {
    name: "Four Roses Limited Edition Small Batch 2023",
    distillery: "Four Roses",
    region: "Kentucky",
    age: 12,
    abv: 55.8,
    size: "750ml",
    quantity: 1,
    msrp: 149.99,
    secondary_price: 300.00,
    description: "Annual limited edition release blending four exceptional bourbon recipes.",
    tasting_notes: "Ripe plum, cherry, cinnamon spice with hints of mint and oak.",
    rating: 9.10,
    purchase_date: "2023-09-12",
    purchase_price: 149.99,
    purchase_location: "Liquor Barn"
  },
  {
    name: "Elijah Craig Barrel Proof",
    distillery: "Heaven Hill",
    region: "Kentucky",
    age: 12,
    abv: 66.1,
    size: "750ml",
    quantity: 3,
    msrp: 69.99,
    secondary_price: 90.00,
    description: "Uncut, straight-from-the-barrel small batch bourbon bottled at barrel proof.",
    tasting_notes: "Caramel, vanilla, butterscotch with robust oak and spice.",
    rating: 8.80,
    purchase_date: "2024-02-14",
    purchase_price: 69.99,
    purchase_location: "Binny's"
  },
  {
    name: "1792 Full Proof",
    distillery: "Barton 1792",
    region: "Kentucky",
    abv: 62.5,
    size: "750ml",
    quantity: 2,
    msrp: 49.99,
    secondary_price: 65.00,
    description: "Bottled at the same proof it entered the barrel for a bold, rich flavor.",
    tasting_notes: "Toffee, leather, dried fruit with peppery spice and oak.",
    rating: 8.30,
    purchase_date: "2024-03-05",
    purchase_price: 49.99,
    purchase_location: "Specs"
  },
  {
    name: "Wild Turkey Rare Breed",
    distillery: "Wild Turkey",
    region: "Kentucky",
    abv: 58.4,
    size: "750ml",
    quantity: 2,
    msrp: 49.99,
    description: "Barrel-proof bourbon blending 6, 8, and 12-year-old whiskeys.",
    tasting_notes: "Honey, caramel, and vanilla with peppery rye spice.",
    rating: 8.20,
    purchase_date: "2024-04-10",
    purchase_price: 45.99,
    purchase_location: "Total Wine"
  },
  {
    name: "Maker's Mark Cask Strength",
    distillery: "Maker's Mark",
    region: "Kentucky",
    abv: 55.5,
    size: "750ml",
    quantity: 2,
    msrp: 39.99,
    description: "Bold, full-flavored expression of Maker's Mark wheated bourbon.",
    tasting_notes: "Caramel, vanilla, oak with a creamy wheated texture.",
    rating: 8.40,
    purchase_date: "2024-05-22",
    purchase_price: 39.99,
    purchase_location: "ABC Spirits"
  },
  {
    name: "Knob Creek 12 Year",
    distillery: "Jim Beam",
    region: "Kentucky",
    age: 12,
    abv: 50.0,
    size: "750ml",
    quantity: 1,
    msrp: 69.99,
    secondary_price: 85.00,
    description: "Extended aging creates deep, complex flavors in this small batch bourbon.",
    tasting_notes: "Toasted oak, vanilla, caramel with rich brown sugar notes.",
    rating: 8.60,
    purchase_date: "2024-06-08",
    purchase_price: 69.99,
    purchase_location: "Liquor Barn"
  },
  {
    name: "Angel's Envy Cask Strength",
    distillery: "Angel's Envy",
    region: "Kentucky",
    abv: 59.5,
    size: "750ml",
    quantity: 1,
    msrp: 199.99,
    secondary_price: 400.00,
    description: "Port barrel-finished bourbon bottled at cask strength, released annually.",
    tasting_notes: "Dark fruit, chocolate, vanilla with port wine influence.",
    rating: 8.90,
    purchase_date: "2023-12-10",
    purchase_price: 199.99,
    purchase_location: "Total Wine"
  },
  {
    name: "Woodford Reserve Batch Proof",
    distillery: "Woodford Reserve",
    region: "Kentucky",
    abv: 61.4,
    size: "750ml",
    quantity: 2,
    msrp: 129.99,
    secondary_price: 180.00,
    description: "Uncut, unfiltered expression of Woodford Reserve's signature bourbon.",
    tasting_notes: "Dried fruit, vanilla, toffee with robust oak and spice.",
    rating: 8.70,
    purchase_date: "2024-01-15",
    purchase_price: 129.99,
    purchase_location: "Binny's"
  },
  {
    name: "Russell's Reserve Single Barrel",
    distillery: "Wild Turkey",
    region: "Kentucky",
    abv: 55.0,
    size: "750ml",
    quantity: 2,
    msrp: 59.99,
    description: "Hand-selected single barrel bourbon from master distiller Eddie Russell.",
    tasting_notes: "Caramel, vanilla, and cherry with spicy oak notes.",
    rating: 8.50,
    purchase_date: "2024-07-20",
    purchase_price: 59.99,
    purchase_location: "Specs"
  },
  {
    name: "Old Forester 1920 Prohibition Style",
    distillery: "Old Forester",
    region: "Kentucky",
    abv: 57.5,
    size: "750ml",
    quantity: 2,
    msrp: 64.99,
    description: "Barrel strength bourbon inspired by Prohibition-era production methods.",
    tasting_notes: "Chocolate, vanilla, caramel with spicy cinnamon and nutmeg.",
    rating: 8.60,
    purchase_date: "2024-08-05",
    purchase_price: 64.99,
    purchase_location: "ABC Spirits"
  },
  {
    name: "Michter's 10 Year Single Barrel Bourbon",
    distillery: "Michter's",
    region: "Kentucky",
    age: 10,
    abv: 47.2,
    size: "750ml",
    quantity: 1,
    msrp: 169.99,
    secondary_price: 450.00,
    description: "Carefully selected single barrel bourbon aged for a full decade.",
    tasting_notes: "Dried fruit, butterscotch, vanilla with hints of smoke and oak.",
    rating: 9.20,
    purchase_date: "2023-11-28",
    purchase_price: 169.99,
    purchase_location: "Liquor Barn"
  },
  {
    name: "Buffalo Trace Single Barrel",
    distillery: "Buffalo Trace",
    region: "Kentucky",
    abv: 45.0,
    size: "750ml",
    quantity: 3,
    msrp: 49.99,
    description: "Hand-selected single barrel from the acclaimed Buffalo Trace Distillery.",
    tasting_notes: "Vanilla, toffee, dark fruit with subtle spice and oak.",
    rating: 8.30,
    purchase_date: "2024-09-10",
    purchase_price: 49.99,
    purchase_location: "Total Wine"
  },
  {
    name: "Colonel E.H. Taylor Barrel Proof",
    distillery: "Buffalo Trace",
    region: "Kentucky",
    abv: 64.05,
    size: "750ml",
    quantity: 1,
    msrp: 69.99,
    secondary_price: 350.00,
    description: "Uncut and unfiltered bourbon honoring a true bourbon pioneer.",
    tasting_notes: "Brown sugar, tobacco, leather with intense barrel char.",
    rating: 9.00,
    purchase_date: "2023-10-30",
    purchase_price: 69.99,
    purchase_location: "State Liquor Store"
  },
  {
    name: "Bardstown Bourbon Company Discovery Series #8",
    distillery: "Bardstown Bourbon Company",
    region: "Kentucky",
    abv: 57.05,
    size: "750ml",
    quantity: 1,
    msrp: 139.99,
    secondary_price: 200.00,
    description: "Innovative blend showcasing Bardstown's collaborative approach to bourbon.",
    tasting_notes: "Honey, baking spices, toasted oak with rich caramel.",
    rating: 8.80,
    purchase_date: "2024-02-28",
    purchase_price: 139.99,
    purchase_location: "Binny's"
  },
  {
    name: "Jack Daniel's Single Barrel Barrel Proof",
    distillery: "Jack Daniel's",
    region: "Tennessee",
    abv: 64.5,
    size: "750ml",
    quantity: 2,
    msrp: 69.99,
    description: "Hand-selected Tennessee whiskey bottled at full barrel proof.",
    tasting_notes: "Charcoal, maple, vanilla with intense oak and spice.",
    rating: 8.40,
    purchase_date: "2024-03-18",
    purchase_price: 69.99,
    purchase_location: "Specs"
  },
  {
    name: "Rabbit Hole Cavehill",
    distillery: "Rabbit Hole",
    region: "Kentucky",
    abv: 47.5,
    size: "750ml",
    quantity: 1,
    msrp: 59.99,
    description: "Four-grain straight bourbon finished in toasted barrels.",
    tasting_notes: "Honey, vanilla, toasted grain with subtle fruit notes.",
    rating: 8.10,
    purchase_date: "2024-04-25",
    purchase_price: 59.99,
    purchase_location: "Total Wine"
  },
  {
    name: "Larceny Barrel Proof",
    distillery: "Heaven Hill",
    region: "Kentucky",
    abv: 61.2,
    size: "750ml",
    quantity: 2,
    msrp: 49.99,
    description: "Wheated bourbon bottled straight from the barrel at full proof.",
    tasting_notes: "Butterscotch, vanilla, wheat bread with caramel sweetness.",
    rating: 8.50,
    purchase_date: "2024-05-30",
    purchase_price: 49.99,
    purchase_location: "ABC Spirits"
  },
  {
    name: "Old Grand-Dad 114",
    distillery: "Jim Beam",
    region: "Kentucky",
    abv: 57.0,
    size: "750ml",
    quantity: 3,
    msrp: 34.99,
    description: "High-rye bourbon bottled at 114 proof for bold flavor.",
    tasting_notes: "Rye spice, vanilla, caramel with peppery heat.",
    rating: 8.00,
    purchase_date: "2024-06-15",
    purchase_price: 34.99,
    purchase_location: "Liquor Barn"
  },
  {
    name: "Wild Turkey Kentucky Spirit",
    distillery: "Wild Turkey",
    region: "Kentucky",
    abv: 50.5,
    size: "750ml",
    quantity: 2,
    msrp: 54.99,
    description: "Single barrel bourbon aged in the deepest charred barrels.",
    tasting_notes: "Vanilla, honey, toasted oak with rye spice.",
    rating: 8.30,
    purchase_date: "2024-07-08",
    purchase_price: 54.99,
    purchase_location: "Binny's"
  },
  {
    name: "Heaven Hill 7 Year Bottled in Bond",
    distillery: "Heaven Hill",
    region: "Kentucky",
    age: 7,
    abv: 50.0,
    size: "750ml",
    quantity: 2,
    msrp: 44.99,
    description: "Classic bottled-in-bond bourbon aged for seven years.",
    tasting_notes: "Caramel, vanilla, oak with subtle cherry notes.",
    rating: 8.40,
    purchase_date: "2024-08-20",
    purchase_price: 44.99,
    purchase_location: "Specs"
  }
];

async function addBourbons() {
  console.log('Starting to add 23 bourbons to admin collection...\n');

  const adminUserId = 26; // admin user ID

  let successCount = 0;
  let errorCount = 0;

  for (const bourbon of bourbons) {
    try {
      const stmt = db.prepare(`
        INSERT INTO whiskeys (
          name, type, distillery, region, age, abv, size,
          quantity, msrp, secondary_price,
          description, tasting_notes, rating,
          purchase_date, purchase_price, purchase_location,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        bourbon.name,
        'bourbon',
        bourbon.distillery,
        bourbon.region,
        bourbon.age || null,
        bourbon.abv,
        bourbon.size,
        bourbon.quantity,
        bourbon.msrp,
        bourbon.secondary_price || null,
        bourbon.description,
        bourbon.tasting_notes,
        bourbon.rating,
        bourbon.purchase_date,
        bourbon.purchase_price,
        bourbon.purchase_location,
        adminUserId
      );

      successCount++;
      console.log(`✓ Added: ${bourbon.name}`);
    } catch (error: any) {
      errorCount++;
      console.error(`✗ Failed to add ${bourbon.name}: ${error.message}`);
    }
  }

  console.log(`\nCompleted!`);
  console.log(`Successfully added: ${successCount} bourbons`);
  console.log(`Errors: ${errorCount}`);
}

addBourbons()
  .then(() => {
    console.log('\nDone! Admin collection now has more bourbons.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
