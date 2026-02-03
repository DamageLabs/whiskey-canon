import { db } from '../utils/database';
import { Whiskey, WhiskeyType, WhiskeyStatus } from '../types';

export interface CreateWhiskeyData {
  // Required fields
  name: string;
  type: WhiskeyType;
  distillery: string;
  created_by: number;

  // Basic Optional Fields
  region?: string;
  age?: number;
  abv?: number;
  size?: string;
  quantity?: number;
  msrp?: number;
  secondary_price?: number;
  description?: string;
  tasting_notes?: string;
  rating?: number;

  // Purchase & Acquisition Tracking
  purchase_date?: string;
  purchase_price?: number;
  purchase_location?: string;
  obtained_from?: string;
  bottle_code?: string;

  // Inventory Management
  is_opened?: boolean;
  date_opened?: string;
  remaining_volume?: number;
  storage_location?: string;
  status?: WhiskeyStatus;

  // Cask & Production Details
  cask_type?: string;
  cask_finish?: string;
  barrel_number?: string;
  bottle_number?: string;
  vintage_year?: string;
  bottled_date?: string;

  // Enhanced Tasting Experience
  color?: string;
  nose_notes?: string;
  palate_notes?: string;
  finish_notes?: string;
  times_tasted?: number;
  last_tasted_date?: string;
  food_pairings?: string;

  // Investment & Value Tracking
  current_market_value?: number;
  value_gain_loss?: number;
  is_investment_bottle?: boolean;

  // Additional Metadata
  country?: string;
  mash_bill?: string;
  proof?: number;
  limited_edition?: boolean;
  awards?: string;
  chill_filtered?: boolean;
  natural_color?: boolean;

  // Visual & Documentation
  image_url?: string;
  label_image_url?: string;
  receipt_image_url?: string;

  // Social & Sharing
  is_for_sale?: boolean;
  asking_price?: number;
  is_for_trade?: boolean;
  shared_with?: string;
  private_notes?: string;
}

export interface UpdateWhiskeyData {
  // All fields optional for updates
  name?: string;
  type?: WhiskeyType;
  distillery?: string;
  region?: string;
  age?: number;
  abv?: number;
  size?: string;
  quantity?: number;
  msrp?: number;
  secondary_price?: number;
  description?: string;
  tasting_notes?: string;
  rating?: number;

  // Purchase & Acquisition Tracking
  purchase_date?: string;
  purchase_price?: number;
  purchase_location?: string;
  obtained_from?: string;
  bottle_code?: string;

  // Inventory Management
  is_opened?: boolean;
  date_opened?: string;
  remaining_volume?: number;
  storage_location?: string;
  status?: WhiskeyStatus;

  // Cask & Production Details
  cask_type?: string;
  cask_finish?: string;
  barrel_number?: string;
  bottle_number?: string;
  vintage_year?: string;
  bottled_date?: string;

  // Enhanced Tasting Experience
  color?: string;
  nose_notes?: string;
  palate_notes?: string;
  finish_notes?: string;
  times_tasted?: number;
  last_tasted_date?: string;
  food_pairings?: string;

  // Investment & Value Tracking
  current_market_value?: number;
  value_gain_loss?: number;
  is_investment_bottle?: boolean;

  // Additional Metadata
  country?: string;
  mash_bill?: string;
  proof?: number;
  limited_edition?: boolean;
  awards?: string;
  chill_filtered?: boolean;
  natural_color?: boolean;

  // Visual & Documentation
  image_url?: string;
  label_image_url?: string;
  receipt_image_url?: string;

  // Social & Sharing
  is_for_sale?: boolean;
  asking_price?: number;
  is_for_trade?: boolean;
  shared_with?: string;
  private_notes?: string;
}

export class WhiskeyModel {
  static create(data: CreateWhiskeyData): Whiskey {
    const stmt = db.prepare(`
      INSERT INTO whiskeys (
        name, type, distillery, region, age, abv, size,
        quantity, msrp, secondary_price,
        description, tasting_notes, rating,
        purchase_date, purchase_price, purchase_location, obtained_from, bottle_code,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name,
      data.type,
      data.distillery,
      data.region || null,
      data.age || null,
      data.abv || null,
      data.size || null,
      data.quantity || null,
      data.msrp || null,
      data.secondary_price || null,
      data.description || null,
      data.tasting_notes || null,
      data.rating || null,
      data.purchase_date || null,
      data.purchase_price || null,
      data.purchase_location || null,
      data.obtained_from || null,
      data.bottle_code || null,
      data.created_by
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number, userId?: number): Whiskey | undefined {
    let query = 'SELECT * FROM whiskeys WHERE id = ?';
    const params: any[] = [id];

    if (userId !== undefined) {
      query += ' AND created_by = ?';
      params.push(userId);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params) as Whiskey | undefined;
  }

  static findAll(filters?: { type?: WhiskeyType; distillery?: string; userId?: number }): Whiskey[] {
    let query = 'SELECT * FROM whiskeys WHERE 1=1';
    const params: any[] = [];

    if (filters?.userId !== undefined) {
      query += ' AND created_by = ?';
      params.push(filters.userId);
    }

    if (filters?.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters?.distillery) {
      query += ' AND distillery LIKE ?';
      params.push(`%${filters.distillery}%`);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params) as Whiskey[];
  }

  static update(id: number, data: UpdateWhiskeyData, userId?: number): Whiskey | undefined {
    const updates: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        // Convert booleans to 0/1 for SQLite compatibility
        if (typeof value === 'boolean') {
          params.push(value ? 1 : 0);
        } else if (value === '' || value === null) {
          params.push(null);
        } else {
          params.push(value);
        }
      }
    });

    if (updates.length === 0) {
      return this.findById(id, userId);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    let query = `
      UPDATE whiskeys
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    if (userId !== undefined) {
      query += ' AND created_by = ?';
      params.push(userId);
    }

    const stmt = db.prepare(query);
    const result = stmt.run(...params);

    // If no rows were updated, the whiskey doesn't exist or doesn't belong to the user
    if (result.changes === 0) {
      return undefined;
    }

    return this.findById(id, userId);
  }

  static delete(id: number, userId?: number): boolean {
    let query = 'DELETE FROM whiskeys WHERE id = ?';
    const params: any[] = [id];

    if (userId !== undefined) {
      query += ' AND created_by = ?';
      params.push(userId);
    }

    const stmt = db.prepare(query);
    const result = stmt.run(...params);
    return result.changes > 0;
  }

  static search(searchTerm: string, userId?: number): Whiskey[] {
    let query = `
      SELECT * FROM whiskeys
      WHERE (name LIKE ? OR distillery LIKE ? OR description LIKE ?)
    `;
    const params: any[] = [];
    const term = `%${searchTerm}%`;
    params.push(term, term, term);

    if (userId !== undefined) {
      query += ' AND created_by = ?';
      params.push(userId);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params) as Whiskey[];
  }

  static findAllWithOwners(): any[] {
    const query = `
      SELECT
        w.*,
        u.username as owner_username,
        u.email as owner_email,
        u.role as owner_role
      FROM whiskeys w
      JOIN users u ON w.created_by = u.id
      ORDER BY u.username ASC, w.created_at DESC
    `;

    const stmt = db.prepare(query);
    return stmt.all();
  }
}
