import { Request } from 'express';
import jwt from "jsonwebtoken";

interface JwtPayload {
    userid: string;
    email:  string;
    iat:    number;
    exp:    number;
}

interface payloadToEncode {
    userid: string;
    email:  string;
}

const SECRET_TOKEN = process.env.TOKEN_SECRET || 'testtoken123';

export  function decodeToken(token: string) {
    const decoded = jwt.verify(
        token,
        SECRET_TOKEN
    ) as unknown as JwtPayload;

    return decoded;
}

export function generateToken(payload: payloadToEncode) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + (30 * 24 * 60 * 60);
    return jwt.sign(
        { ...payload, iat, exp },
        SECRET_TOKEN
    );
}

export function validateToken(req: Request) :null | JwtPayload {
    try {
        if(req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                const token   = authHeader.substring(7);
                const decoded = decodeToken(token);

                //check validity
                if(decoded.exp < Date.now() / 1000) {
                    return null;
                }

                //return decoded token
                return decoded;
            }
        }
        return null;
    } catch (error) {
        return null;
    }
}