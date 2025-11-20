import { initializeDatabase } from './database';
import { WhiskeyModel } from '../models/Whiskey';
import { WhiskeyType } from '../types';

async function seed() {
  console.log('Seeding database with popular bourbons...');

  initializeDatabase();

  const popularBourbons = [
    {
      name: "Buffalo Trace",
      type: WhiskeyType.BOURBON,
      distillery: "Buffalo Trace Distillery",
      region: "Kentucky",
      age: undefined,
      abv: 45,
      size: "750ml",
      description: "A smooth, complex bourbon with notes of vanilla, toffee, and candied fruit. One of the most awarded bourbons in the world.",
      tasting_notes: "Sweet vanilla and caramel on the nose, followed by brown sugar, dark fruit, and oak. The finish is long and smooth with hints of spice.",
      rating: 8.5,
      created_by: 1
    },
    {
      name: "Maker's Mark",
      type: WhiskeyType.BOURBON,
      distillery: "Maker's Mark Distillery",
      region: "Kentucky",
      age: undefined,
      abv: 45,
      size: "750ml",
      description: "A wheated bourbon known for its smooth, approachable character and distinctive red wax seal.",
      tasting_notes: "Sweet caramel and vanilla with wheat bread, butterscotch, and hints of cinnamon. Smooth and balanced finish.",
      rating: 8.0,
      created_by: 1
    },
    {
      name: "Woodford Reserve",
      type: WhiskeyType.BOURBON,
      distillery: "Woodford Reserve Distillery",
      region: "Kentucky",
      age: undefined,
      abv: 43.2,
      size: "750ml",
      description: "A premium small-batch bourbon with a rich, full-bodied flavor profile.",
      tasting_notes: "Complex notes of dried fruit, vanilla, tobacco leaf, and sweet aromatics. Hints of cocoa and spice with a warm, lengthy finish.",
      rating: 8.7,
      created_by: 1
    },
    {
      name: "Blanton's Single Barrel",
      type: WhiskeyType.BOURBON,
      distillery: "Buffalo Trace Distillery",
      region: "Kentucky",
      age: undefined,
      abv: 46.5,
      size: "750ml",
      description: "The original single barrel bourbon, known for its distinctive horse and jockey bottle stopper.",
      tasting_notes: "Rich caramel and honey with citrus notes, vanilla, and oak. Full-bodied with a long, smooth finish.",
      rating: 9.0,
      created_by: 1
    },
    {
      name: "Eagle Rare 10 Year",
      type: WhiskeyType.BOURBON,
      distillery: "Buffalo Trace Distillery",
      region: "Kentucky",
      age: 10,
      abv: 45,
      size: "750ml",
      description: "A premium bourbon aged for at least 10 years, offering exceptional complexity and smoothness.",
      tasting_notes: "Toffee, hints of orange peel, and oak with a complex palate of leather, tobacco, and candied almonds. Dry, lingering finish.",
      rating: 8.8,
      created_by: 1
    },
    {
      name: "Knob Creek Small Batch",
      type: WhiskeyType.BOURBON,
      distillery: "Jim Beam Distillery",
      region: "Kentucky",
      age: 9,
      abv: 50,
      size: "750ml",
      description: "A full-bodied bourbon with a high rye content, aged 9 years for maximum depth and complexity.",
      tasting_notes: "Rich maple and caramel with notes of toasted nuts, oak, and vanilla. Bold, spicy finish with hints of pepper and cinnamon.",
      rating: 8.3,
      created_by: 1
    },
    {
      name: "Four Roses Small Batch",
      type: WhiskeyType.BOURBON,
      distillery: "Four Roses Distillery",
      region: "Kentucky",
      age: undefined,
      abv: 45,
      size: "750ml",
      description: "A carefully crafted blend of four distinctive bourbon recipes, creating a mellow yet complex flavor.",
      tasting_notes: "Floral and fruity with honey, light spice, and hints of apple and pear. Smooth, mellow finish with subtle oak.",
      rating: 8.4,
      created_by: 1
    },
    {
      name: "Wild Turkey 101",
      type: WhiskeyType.BOURBON,
      distillery: "Wild Turkey Distillery",
      region: "Kentucky",
      age: undefined,
      abv: 50.5,
      size: "750ml",
      description: "A bold, high-proof bourbon that's been a favorite among whiskey enthusiasts for decades.",
      tasting_notes: "Caramel, vanilla, and baking spices with notes of cherry and orange zest. Long, warm finish with oak and pepper.",
      rating: 8.6,
      created_by: 1
    },
    {
      name: "Elijah Craig Small Batch",
      type: WhiskeyType.BOURBON,
      distillery: "Heaven Hill Distillery",
      region: "Kentucky",
      age: undefined,
      abv: 47,
      size: "750ml",
      description: "Named after the Baptist minister credited with inventing bourbon, this is a rich, smooth whiskey.",
      tasting_notes: "Sweet vanilla, smoke, and butterscotch with notes of caramel, wood, and spice. Warm, lengthy finish.",
      rating: 8.2,
      created_by: 1
    },
    {
      name: "Old Forester 1920 Prohibition Style",
      type: WhiskeyType.BOURBON,
      distillery: "Old Forester Distillery",
      region: "Kentucky",
      age: undefined,
      abv: 57.5,
      size: "750ml",
      description: "A barrel strength bourbon inspired by the style made during Prohibition, robust and flavorful.",
      tasting_notes: "Dark chocolate, caramel, and vanilla with notes of leather, tobacco, and oak. Rich, complex finish with lingering spice.",
      rating: 9.2,
      created_by: 1
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const bourbon of popularBourbons) {
    try {
      const whiskey = WhiskeyModel.create(bourbon);
      console.log(`✓ Added: ${whiskey.name}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to add: ${bourbon.name}`, error);
      errorCount++;
    }
  }

  console.log(`\nSeeding completed!`);
  console.log(`Successfully added: ${successCount} bourbons`);
  if (errorCount > 0) {
    console.log(`Failed: ${errorCount} bourbons`);
  }

  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
