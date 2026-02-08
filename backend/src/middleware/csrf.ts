import { doubleCsrf } from 'csrf-csrf';
import { config } from '../utils/config';

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => config.sessionSecret,
  getSessionIdentifier: (req) => (req as any).session?.id ?? '',
  cookieName: '__csrf',
  cookieOptions: {
    httpOnly: false,
    sameSite: config.isProduction ? 'strict' : 'lax',
    secure: config.isProduction,
    path: '/',
  },
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

export const generateToken = generateCsrfToken;
export const csrfProtection = doubleCsrfProtection;
