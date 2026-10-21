import jwt from 'jsonwebtoken';
import { config } from '../config';

export function signToken(payload: { sub: string; phone: string }): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): { sub: string; phone: string } {
  const decoded = jwt.verify(token, config.jwtSecret);
  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    typeof (decoded as Record<string, unknown>).phone !== 'string'
  ) {
    throw new Error('Invalid token payload');
  }

  return {
    sub: decoded.sub,
    phone: (decoded as Record<string, unknown>).phone as string,
  };
}
