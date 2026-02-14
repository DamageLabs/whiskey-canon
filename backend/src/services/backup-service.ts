import fs from 'fs';
import path from 'path';
import { db } from '../utils/database';
import { BackupModel } from '../models/Backup';
import { config } from '../utils/config';
import { User, Whiskey, WhiskeyComment } from '../types';

const SCHEMA_VERSION = 1;

export interface BackupData {
  schemaVersion: number;
  exportedAt: string;
  user: Omit<
    User,
    | 'password'
    | 'verification_code'
    | 'verification_code_expires_at'
    | 'verification_code_attempts'
    | 'password_reset_token'
    | 'password_reset_expires_at'
  >;
  whiskeys: Whiskey[];
  comments: Array<Omit<WhiskeyComment, 'username' | 'profile_photo'>>;
}

export interface RestorePreview {
  whiskeyCount: number;
  commentCount: number;
  newWhiskeys: number;
  duplicateWhiskeys: number;
  newComments: number;
}

function getBackupDir(): string {
  const backupDir = config.backupDir || path.join(__dirname, '../../backups');
  return path.resolve(backupDir);
}

function ensureBackupDir(userId: number): string {
  const userDir = path.join(getBackupDir(), String(userId));
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

function getUserProfile(userId: number) {
  const stmt = db.prepare(`
    SELECT id, username, email, role, first_name, last_name, profile_photo,
           email_verified, is_profile_public, created_at, updated_at
    FROM users WHERE id = ?
  `);
  return stmt.get(userId);
}

function getUserWhiskeys(userId: number): Whiskey[] {
  const stmt = db.prepare('SELECT * FROM whiskeys WHERE created_by = ? ORDER BY created_at DESC');
  return stmt.all(userId) as Whiskey[];
}

function getUserComments(userId: number) {
  const stmt = db.prepare(
    'SELECT id, whiskey_id, user_id, content, created_at, updated_at FROM whiskey_comments WHERE user_id = ? ORDER BY created_at DESC'
  );
  return stmt.all(userId);
}

export function generateBackup(userId: number, format: string, triggerType: string) {
  const userProfile = getUserProfile(userId);
  if (!userProfile) {
    throw new Error('User not found');
  }

  const whiskeys = getUserWhiskeys(userId);
  const comments = getUserComments(userId);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.${format}`;
  const userDir = ensureBackupDir(userId);
  const filePath = path.join(userDir, filename);

  let content: string;

  if (format === 'json') {
    const backupData: BackupData = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      user: userProfile as BackupData['user'],
      whiskeys,
      comments: comments as BackupData['comments'],
    };
    content = JSON.stringify(backupData, null, 2);
  } else {
    content = generateCSVBackup(whiskeys);
  }

  fs.writeFileSync(filePath, content, 'utf-8');

  const sizeBytes = fs.statSync(filePath).size;
  const record = BackupModel.create(
    userId,
    filename,
    format,
    triggerType,
    sizeBytes,
    whiskeys.length,
    comments.length
  );

  return record;
}

function generateCSVBackup(whiskeys: Whiskey[]): string {
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
    'Private Notes',
  ];

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = whiskeys.map((w) =>
    [
      w.name,
      w.type,
      w.distillery,
      w.region,
      w.country,
      w.age,
      w.abv,
      w.proof,
      w.size,
      w.quantity,
      w.msrp,
      w.secondary_price,
      w.purchase_date,
      w.purchase_price,
      w.purchase_location,
      w.bottle_code,
      w.rating,
      w.description,
      w.tasting_notes,
      w.status,
      w.is_opened ? 'Yes' : 'No',
      w.date_opened,
      w.remaining_volume,
      w.storage_location,
      w.cask_type,
      w.cask_finish,
      w.barrel_number,
      w.bottle_number,
      w.vintage_year,
      w.bottled_date,
      w.color,
      w.nose_notes,
      w.palate_notes,
      w.finish_notes,
      w.times_tasted,
      w.last_tasted_date,
      w.food_pairings,
      w.current_market_value,
      w.value_gain_loss,
      w.is_investment_bottle ? 'Yes' : 'No',
      w.mash_bill,
      w.awards,
      w.limited_edition ? 'Yes' : 'No',
      w.chill_filtered ? 'Yes' : 'No',
      w.natural_color ? 'Yes' : 'No',
      w.is_for_sale ? 'Yes' : 'No',
      w.asking_price,
      w.is_for_trade ? 'Yes' : 'No',
      w.shared_with,
      w.private_notes,
    ]
      .map(escapeCSV)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function getBackupFilePath(userId: number, filename: string): string | null {
  const filePath = path.join(getBackupDir(), String(userId), filename);
  // Prevent path traversal
  const resolved = path.resolve(filePath);
  const expectedDir = path.resolve(getBackupDir(), String(userId));
  if (!resolved.startsWith(expectedDir)) {
    return null;
  }
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return filePath;
}

export function deleteBackupFile(userId: number, filename: string): boolean {
  const filePath = getBackupFilePath(userId, filename);
  if (filePath) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

export function validateAndStoreUpload(
  userId: number,
  buffer: Buffer,
  originalFilename: string
): { backup: ReturnType<typeof BackupModel.create>; data: BackupData } {
  // Parse JSON
  let data: BackupData;
  try {
    data = JSON.parse(buffer.toString('utf-8'));
  } catch {
    throw new Error('Invalid JSON file');
  }

  // Validate required fields
  if (!data.schemaVersion || typeof data.schemaVersion !== 'number') {
    throw new Error('Missing or invalid schemaVersion');
  }
  if (!Array.isArray(data.whiskeys)) {
    throw new Error('Missing or invalid whiskeys array');
  }
  if (!Array.isArray(data.comments)) {
    throw new Error('Missing or invalid comments array');
  }

  // Write file to user backup directory
  const userDir = ensureBackupDir(userId);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `upload-${timestamp}.json`;
  const filePath = path.join(userDir, filename);
  fs.writeFileSync(filePath, buffer);

  const sizeBytes = buffer.length;
  const record = BackupModel.create(
    userId,
    filename,
    'json',
    'upload',
    sizeBytes,
    data.whiskeys.length,
    data.comments.length
  );

  return { backup: record, data };
}

export function restorePreview(userId: number, backupId: number): RestorePreview {
  const record = BackupModel.findById(backupId, userId);
  if (!record) {
    throw new Error('Backup not found');
  }

  if (record.format !== 'json') {
    throw new Error('Only JSON backups can be restored');
  }

  const filePath = getBackupFilePath(userId, record.filename);
  if (!filePath) {
    throw new Error('Backup file not found');
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content) as BackupData;

  const existingWhiskeys = getUserWhiskeys(userId);
  const existingNames = new Set(existingWhiskeys.map((w) => `${w.name}|${w.distillery}`));

  let newWhiskeys = 0;
  let duplicateWhiskeys = 0;
  for (const w of data.whiskeys) {
    const key = `${w.name}|${w.distillery}`;
    if (existingNames.has(key)) {
      duplicateWhiskeys++;
    } else {
      newWhiskeys++;
    }
  }

  return {
    whiskeyCount: data.whiskeys.length,
    commentCount: data.comments.length,
    newWhiskeys,
    duplicateWhiskeys,
    newComments: data.comments.length,
  };
}

export function restoreFromBackup(
  userId: number,
  backupId: number,
  conflictStrategy: 'skip' | 'overwrite' = 'skip'
): { whiskeysRestored: number; commentsRestored: number; skipped: number } {
  const record = BackupModel.findById(backupId, userId);
  if (!record) {
    throw new Error('Backup not found');
  }

  if (record.format !== 'json') {
    throw new Error('Only JSON backups can be restored');
  }

  const filePath = getBackupFilePath(userId, record.filename);
  if (!filePath) {
    throw new Error('Backup file not found');
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content) as BackupData;

  if (!data.schemaVersion || !data.whiskeys) {
    throw new Error('Invalid backup format');
  }

  const existingWhiskeys = getUserWhiskeys(userId);
  const existingMap = new Map(existingWhiskeys.map((w) => [`${w.name}|${w.distillery}`, w]));

  let whiskeysRestored = 0;
  let skipped = 0;
  let commentsRestored = 0;

  // Map old whiskey IDs to new ones for comment restoration
  const idMap = new Map<number, number>();

  const transaction = db.transaction(() => {
    for (const w of data.whiskeys) {
      const key = `${w.name}|${w.distillery}`;
      const existing = existingMap.get(key);

      if (existing && conflictStrategy === 'skip') {
        idMap.set(w.id, existing.id);
        skipped++;
        continue;
      }

      if (existing && conflictStrategy === 'overwrite') {
        // Update existing whiskey
        const { id, created_by, created_at, updated_at, ...fields } = w;
        const setClauses = Object.keys(fields)
          .map((k) => `${k} = ?`)
          .join(', ');
        const values = Object.values(fields).map((v) =>
          typeof v === 'boolean' ? (v ? 1 : 0) : (v ?? null)
        );
        if (setClauses) {
          const stmt = db.prepare(
            `UPDATE whiskeys SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND created_by = ?`
          );
          stmt.run(...values, existing.id, userId);
        }
        idMap.set(w.id, existing.id);
        whiskeysRestored++;
        continue;
      }

      // Insert new whiskey
      const { id, created_by, created_at, updated_at, ...fields } = w;
      const columns = Object.keys(fields);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(fields).map((v) =>
        typeof v === 'boolean' ? (v ? 1 : 0) : (v ?? null)
      );

      const stmt = db.prepare(
        `INSERT INTO whiskeys (${columns.join(', ')}, created_by) VALUES (${placeholders}, ?)`
      );
      const result = stmt.run(...values, userId);
      idMap.set(w.id, result.lastInsertRowid as number);
      whiskeysRestored++;
    }

    // Restore comments
    for (const c of data.comments) {
      const newWhiskeyId = idMap.get(c.whiskey_id);
      if (!newWhiskeyId) continue;

      const stmt = db.prepare(
        'INSERT INTO whiskey_comments (whiskey_id, user_id, content) VALUES (?, ?, ?)'
      );
      stmt.run(newWhiskeyId, userId, c.content);
      commentsRestored++;
    }
  });

  transaction();

  return { whiskeysRestored, commentsRestored, skipped };
}
