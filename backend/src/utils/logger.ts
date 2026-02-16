import pino from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';

const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  ...(isDev && !isTest
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }
    : {}),
  ...(isTest ? { level: 'silent' } : {}),
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    return (req.headers['x-request-id'] as string) || randomUUID();
  },
  customProps: (req) => {
    const user = (req as any).user;
    if (user) {
      return { userId: user.id, username: user.username };
    }
    return {};
  },
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'req.body.password',
      'req.body.apiKey',
      'req.body.token',
    ],
    censor: '[REDACTED]',
  },
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
});
