export enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export enum Permission {
  CREATE_WHISKEY = 'create:whiskey',
  READ_WHISKEY = 'read:whiskey',
  UPDATE_WHISKEY = 'update:whiskey',
  DELETE_WHISKEY = 'delete:whiskey',
  MANAGE_USERS = 'manage:users'
}

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: Role;
  first_name?: string;
  last_name?: string;
  profile_photo?: string;
  email_verified: number;
  verification_code?: string;
  verification_code_expires_at?: string;
  verification_code_attempts: number;
  password_reset_token?: string;
  password_reset_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Whiskey {
  id: number;
  name: string;
  type: WhiskeyType;
  distillery: string;
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

  created_by: number;
  created_at: string;
  updated_at: string;
}

export enum WhiskeyType {
  BOURBON = 'bourbon',
  SCOTCH = 'scotch',
  IRISH = 'irish',
  JAPANESE = 'japanese',
  RYE = 'rye',
  TENNESSEE = 'tennessee',
  CANADIAN = 'canadian',
  OTHER = 'other'
}

export enum WhiskeyStatus {
  IN_COLLECTION = 'in_collection',
  CONSUMED = 'consumed',
  SOLD = 'sold',
  GIFTED = 'gifted',
  TRADED = 'traded'
}

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.CREATE_WHISKEY,
    Permission.READ_WHISKEY,
    Permission.UPDATE_WHISKEY,
    Permission.DELETE_WHISKEY,
    Permission.MANAGE_USERS
  ],
  [Role.EDITOR]: [
    Permission.CREATE_WHISKEY,
    Permission.READ_WHISKEY,
    Permission.UPDATE_WHISKEY
  ],
  [Role.VIEWER]: [
    Permission.READ_WHISKEY
  ]
};

export interface WhiskeyComment {
  id: number;
  whiskey_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  username?: string;
  profile_photo?: string;
}
