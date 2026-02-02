import express, { Response } from 'express';
import { db } from '../utils/database';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get comprehensive statistics for user's collection
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;

    // Financial & Value Statistics
    const financialStats = db.prepare(`
      SELECT
        COUNT(*) as total_bottles,
        SUM(quantity) as total_units,
        COALESCE(SUM(purchase_price), 0) as total_spent,
        COALESCE(SUM(msrp), 0) as total_msrp,
        COALESCE(SUM(current_market_value), 0) as total_current_value,
        COALESCE(SUM(secondary_price), 0) as total_secondary_value,
        COALESCE(AVG(purchase_price), 0) as avg_purchase_price,
        COALESCE(AVG(current_market_value), 0) as avg_current_value,
        COALESCE(SUM(current_market_value - purchase_price), 0) as total_gain_loss
      FROM whiskeys
      WHERE created_by = ?
    `).get(userId) as any;

    // Most valuable bottles
    const mostValuable = db.prepare(`
      SELECT id, name, distillery, current_market_value, purchase_price,
             (current_market_value - COALESCE(purchase_price, 0)) as value_gain
      FROM whiskeys
      WHERE created_by = ? AND current_market_value IS NOT NULL
      ORDER BY current_market_value DESC
      LIMIT 10
    `).all(userId);

    // Best ROI bottles
    const bestROI = db.prepare(`
      SELECT id, name, distillery, purchase_price, current_market_value,
             ROUND(((current_market_value - purchase_price) / NULLIF(purchase_price, 0) * 100), 2) as roi_percentage
      FROM whiskeys
      WHERE created_by = ?
        AND purchase_price IS NOT NULL
        AND current_market_value IS NOT NULL
        AND purchase_price > 0
      ORDER BY roi_percentage DESC
      LIMIT 10
    `).all(userId);

    // Inventory & Consumption Statistics
    const inventoryStats = db.prepare(`
      SELECT
        SUM(CASE WHEN is_opened = 1 THEN 1 ELSE 0 END) as opened_count,
        SUM(CASE WHEN is_opened = 0 OR is_opened IS NULL THEN 1 ELSE 0 END) as unopened_count,
        AVG(CASE WHEN is_opened = 1 THEN remaining_volume END) as avg_remaining_volume,
        SUM(CASE WHEN remaining_volume < 25 THEN 1 ELSE 0 END) as running_low_count,
        SUM(CASE WHEN status = 'consumed' THEN 1 ELSE 0 END) as consumed_count,
        SUM(CASE WHEN status = 'in_collection' THEN 1 ELSE 0 END) as in_collection_count,
        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold_count,
        SUM(CASE WHEN status = 'traded' THEN 1 ELSE 0 END) as traded_count,
        SUM(CASE WHEN status = 'gifted' THEN 1 ELSE 0 END) as gifted_count
      FROM whiskeys
      WHERE created_by = ?
    `).get(userId) as any;

    // Bottles running low
    const runningLow = db.prepare(`
      SELECT id, name, distillery, remaining_volume, is_opened
      FROM whiskeys
      WHERE created_by = ? AND is_opened = 1 AND remaining_volume < 25
      ORDER BY remaining_volume ASC
      LIMIT 10
    `).all(userId);

    // Storage locations
    const storageLocations = db.prepare(`
      SELECT storage_location, COUNT(*) as count
      FROM whiskeys
      WHERE created_by = ? AND storage_location IS NOT NULL
      GROUP BY storage_location
      ORDER BY count DESC
    `).all(userId);

    // Collection Composition
    const typeDistribution = db.prepare(`
      SELECT type, COUNT(*) as count,
             COALESCE(SUM(current_market_value), 0) as total_value,
             COALESCE(AVG(rating), 0) as avg_rating
      FROM whiskeys
      WHERE created_by = ?
      GROUP BY type
      ORDER BY count DESC
    `).all(userId);

    const countryDistribution = db.prepare(`
      SELECT country, COUNT(*) as count
      FROM whiskeys
      WHERE created_by = ? AND country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
    `).all(userId);

    const topDistilleries = db.prepare(`
      SELECT distillery, COUNT(*) as count,
             COALESCE(SUM(current_market_value), 0) as total_value
      FROM whiskeys
      WHERE created_by = ?
      GROUP BY distillery
      ORDER BY count DESC
      LIMIT 10
    `).all(userId);

    // Age distribution
    const ageDistribution = db.prepare(`
      SELECT
        CASE
          WHEN age IS NULL THEN 'NAS'
          WHEN age < 10 THEN '0-9 years'
          WHEN age < 15 THEN '10-14 years'
          WHEN age < 20 THEN '15-19 years'
          WHEN age < 25 THEN '20-24 years'
          ELSE '25+ years'
        END as age_range,
        COUNT(*) as count
      FROM whiskeys
      WHERE created_by = ?
      GROUP BY age_range
      ORDER BY
        CASE age_range
          WHEN 'NAS' THEN 0
          WHEN '0-9 years' THEN 1
          WHEN '10-14 years' THEN 2
          WHEN '15-19 years' THEN 3
          WHEN '20-24 years' THEN 4
          ELSE 5
        END
    `).all(userId);

    // Quality Metrics
    const ratingStats = db.prepare(`
      SELECT
        COUNT(CASE WHEN rating IS NOT NULL THEN 1 END) as rated_count,
        COALESCE(AVG(rating), 0) as avg_rating,
        MAX(rating) as highest_rating,
        MIN(rating) as lowest_rating
      FROM whiskeys
      WHERE created_by = ?
    `).get(userId) as any;

    const highestRated = db.prepare(`
      SELECT id, name, distillery, rating, type
      FROM whiskeys
      WHERE created_by = ? AND rating IS NOT NULL
      ORDER BY rating DESC
      LIMIT 10
    `).all(userId);

    const ratingDistribution = db.prepare(`
      SELECT
        ROUND(rating) as rating_bucket,
        COUNT(*) as count
      FROM whiskeys
      WHERE created_by = ? AND rating IS NOT NULL
      GROUP BY rating_bucket
      ORDER BY rating_bucket DESC
    `).all(userId);

    // Acquisition Patterns
    const recentAcquisitions = db.prepare(`
      SELECT id, name, distillery, purchase_date, purchase_price, purchase_location
      FROM whiskeys
      WHERE created_by = ? AND purchase_date IS NOT NULL
      ORDER BY purchase_date DESC
      LIMIT 15
    `).all(userId);

    const purchaseLocations = db.prepare(`
      SELECT purchase_location, COUNT(*) as count,
             COALESCE(AVG(purchase_price), 0) as avg_price
      FROM whiskeys
      WHERE created_by = ? AND purchase_location IS NOT NULL
      GROUP BY purchase_location
      ORDER BY count DESC
      LIMIT 10
    `).all(userId);

    const avgPriceByType = db.prepare(`
      SELECT type,
             COALESCE(AVG(purchase_price), 0) as avg_purchase_price,
             COALESCE(AVG(msrp), 0) as avg_msrp
      FROM whiskeys
      WHERE created_by = ?
      GROUP BY type
      ORDER BY avg_purchase_price DESC
    `).all(userId);

    // Rarity & Special Items
    const specialItems = db.prepare(`
      SELECT
        SUM(CASE WHEN limited_edition = 1 THEN 1 ELSE 0 END) as limited_edition_count,
        SUM(CASE WHEN chill_filtered = 0 THEN 1 ELSE 0 END) as non_chill_filtered_count,
        SUM(CASE WHEN natural_color = 1 THEN 1 ELSE 0 END) as natural_color_count,
        SUM(CASE WHEN barrel_number IS NOT NULL THEN 1 ELSE 0 END) as single_barrel_count,
        SUM(CASE WHEN awards IS NOT NULL THEN 1 ELSE 0 END) as award_winning_count
      FROM whiskeys
      WHERE created_by = ?
    `).get(userId) as any;

    // Tasting Analytics
    const tastingStats = db.prepare(`
      SELECT
        SUM(COALESCE(times_tasted, 0)) as total_tasting_sessions,
        COUNT(CASE WHEN tasting_notes IS NOT NULL THEN 1 END) as bottles_with_notes,
        COUNT(CASE WHEN nose_notes IS NOT NULL THEN 1 END) as bottles_with_nose_notes,
        COUNT(CASE WHEN palate_notes IS NOT NULL THEN 1 END) as bottles_with_palate_notes,
        COUNT(CASE WHEN finish_notes IS NOT NULL THEN 1 END) as bottles_with_finish_notes,
        COUNT(CASE WHEN food_pairings IS NOT NULL THEN 1 END) as bottles_with_pairings
      FROM whiskeys
      WHERE created_by = ?
    `).get(userId) as any;

    const mostTasted = db.prepare(`
      SELECT id, name, distillery, times_tasted, last_tasted_date
      FROM whiskeys
      WHERE created_by = ? AND times_tasted > 0
      ORDER BY times_tasted DESC
      LIMIT 10
    `).all(userId);

    // Social & Sharing
    const sharingStats = db.prepare(`
      SELECT
        COUNT(CASE WHEN shared_with IS NOT NULL THEN 1 END) as shared_bottles_count,
        COUNT(CASE WHEN is_for_sale = 1 THEN 1 END) as for_sale_count,
        COUNT(CASE WHEN is_for_trade = 1 THEN 1 END) as for_trade_count
      FROM whiskeys
      WHERE created_by = ?
    `).get(userId) as any;

    // Compile all statistics
    const statistics = {
      financial: {
        ...financialStats,
        mostValuable,
        bestROI,
      },
      inventory: {
        ...inventoryStats,
        runningLow,
        storageLocations,
      },
      composition: {
        typeDistribution,
        countryDistribution,
        topDistilleries,
        ageDistribution,
      },
      quality: {
        ...ratingStats,
        highestRated,
        ratingDistribution,
      },
      acquisition: {
        recentAcquisitions,
        purchaseLocations,
        avgPriceByType,
      },
      special: specialItems,
      tasting: {
        ...tastingStats,
        mostTasted,
      },
      sharing: sharingStats,
    };

    res.json({ statistics });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
