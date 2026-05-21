import { Request, Response, NextFunction } from 'express';
import { READ_ONLY_MODE } from './config.js';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!READ_ONLY_MODE) {
        return next();
    }
    res.status(403).json({ error: 'Read Only Mode: Admin access required.' });
};
