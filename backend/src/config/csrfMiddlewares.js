import crypto from 'crypto';
import { redisClient } from '../index.js';
import { ca, cs } from 'zod/v4/locales';

export const  generateCSRFToken = async (userId, res) => {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const csrfKey = `csrf:${userId}`;
    await redisClient.setEx(csrfKey, 3600, csrfToken); // Store CSRF token with expiration of 1 hour
    res.cookie('csrfToken', csrfToken, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 1000 // 1 hour
    });
    return csrfToken;
}

export const verifyCSRFToken = async (req, res, next) => {
    try {
        if(req.method === 'GET') {
            return next();
        }
        const userId = req.user?._id;

        if(!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const clientToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'] || req.headers['csrf-token'];
        if(!clientToken) {
            return res.status(403).json({ message: 'CSRF token missing', code: "CSRF_TOKEN_MISSING" });
        }
        const csrfKey = `csrf:${userId}`;
        const storedToken = await redisClient.get(csrfKey);
        if(!storedToken) {
            return res.status(403).json({ message: 'CSRF token expired. please try again', code: "CSRF_TOKEN_EXPIRED" });
        }
        if(storedToken !== clientToken) {
            return res.status(403).json({ message: 'Invalid CSRF token. please refresh this page and try again', code: "CSRF_TOKEN_INVALID" });
        }
        next();
    } catch (error) {
        console.log("Error verifying CSRF token:", error);
        return res.status(500).json({ message: 'CSRF verification error', code: "CSRF_VERIFICATION_FAILED" });
    }
}

export const revokeCSRFToken = async (userId) => {
    const csrfKey = `csrf:${userId}`;
    await redisClient.del(csrfKey);
}

export const refreshCSRFToken = async (userId, res) => {
    await revokeCSRFToken(userId);
    return await generateCSRFToken(userId, res);
}