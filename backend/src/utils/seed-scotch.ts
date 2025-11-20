import { initializeDatabase } from './database';
import { WhiskeyModel } from '../models/Whiskey';
import { WhiskeyType } from '../types';

async function seedScotch() {
  console.log('Seeding database with popular scotches...');

  initializeDatabase();

  const popularScotches = [
    {
      name: "Glenfiddich 12 Year",
      type: WhiskeyType.SCOTCH,
      distillery: "Glenfiddich Distillery",
      region: "Speyside",
      age: 12,
      abv: 40,
      size: "750ml",
      description: "The world's most awarded single malt scotch. A classic Speyside with exceptional balance and smoothness.",
      tasting_notes: "Fresh pear and subtle oak on the nose. Creamy butterscotch, cream, malt, and subtle oak flavors. Long, smooth, and mellow finish.",
      rating: 8.3,
      created_by: 1
    },
    {
      name: "Macallan 12 Year Sherry Oak",
      type: WhiskeyType.SCOTCH,
      distillery: "Macallan Distillery",
      region: "Speyside",
      age: 12,
      abv: 43,
      size: "750ml",
      description: "Matured exclusively in hand-picked sherry seasoned oak casks from Jerez, Spain, offering rich and complex flavors.",
      tasting_notes: "Dried fruits, ginger, and sherry on the nose. Rich dried fruits, sherry, wood smoke, and spice on the palate. Medium, slightly dry finish.",
      rating: 9.0,
      created_by: 1
    },
    {
      name: "Laphroaig 10 Year",
      type: WhiskeyType.SCOTCH,
      distillery: "Laphroaig Distillery",
      region: "Islay",
      age: 10,
      abv: 43,
      size: "750ml",
      description: "The most richly flavoured of all scotch whiskies. Full-bodied with a peat smoke flavor that lingers.",
      tasting_notes: "Bold, smoky peat with hints of seaweed and medicinal notes. Sweet and salty with vanilla, peat smoke, and iodine. Long, warming finish.",
      rating: 8.7,
      created_by: 1
    },
    {
      name: "Lagavulin 16 Year",
      type: WhiskeyType.SCOTCH,
      distillery: "Lagavulin Distillery",
      region: "Islay",
      age: 16,
      abv: 43,
      size: "750ml",
      description: "An intensely flavoured, peat smoke malt with a long finish. One of the most complex and sophisticated Islay malts.",
      tasting_notes: "Intense peat smoke with iodine and seaweed, hints of oak and brine. Full-bodied with sweet fruit, peat smoke, and oak. Long, elegant finish.",
      rating: 9.3,
      created_by: 1
    },
    {
      name: "Glenlivet 12 Year",
      type: WhiskeyType.SCOTCH,
      distillery: "Glenlivet Distillery",
      region: "Speyside",
      age: 12,
      abv: 40,
      size: "750ml",
      description: "The single malt that started it all. Smooth, balanced, and complex with tropical fruit and vanilla notes.",
      tasting_notes: "Pineapple and vanilla with honey and peach. Well-balanced with honey, vanilla, and soft summer fruits. Long, creamy finish.",
      rating: 8.2,
      created_by: 1
    },
    {
      name: "Highland Park 12 Year Viking Honour",
      type: WhiskeyType.SCOTCH,
      distillery: "Highland Park Distillery",
      region: "Islands",
      age: 12,
      abv: 40,
      size: "750ml",
      description: "A perfect balance of sweet and smoky. Matured in sherry-seasoned casks, with a subtle peaty flavor.",
      tasting_notes: "Aromatic smoke and heather honey with hints of malt. Honey, heather, and hints of smoke with malt and spice. Medium, warming finish.",
      rating: 8.6,
      created_by: 1
    },
    {
      name: "Talisker 10 Year",
      type: WhiskeyType.SCOTCH,
      distillery: "Talisker Distillery",
      region: "Islands",
      age: 10,
      abv: 45.8,
      size: "750ml",
      description: "Made by the sea on the shores of the Isle of Skye. A powerful, maritime single malt with distinctive peppery notes.",
      tasting_notes: "Smoke and sea salt with sweet malt and peat. Explosive spice, peat smoke, and maritime notes. Long, warming, peppery finish.",
      rating: 8.8,
      created_by: 1
    },
    {
      name: "Oban 14 Year",
      type: WhiskeyType.SCOTCH,
      distillery: "Oban Distillery",
      region: "Highlands",
      age: 14,
      abv: 43,
      size: "750ml",
      description: "A distinguished malt from the western Highlands. Complex with notes of orange peel, smoke, and sea salt.",
      tasting_notes: "Fresh oranges and lemons with peat smoke and sea air. Rich sweetness with salt, peat smoke, and fruit. Smooth, lengthy finish.",
      rating: 8.9,
      created_by: 1
    },
    {
      name: "Ardbeg 10 Year",
      type: WhiskeyType.SCOTCH,
      distillery: "Ardbeg Distillery",
      region: "Islay",
      age: 10,
      abv: 46,
      size: "750ml",
      description: "The ultimate Islay malt. Revered for its phenomenal smoky taste balanced with delicate sweetness.",
      tasting_notes: "Intense peat smoke with citrus and chocolate. Sweet, concentrated fruit with peat smoke, tar, and espresso. Long, smoky finish.",
      rating: 9.1,
      created_by: 1
    },
    {
      name: "Balvenie DoubleWood 12 Year",
      type: WhiskeyType.SCOTCH,
      distillery: "Balvenie Distillery",
      region: "Speyside",
      age: 12,
      abv: 40,
      size: "750ml",
      description: "Matured in two wood types for a rich, layered flavor. First in American oak, then in European sherry casks.",
      tasting_notes: "Sweet fruit and sherry with hints of honey and vanilla. Smooth with nuts, cinnamon, and sherry sweetness. Long, warm finish.",
      rating: 8.5,
      created_by: 1
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const scotch of popularScotches) {
    try {
      const whiskey = WhiskeyModel.create(scotch);
      console.log(`✓ Added: ${whiskey.name}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to add: ${scotch.name}`, error);
      errorCount++;
    }
  }

  console.log(`\nSeeding completed!`);
  console.log(`Successfully added: ${successCount} scotches`);
  if (errorCount > 0) {
    console.log(`Failed: ${errorCount} scotches`);
  }

  process.exit(0);
}

seedScotch().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
