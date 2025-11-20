import { initializeDatabase } from './database';
import { WhiskeyModel } from '../models/Whiskey';
import { WhiskeyType } from '../types';

async function seedIrish() {
  console.log('Seeding database with popular Irish whiskeys...');

  initializeDatabase();

  const popularIrishWhiskeys = [
    {
      name: "Jameson Irish Whiskey",
      type: WhiskeyType.IRISH,
      distillery: "Midleton Distillery",
      region: "County Cork",
      age: undefined,
      abv: 40,
      size: "750ml",
      description: "The world's best-selling Irish whiskey. Triple distilled for exceptional smoothness and balance.",
      tasting_notes: "Light floral fragrance with a hint of sweet sherry and subtle vanilla. Smooth, sweet, and balanced with pot still spices and toasted wood. Clean, lingering finish.",
      rating: 8.0,
      created_by: 1
    },
    {
      name: "Redbreast 12 Year",
      type: WhiskeyType.IRISH,
      distillery: "Midleton Distillery",
      region: "County Cork",
      age: 12,
      abv: 40,
      size: "750ml",
      description: "The definitive expression of single pot still Irish whiskey. Rich, complex, and full-bodied.",
      tasting_notes: "Warm spices, fruit cake, and sherry. Full-bodied with spicy, creamy, and fruity notes. Long, lingering finish with sherry and pot still spices.",
      rating: 9.2,
      created_by: 1
    },
    {
      name: "Bushmills Black Bush",
      type: WhiskeyType.IRISH,
      distillery: "Bushmills Distillery",
      region: "County Antrim",
      age: undefined,
      abv: 40,
      size: "750ml",
      description: "A premium blend with a high proportion of malt whiskey matured in sherry casks for rich, smooth flavor.",
      tasting_notes: "Rich, fruity notes with sherry influence and honey sweetness. Smooth with dark fruit, caramel, and hints of chocolate. Warm, lengthy finish.",
      rating: 8.4,
      created_by: 1
    },
    {
      name: "Tullamore D.E.W.",
      type: WhiskeyType.IRISH,
      distillery: "Tullamore Distillery",
      region: "County Offaly",
      age: undefined,
      abv: 40,
      size: "750ml",
      description: "A smooth blend of grain, malt, and pot still whiskeys. Known for its approachable, balanced character.",
      tasting_notes: "Citrus and green apple with vanilla and wood. Balanced with spicy, malty notes and slight nuttiness. Gentle, warming finish.",
      rating: 7.8,
      created_by: 1
    },
    {
      name: "Green Spot",
      type: WhiskeyType.IRISH,
      distillery: "Midleton Distillery",
      region: "County Cork",
      age: undefined,
      abv: 40,
      size: "750ml",
      description: "A legendary single pot still whiskey. One of the few remaining bonded Irish whiskeys, rich and complex.",
      tasting_notes: "Fresh herbs, honey, and citrus with hints of apples. Creamy with spices, vanilla, and fruit. Long, sweet finish with oak.",
      rating: 8.9,
      created_by: 1
    },
    {
      name: "Powers Gold Label",
      type: WhiskeyType.IRISH,
      distillery: "Midleton Distillery",
      region: "County Cork",
      age: undefined,
      abv: 40,
      size: "750ml",
      description: "Ireland's best-selling whiskey on its home turf. Known for its distinctive pot still character and spicy notes.",
      tasting_notes: "Honey and spices with hints of cream and vanilla. Full-bodied with pot still spices and sweet vanilla. Medium, warming finish.",
      rating: 8.1,
      created_by: 1
    },
    {
      name: "Teeling Small Batch",
      type: WhiskeyType.IRISH,
      distillery: "Teeling Whiskey Distillery",
      region: "Dublin",
      age: undefined,
      abv: 46,
      size: "750ml",
      description: "A hand-crafted blend finished in rum casks, creating a unique sweet and fruity character.",
      tasting_notes: "Bright with citrus, vanilla, and spice with rum influence. Smooth with vanilla, dried fruit, and subtle spice. Sweet, lingering finish.",
      rating: 8.3,
      created_by: 1
    },
    {
      name: "Connemara Peated Single Malt",
      type: WhiskeyType.IRISH,
      distillery: "Cooley Distillery",
      region: "County Louth",
      age: undefined,
      abv: 40,
      size: "750ml",
      description: "Ireland's only widely available peated single malt. A unique take on Irish whiskey with subtle smoke.",
      tasting_notes: "Sweet peat smoke with malt and honey. Smooth with sweet peat, barley, and hints of fruit. Long, smoky finish.",
      rating: 8.2,
      created_by: 1
    },
    {
      name: "Yellow Spot 12 Year",
      type: WhiskeyType.IRISH,
      distillery: "Midleton Distillery",
      region: "County Cork",
      age: 12,
      abv: 46,
      size: "750ml",
      description: "A rare single pot still Irish whiskey matured in three cask types. Complex, rich, and highly sought after.",
      tasting_notes: "Rich fruit, honey, and spices with red apples and barley. Full-bodied with sweet orchard fruits, spices, and oak. Long, complex finish.",
      rating: 9.4,
      created_by: 1
    },
    {
      name: "Method and Madness Single Pot Still",
      type: WhiskeyType.IRISH,
      distillery: "Midleton Distillery",
      region: "County Cork",
      age: undefined,
      abv: 46,
      size: "700ml",
      description: "An innovative expression that pushes boundaries. Matured in virgin Spanish oak for unique character.",
      tasting_notes: "Exotic spices, vanilla, and tropical fruit. Rich with honey, pot still spices, and dark chocolate. Long, spicy finish.",
      rating: 8.6,
      created_by: 1
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const irish of popularIrishWhiskeys) {
    try {
      const whiskey = WhiskeyModel.create(irish);
      console.log(`✓ Added: ${whiskey.name}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to add: ${irish.name}`, error);
      errorCount++;
    }
  }

  console.log(`\nSeeding completed!`);
  console.log(`Successfully added: ${successCount} Irish whiskeys`);
  if (errorCount > 0) {
    console.log(`Failed: ${errorCount} Irish whiskeys`);
  }

  process.exit(0);
}

seedIrish().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
