import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  port: parseInt(optional('PORT', '3000'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),
  isProduction,
  sessionSecret: isProduction ? required('SESSION_SECRET') : optional('SESSION_SECRET', 'whiskey-bible-secret'),
  frontendUrl: isProduction ? required('FRONTEND_URL') : optional('FRONTEND_URL', 'http://localhost:5173'),
  databasePath: optional('DATABASE_PATH', path.join(__dirname, '../../whiskey.db')),
  resendApiKey: process.env.RESEND_API_KEY || null,
  resendFromEmail: optional('RESEND_FROM_EMAIL', 'noreply@whiskey-canon.com'),
  contactEmail: process.env.CONTACT_EMAIL || process.env.RESEND_FROM_EMAIL || 'noreply@whiskey-canon.com',
} as const;

export function validateConfig(): void {
  const redacted = (val: string | null): string =>
    val ? '[set]' : '[not set]';

  console.log('Configuration loaded:');
  console.log(`  port: ${config.port}`);
  console.log(`  nodeEnv: ${config.nodeEnv}`);
  console.log(`  sessionSecret: ${redacted(config.sessionSecret)}`);
  console.log(`  frontendUrl: ${config.frontendUrl}`);
  console.log(`  databasePath: ${config.databasePath}`);
  console.log(`  resendApiKey: ${redacted(config.resendApiKey)}${config.resendApiKey ? '' : ' — email features disabled'}`);
  console.log(`  resendFromEmail: ${config.resendFromEmail}`);
  console.log(`  contactEmail: ${config.contactEmail}`);
}
