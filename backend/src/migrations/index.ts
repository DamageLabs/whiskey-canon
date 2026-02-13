import { Migration } from '../utils/migration-runner';
import { migration as m001 } from './001_initial_tables';
import { migration as m002 } from './002_add_user_profile_fields';
import { migration as m003 } from './003_add_email_verification';
import { migration as m004 } from './004_add_password_reset';
import { migration as m005 } from './005_add_profile_visibility';
import { migration as m006 } from './006_add_purchase_tracking';
import { migration as m007 } from './007_add_inventory_management';
import { migration as m008 } from './008_add_cask_details';
import { migration as m009 } from './009_add_tasting_fields';
import { migration as m010 } from './010_add_investment_tracking';
import { migration as m011 } from './011_add_metadata_fields';
import { migration as m012 } from './012_add_image_fields';
import { migration as m013 } from './013_add_social_fields';
import { migration as m014 } from './014_add_backup_tables';
import { migration as m015 } from './015_add_indexes';

export const allMigrations: Migration[] = [
  m001,
  m002,
  m003,
  m004,
  m005,
  m006,
  m007,
  m008,
  m009,
  m010,
  m011,
  m012,
  m013,
  m014,
  m015,
];
