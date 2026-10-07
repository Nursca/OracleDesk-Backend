import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { sendError } from '../utils/response.util';

export interface JwtPayload {
  userId: string;
  walletAddress: string;
  iat: number;
  exp: number;
}

// Extend Express Request to carry the decoded JWT
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function decode(req: Request): { user?: JwtPayload; error?: 'missing' | 'expired' | 'invalid' } {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return { error: 'missing' };
  try {
    return { user: jwt.verify(authHeader.slice(7), config.JWT_SECRET) as JwtPayload };
  } catch (err) {
    return { error: err instanceof jwt.TokenExpiredError ? 'expired' : 'invalid' };
  }
}

/**
 * Require a valid JWT Bearer token. Attaches decoded payload to req.user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const { user, error } = decode(req);
  if (user) {
    req.user = user;
    next();
    return;
  }
  if (error === 'missing') sendError(res, 401, 'UNAUTHORIZED', 'Missing or malformed Authorization header');
  else if (error === 'expired') sendError(res, 401, 'TOKEN_EXPIRED', 'Token has expired');
  else sendError(res, 401, 'INVALID_TOKEN', 'Token is invalid');
}

/** Attaches req.user when a valid token is present; never rejects. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const { user } = decode(req);
  if (user) req.user = user;
  next();
}

/**
 * Must run after requireAuth. Admins are the G… addresses in ADMIN_ADDRESSES,
 * compared exactly (StrKey is uppercase and case-sensitive).
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !config.ADMIN_ADDRESSES.includes(req.user.walletAddress)) {
    sendError(res, 403, 'FORBIDDEN', 'This action is limited to OracleDesk admins');
    return;
  }
  next();
}

/**
 * Generate a signed JWT for a user
 */
export function signToken(userId: string, walletAddress: string): string {
  return jwt.sign({ userId, walletAddress }, config.JWT_SECRET, { expiresIn: '7d' });
}
