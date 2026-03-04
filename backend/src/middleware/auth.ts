import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../db/pool.ts";
import { ZodSchema, ZodError } from "zod";

export interface AuthPayload {
    userId: string;
}

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid Authorization header" });
        return;
    }
    try {
        const token = header.slice(7);
        const secret = getEnv("JWT_SECRET", "super-secret-university-project-key");
        const payload = jwt.verify(token, secret) as AuthPayload;
        req.userId = payload.userId;
        next();
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

export function signToken(userId: string): string {
    const secret = getEnv("JWT_SECRET", "super-secret-university-project-key");
    return jwt.sign({ userId } satisfies AuthPayload, secret, { expiresIn: "30d" });
}

export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({ error: "Validation failed", details: err.errors });
                return;
            }
            next(err);
        }
    };
}
