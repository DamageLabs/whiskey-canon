import { Request, Response, NextFunction } from 'express';
import { User } from '../types';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export interface AuthRequest extends Request {
  user?: User;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function attachUser(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.session.userId) {
    const { UserModel } = require('../models/User');
    req.user = UserModel.findById(req.session.userId);
  }
  next();
}
