import { Request, Response, NextFunction } from 'express';
import { ErrorCodes, ErrorMessages } from '../utils/errorCodes';
import { validateToken } from '../utils/token';

export default async function AuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = validateToken(req);

    if (!token) {
        return res.status(401).json({
            error: ErrorMessages.NO_AUTH_TOKEN,
            code: ErrorCodes.NO_AUTH_TOKEN
        });
    }

    next();
};
