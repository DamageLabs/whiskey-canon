-- Update ages for whiskeys where age is not set
-- Based on standard age statements for each product

-- Blanton's Single Barrel - No age statement (NAS), typically 6-8 years, we'll set to NULL as it varies
UPDATE whiskeys SET age = NULL WHERE id = 5;

-- Buffalo Trace - No age statement (NAS)
UPDATE whiskeys SET age = NULL WHERE id IN (2, 42);

-- Bushmills Black Bush - Blend with some components aged 7-10 years, typically listed as NAS
UPDATE whiskeys SET age = 8 WHERE id = 24;

-- Connemara Peated Single Malt - No age statement version
UPDATE whiskeys SET age = NULL WHERE id = 29;

-- Elijah Craig Small Batch - No age statement (used to be 12yr, now NAS)
UPDATE whiskeys SET age = NULL WHERE id = 10;

-- Four Roses Small Batch - No age statement, typically 6-7 years
UPDATE whiskeys SET age = 7 WHERE id = 8;

-- Green Spot - No age statement, typically 7-10 years
UPDATE whiskeys SET age = 8 WHERE id = 26;

-- Hibiki Harmony - No age statement
UPDATE whiskeys SET age = NULL WHERE id IN (36, 49);

-- Jack Daniel's Old No. 7 - No age statement, typically 4-5 years
UPDATE whiskeys SET age = 4 WHERE id = 59;

-- Jameson Irish Whiskey (standard) - No age statement, typically 4-5 years
UPDATE whiskeys SET age = 4 WHERE id IN (22, 35, 46);

-- Maker's Mark - No age statement, typically 5-7 years
UPDATE whiskeys SET age = 6 WHERE id IN (3, 43);

-- Method and Madness Single Pot Still - No age statement
UPDATE whiskeys SET age = NULL WHERE id = 31;

-- Nikka From The Barrel - No age statement, blend of various ages
UPDATE whiskeys SET age = NULL WHERE id IN (44, 56);

-- Old Forester 1920 Prohibition Style - No age statement, typically 4-6 years
UPDATE whiskeys SET age = 5 WHERE id = 11;

-- Powers Gold Label - No age statement, typically 5-7 years
UPDATE whiskeys SET age = 6 WHERE id = 27;

-- Teeling Small Batch - No age statement, typically 5-6 years
UPDATE whiskeys SET age = 5 WHERE id IN (28, 39, 47, 55);

-- Tullamore D.E.W. - No age statement, typically 4-5 years
UPDATE whiskeys SET age = 4 WHERE id = 25;

-- Wild Turkey 101 - No age statement, typically 6-8 years
UPDATE whiskeys SET age = 7 WHERE id IN (9, 33, 57);

-- Woodford Reserve - No age statement, typically 7 years
UPDATE whiskeys SET age = 7 WHERE id IN (4, 53);
