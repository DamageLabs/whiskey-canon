import express from 'express';
import { body, query, validationResult } from 'express-validator';
import multer from 'multer';
import { WhiskeyModel } from '../models/Whiskey';
import { WhiskeyType, Permission } from '../types';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = express.Router();

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// All whiskey routes require authentication
router.use(requireAuth);

// Get all whiskeys (with optional filters) - only returns user's own whiskeys
router.get(
  '/',
  requirePermission(Permission.READ_WHISKEY),
  [
    query('type').optional().isIn(Object.values(WhiskeyType)),
    query('distillery').optional().isString()
  ],
  (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const filters = {
        type: req.query.type as WhiskeyType | undefined,
        distillery: req.query.distillery as string | undefined,
        userId: req.user!.id
      };

      const whiskeys = WhiskeyModel.findAll(filters);
      res.json({ whiskeys });
    } catch (error) {
      console.error('Error fetching whiskeys:', error);
      res.status(500).json({ error: 'Failed to fetch whiskeys' });
    }
  }
);

// Search whiskeys - only searches user's own whiskeys
router.get(
  '/search',
  requirePermission(Permission.READ_WHISKEY),
  [query('q').notEmpty().withMessage('Search query is required')],
  (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const whiskeys = WhiskeyModel.search(req.query.q as string, req.user!.id);
      res.json({ whiskeys });
    } catch (error) {
      console.error('Error searching whiskeys:', error);
      res.status(500).json({ error: 'Failed to search whiskeys' });
    }
  }
);

