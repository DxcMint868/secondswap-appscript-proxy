import { Request, Response, NextFunction } from 'express';
import config from '../config/env';

/**
 * Middleware to validate API secret from query parameters
 */
export const validateApiSecret = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.query.apiSecret !== config.apiSecret) {
    res.status(401).json({ error: "Invalid API secret" });
    return;
  }
  next();
};
