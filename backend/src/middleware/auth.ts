import { Request, Response, NextFunction } from 'express';
import { User } from '../types';
import { UserModel } from '../models/User';

declare module 'express-session' {
  interface SessionData {
    userId: number;
    csrfInit?: boolean;
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
    req.user = UserModel.findById(req.session.userId);
  }
  next();
}
