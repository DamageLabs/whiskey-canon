import dotenv from 'dotenv';
import path from 'path';
import { logger } from './logger';

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
  sessionSecret: isProduction
    ? required('SESSION_SECRET')
    : optional('SESSION_SECRET', 'whiskey-bible-secret'),
  frontendUrl: isProduction
    ? required('FRONTEND_URL')
    : optional('FRONTEND_URL', 'http://localhost:5173'),
  databasePath: optional('DATABASE_PATH', path.join(__dirname, '../../whiskey.db')),
  resendApiKey: process.env.RESEND_API_KEY || null,
  resendFromEmail: optional('RESEND_FROM_EMAIL', 'noreply@whiskey-canon.com'),
  contactEmail:
    process.env.CONTACT_EMAIL || process.env.RESEND_FROM_EMAIL || 'noreply@whiskey-canon.com',
  backupDir: optional('BACKUP_DIR', path.join(__dirname, '../../backups')),
  backupMaxSizeMb: parseInt(optional('BACKUP_MAX_SIZE_MB', '50'), 10),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || null,
  openaiApiKey: process.env.OPENAI_API_KEY || null,
  ollamaBaseUrl: optional('OLLAMA_BASE_URL', 'http://localhost:11434'),
  ollamaTextModel: optional('OLLAMA_TEXT_MODEL', 'llama3.1:8b'),
  ollamaVisionModel: optional('OLLAMA_VISION_MODEL', 'minicpm-v'),
  apiKeyEncryptionSecret: isProduction
    ? required('API_KEY_ENCRYPTION_SECRET')
    : optional('API_KEY_ENCRYPTION_SECRET', 'dev-encryption-secret-min-32-chars!!'),
} as const;

export function validateConfig(): void {
  const redacted = (val: string | null): string => (val ? '[set]' : '[not set]');

  logger.info(
    {
      port: config.port,
      nodeEnv: config.nodeEnv,
      sessionSecret: redacted(config.sessionSecret),
      frontendUrl: config.frontendUrl,
      databasePath: config.databasePath,
      resendApiKey: `${redacted(config.resendApiKey)}${config.resendApiKey ? '' : ' — email features disabled'}`,
      resendFromEmail: config.resendFromEmail,
      contactEmail: config.contactEmail,
    },
    'Configuration loaded'
  );
}