// Export whiskeys to CSV - only exports user's own whiskeys
router.get(
  '/export/csv',
  requirePermission(Permission.READ_WHISKEY),
  (req: AuthRequest, res) => {
    try {
      const whiskeys = WhiskeyModel.findAll({ userId: req.user!.id });

      // Define CSV headers
      const headers = [
        'Name',
        'Type',
        'Distillery',
        'Region',
        'Country',
        'Age',
        'ABV',
        'Proof',
        'Size',
        'Quantity',
        'MSRP',
        'Secondary Price',
        'Purchase Date',
        'Purchase Price',
        'Purchase Location',
        'Bottle Code',
        'Rating',
        'Description',
        'Tasting Notes',
        'Status',
        'Is Opened',
        'Date Opened',
        'Remaining Volume',
        'Storage Location',
        'Cask Type',
        'Cask Finish',
        'Barrel Number',
        'Bottle Number',
        'Vintage Year',
        'Bottled Date',
        'Color',
        'Nose Notes',
        'Palate Notes',
        'Finish Notes',
        'Times Tasted',
        'Last Tasted Date',
        'Food Pairings',
        'Current Market Value',
        'Value Gain/Loss',
        'Is Investment Bottle',
        'Mash Bill',
        'Awards',
        'Limited Edition',
        'Chill Filtered',
        'Natural Color',
        'Is For Sale',
        'Asking Price',
        'Is For Trade',
        'Shared With',
        'Private Notes'
      ];

      // Helper function to escape CSV fields
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      // Convert whiskeys to CSV rows
      const rows = whiskeys.map(whiskey => [
        escapeCSV(whiskey.name),
        escapeCSV(whiskey.type),
        escapeCSV(whiskey.distillery),
        escapeCSV(whiskey.region),
        escapeCSV(whiskey.country),
        escapeCSV(whiskey.age),
        escapeCSV(whiskey.abv),
        escapeCSV(whiskey.proof),
        escapeCSV(whiskey.size),
        escapeCSV(whiskey.quantity),
        escapeCSV(whiskey.msrp),
        escapeCSV(whiskey.secondary_price),
        escapeCSV(whiskey.purchase_date),
        escapeCSV(whiskey.purchase_price),
        escapeCSV(whiskey.purchase_location),
        escapeCSV(whiskey.bottle_code),
        escapeCSV(whiskey.rating),
        escapeCSV(whiskey.description),
        escapeCSV(whiskey.tasting_notes),
        escapeCSV(whiskey.status),
        escapeCSV(whiskey.is_opened ? 'Yes' : 'No'),
        escapeCSV(whiskey.date_opened),
        escapeCSV(whiskey.remaining_volume),
        escapeCSV(whiskey.storage_location),
        escapeCSV(whiskey.cask_type),
        escapeCSV(whiskey.cask_finish),
        escapeCSV(whiskey.barrel_number),
        escapeCSV(whiskey.bottle_number),
        escapeCSV(whiskey.vintage_year),
        escapeCSV(whiskey.bottled_date),
        escapeCSV(whiskey.color),
        escapeCSV(whiskey.nose_notes),
        escapeCSV(whiskey.palate_notes),
        escapeCSV(whiskey.finish_notes),
        escapeCSV(whiskey.times_tasted),
        escapeCSV(whiskey.last_tasted_date),
        escapeCSV(whiskey.food_pairings),
        escapeCSV(whiskey.current_market_value),
        escapeCSV(whiskey.value_gain_loss),
        escapeCSV(whiskey.is_investment_bottle ? 'Yes' : 'No'),
        escapeCSV(whiskey.mash_bill),
        escapeCSV(whiskey.awards),
        escapeCSV(whiskey.limited_edition ? 'Yes' : 'No'),
        escapeCSV(whiskey.chill_filtered ? 'Yes' : 'No'),
        escapeCSV(whiskey.natural_color ? 'Yes' : 'No'),
        escapeCSV(whiskey.is_for_sale ? 'Yes' : 'No'),
        escapeCSV(whiskey.asking_price),
        escapeCSV(whiskey.is_for_trade ? 'Yes' : 'No'),
        escapeCSV(whiskey.shared_with),
        escapeCSV(whiskey.private_notes)
      ].join(','));

      // Combine headers and rows
      const csv = [headers.join(','), ...rows].join('\n');

      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="whiskey-collection-${new Date().toISOString().split('T')[0]}.csv"`);

      res.send(csv);
    } catch (error) {
      console.error('Error exporting whiskeys to CSV:', error);
      res.status(500).json({ error: 'Failed to export whiskeys' });
    }
  }
);

// Import whiskeys from CSV - only imports to user's own collection
router.post(
  '/import/csv',
  requirePermission(Permission.CREATE_WHISKEY),
  upload.single('file'),
  (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Parse CSV data
      const csvData = req.file.buffer.toString('utf-8');
      const lines = csvData.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        return res.status(400).json({ error: 'CSV file is empty or invalid' });
      }

      // Parse header row
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

      // Helper function to parse CSV row with proper quote handling
      const parseCSVRow = (row: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          const nextChar = row[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Escaped quote
              current += '"';
              i++; // Skip next quote
            } else {
              // Toggle quote mode
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }

        // Add last field
        result.push(current.trim());
        return result;
      };

      // Helper function to map OnlyDrams subcategory to whiskey type
      const mapSubcategoryToType = (subcategory: string): string => {
        const sub = subcategory.toLowerCase();
        if (sub === 'bourbon') return 'bourbon';
        if (sub === 'rye') return 'rye';
        if (sub.includes('single malt') || sub.includes('blended') || sub.includes('single grain')) return 'scotch';
        if (sub.includes('tennessee')) return 'tennessee';
        if (sub.includes('canadian')) return 'canadian';
        if (sub.includes('irish')) return 'irish';
        if (sub.includes('japanese')) return 'japanese';
        return 'other';
      };

      // Parse data rows and create whiskeys
      const imported: any[] = [];
      const errors: string[] = [];
      const skipped: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVRow(lines[i]);

          // Create whiskey object from CSV row
          const whiskeyData: any = {};

          headers.forEach((header, index) => {
            const value = values[index]?.replace(/^"|"$/g, '').trim();

            // Skip empty values
            if (!value || value === '') return;

            // Map CSV headers to database fields
            switch (header) {
              case 'Name':
                whiskeyData.name = value;
                break;
              case 'Type':
                whiskeyData.type = value.toLowerCase();
                break;
              case 'Subcategory':
                // OnlyDrams field - map subcategory to type
                whiskeyData.type = mapSubcategoryToType(value);
                break;
              case 'Category':
                // OnlyDrams field - skip category, we use subcategory
                break;
              case 'Distillery':
                whiskeyData.distillery = value;
                break;
              case 'Region':
                whiskeyData.region = value;
                break;
              case 'Country':
                whiskeyData.country = value;
                break;
              case 'Age':
                whiskeyData.age = parseInt(value);
                break;
              case 'ABV':
                whiskeyData.abv = parseFloat(value);
                break;
              case 'Proof':
                whiskeyData.proof = parseFloat(value);
                break;
              case 'Size':
                whiskeyData.size = value;
                break;
              case 'Quantity':
                whiskeyData.quantity = parseInt(value);
                break;
              case 'MSRP':
                whiskeyData.msrp = parseFloat(value);
                break;
              case 'Secondary Price':
              case 'Secondary':
                // OnlyDrams uses "Secondary" field name
                whiskeyData.secondary_price = parseFloat(value);
                break;
              case 'Purchase Date':
                whiskeyData.purchase_date = value;
                break;
              case 'Purchase Price':
                whiskeyData.purchase_price = parseFloat(value);
                break;
              case 'Paid':
                // OnlyDrams field for purchase price
                whiskeyData.purchase_price = parseFloat(value);
                break;
              case 'Purchase Location':
                whiskeyData.purchase_location = value;
                break;
              case 'Bottle Code':
                whiskeyData.bottle_code = value;
                break;
              case 'Rating':
                whiskeyData.rating = parseFloat(value);
                break;
              case 'Description':
                whiskeyData.description = value;
                break;
              case 'Tasting Notes':
                whiskeyData.tasting_notes = value;
                break;
              case 'Status':
                whiskeyData.status = value;
                break;
              case 'Is Opened':
                whiskeyData.is_opened = value.toLowerCase() === 'yes' || value === '1';
                break;
              case 'Date Opened':
                whiskeyData.date_opened = value;
                break;
              case 'Remaining Volume':
                whiskeyData.remaining_volume = parseFloat(value);
                break;
              case 'Storage Location':
                whiskeyData.storage_location = value;
                break;
              case 'Cask Type':
                whiskeyData.cask_type = value;
                break;
              case 'Cask Finish':
                whiskeyData.cask_finish = value;
                break;
              case 'Barrel Number':
                whiskeyData.barrel_number = value;
                break;
              case 'Bottle Number':
                whiskeyData.bottle_number = value;
                break;
              case 'Vintage Year':
                whiskeyData.vintage_year = value;
                break;
              case 'Bottled Date':
                whiskeyData.bottled_date = value;
                break;
              case 'Color':
                whiskeyData.color = value;
                break;
              case 'Nose Notes':
                whiskeyData.nose_notes = value;
                break;
              case 'Palate Notes':
                whiskeyData.palate_notes = value;
                break;
              case 'Finish Notes':
                whiskeyData.finish_notes = value;
                break;
              case 'Times Tasted':
                whiskeyData.times_tasted = parseInt(value);
                break;
              case 'Last Tasted Date':
                whiskeyData.last_tasted_date = value;
                break;
              case 'Food Pairings':
                whiskeyData.food_pairings = value;
                break;
              case 'Current Market Value':
                whiskeyData.current_market_value = parseFloat(value);
                break;
              case 'Value Gain/Loss':
                whiskeyData.value_gain_loss = parseFloat(value);
                break;
              case 'Is Investment Bottle':
                whiskeyData.is_investment_bottle = value.toLowerCase() === 'yes' || value === '1';
                break;
              case 'Mash Bill':
                whiskeyData.mash_bill = value;
                break;
              case 'Awards':
                whiskeyData.awards = value;
                break;
              case 'Limited Edition':
                whiskeyData.limited_edition = value.toLowerCase() === 'yes' || value === '1';
                break;
              case 'Chill Filtered':
                whiskeyData.chill_filtered = value.toLowerCase() === 'yes' || value === '1';
                break;
              case 'Natural Color':
                whiskeyData.natural_color = value.toLowerCase() === 'yes' || value === '1';
                break;
              case 'Is For Sale':
                whiskeyData.is_for_sale = value.toLowerCase() === 'yes' || value === '1';
                break;
              case 'Asking Price':
                whiskeyData.asking_price = parseFloat(value);
                break;
              case 'Is For Trade':
                whiskeyData.is_for_trade = value.toLowerCase() === 'yes' || value === '1';
                break;
              case 'Shared With':
                whiskeyData.shared_with = value;
                break;
              case 'Private Notes':
                whiskeyData.private_notes = value;
                break;
              case 'Rarity':
                // OnlyDrams field - append rarity to private notes
                whiskeyData.private_notes = (whiskeyData.private_notes || '') +
                  (whiskeyData.private_notes ? '\n' : '') + `Rarity: ${value}`;
                break;
              case 'Notes':
                // OnlyDrams field - append to private notes
                if (value) {
                  whiskeyData.private_notes = (whiskeyData.private_notes || '') +
                    (whiskeyData.private_notes ? '\n' : '') + value;
                }
                break;
            }
          });

          // OnlyDrams conversions
          // Calculate ABV from Proof if ABV not provided
          if (whiskeyData.proof && !whiskeyData.abv) {
            whiskeyData.abv = whiskeyData.proof / 2;
          }

          // Convert OnlyDrams Status to is_opened
          if (whiskeyData.status && whiskeyData.is_opened === undefined) {
            const status = whiskeyData.status.toLowerCase();
            if (status === 'unopened') {
              whiskeyData.is_opened = false;
            } else if (status === 'opened') {
              whiskeyData.is_opened = true;
            }
          }

          // For guntharp user, set quantity to 1 if it's 0
          if (req.user!.username === 'guntharp' && whiskeyData.quantity === 0) {
            whiskeyData.quantity = 1;
          }

          // Validate required fields
          if (!whiskeyData.name || !whiskeyData.type || !whiskeyData.distillery) {
            skipped.push(`Row ${i + 1}: Missing required fields (name, type, or distillery)`);
            continue;
          }

          // Validate whiskey type
          if (!Object.values(WhiskeyType).includes(whiskeyData.type as WhiskeyType)) {
            skipped.push(`Row ${i + 1}: Invalid whiskey type "${whiskeyData.type}"`);
            continue;
          }

          // Create whiskey
          const whiskey = WhiskeyModel.create({
            ...whiskeyData,
            created_by: req.user!.id
          });

          imported.push({
            name: whiskey.name,
            type: whiskey.type,
            id: whiskey.id
          });
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      res.json({
        message: 'CSV import completed',
        summary: {
          total: lines.length - 1,
          imported: imported.length,
          skipped: skipped.length,
          errors: errors.length
        },
        imported,
        skipped,
        errors
      });
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      res.status(500).json({ error: 'Failed to import CSV file' });
    }
  }
);

// Get single whiskey - only if it belongs to the user
router.get(
  '/:id',
  requirePermission(Permission.READ_WHISKEY),
  (req: AuthRequest, res) => {
    try {
      const whiskey = WhiskeyModel.findById(parseInt(req.params.id), req.user!.id);

      if (!whiskey) {
        return res.status(404).json({ error: 'Whiskey not found' });
      }

      res.json({ whiskey });
    } catch (error) {
      console.error('Error fetching whiskey:', error);
      res.status(500).json({ error: 'Failed to fetch whiskey' });
    }
  }
);

// Create whiskey
router.post(
  '/',
  requirePermission(Permission.CREATE_WHISKEY),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').isIn(Object.values(WhiskeyType)).withMessage('Invalid whiskey type'),
    body('distillery').trim().notEmpty().withMessage('Distillery is required'),
    body('region').optional().trim(),
    body('age').optional().isInt({ min: 0 }).withMessage('Age must be a positive number'),
    body('abv').optional().isFloat({ min: 0, max: 100 }).withMessage('ABV must be between 0 and 100'),
    body('size').optional().trim(),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a positive number'),
    body('msrp').optional().isFloat({ min: 0 }).withMessage('MSRP must be a positive number'),
    body('secondary_price').optional().isFloat({ min: 0 }).withMessage('Secondary price must be a positive number'),
    body('description').optional().trim(),
    body('tasting_notes').optional().trim(),
    body('rating').optional().isFloat({ min: 0, max: 10 }).withMessage('Rating must be between 0 and 10')
  ],
  (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // For guntharp user, set quantity to 1 if it's 0
      const whiskeyData = { ...req.body };
      if (req.user!.username === 'guntharp' && whiskeyData.quantity === 0) {
        whiskeyData.quantity = 1;
      }

      const whiskey = WhiskeyModel.create({
        ...whiskeyData,
        created_by: req.user!.id
      });

      res.status(201).json({
        message: 'Whiskey created successfully',
        whiskey
      });
    } catch (error) {
      console.error('Error creating whiskey:', error);
      res.status(500).json({ error: 'Failed to create whiskey' });
    }
  }
);

// Update whiskey - only if it belongs to the user
router.put(
  '/:id',
  requirePermission(Permission.UPDATE_WHISKEY),
  [
    body('name').optional().trim().notEmpty(),
    body('type').optional().isIn(Object.values(WhiskeyType)),
    body('distillery').optional().trim().notEmpty(),
    body('region').optional().trim(),
    body('age').optional().isInt({ min: 0 }),
    body('abv').optional().isFloat({ min: 0, max: 100 }),
    body('size').optional().trim(),
    body('quantity').optional().isInt({ min: 0 }),
    body('msrp').optional().isFloat({ min: 0 }),
    body('secondary_price').optional().isFloat({ min: 0 }),
    body('description').optional().trim(),
    body('tasting_notes').optional().trim(),
    body('rating').optional().isFloat({ min: 0, max: 10 })
  ],
  (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // For guntharp user, set quantity to 1 if it's 0
      const whiskeyData = { ...req.body };
      if (req.user!.username === 'guntharp' && whiskeyData.quantity === 0) {
        whiskeyData.quantity = 1;
      }

      console.log('Updating whiskey with data:', whiskeyData);
      const whiskey = WhiskeyModel.update(parseInt(req.params.id), whiskeyData, req.user!.id);

      if (!whiskey) {
        return res.status(404).json({ error: 'Whiskey not found or you do not have permission to update it' });
      }

      res.json({
        message: 'Whiskey updated successfully',
        whiskey
      });
    } catch (error) {
      console.error('Error updating whiskey:', error);
      res.status(500).json({ error: 'Failed to update whiskey' });
    }
  }
);

// Delete whiskey - only if it belongs to the user
router.delete(
  '/:id',
  requirePermission(Permission.DELETE_WHISKEY),
  (req: AuthRequest, res) => {
    try {
      const deleted = WhiskeyModel.delete(parseInt(req.params.id), req.user!.id);

      if (!deleted) {
        return res.status(404).json({ error: 'Whiskey not found or you do not have permission to delete it' });
      }

      res.json({ message: 'Whiskey deleted successfully' });
    } catch (error) {
      console.error('Error deleting whiskey:', error);
      res.status(500).json({ error: 'Failed to delete whiskey' });
    }
  }
);

export default router;
