import { NextFunction, Request, Response } from 'express';
import { HttpError } from './error';
import { verifyToken } from '../services/token';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError(401, 'Authentication token missing or invalid');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new HttpError(401, 'Authentication token missing or invalid');
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    throw new HttpError(401, 'Invalid or expired authentication token');
  }
}
