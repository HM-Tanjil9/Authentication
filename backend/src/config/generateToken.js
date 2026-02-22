import jwt from 'jsonwebtoken';
import { redisClient } from '../index.js';
import { generateCSRFToken, revokeCSRFToken } from './csrfMiddlewares.js';
import crypto from 'crypto';

export const generateToken = async (id, res) => {
    const sessionId = crypto.randomBytes(16).toString('hex');

    const accessToken = jwt.sign({ id, sessionId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m'
    });

    const refreshToken = jwt.sign({ id, sessionId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d'
    });

    const refreshTokenKey = `refresh_token:${id}`;
    const activeSessionKey = `active_session:${id}`;
    const sessionDataKey = `session:${sessionId}`;

    const existingSessionId = await redisClient.get(activeSessionKey);
    if (existingSessionId) {
        await redisClient.del(`session:${existingSessionId}`);
        await redisClient.del(refreshTokenKey);
    }

    const sessionData = {
        userId: id,
        sessionId,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
    };

    await redisClient.setEx(refreshTokenKey, 7*24*60*60, refreshToken); // Store refresh token with expiration of 7 days

    await redisClient.setEx(sessionDataKey, 7*24*60*60, JSON.stringify(sessionData)); // Store session data with expiration of 7 days

    await redisClient.setEx(activeSessionKey, 7*24*60*60, sessionId); // Mark this session as active for the user

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 15 * 60 * 1000 // 1 minute
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const csrfToken = await generateCSRFToken(id, res);

    return { accessToken, refreshToken, csrfToken, sessionId };
}

export const verifyRefreshToken = async (refreshToken) => {
    try {
        const decodedData = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        const storedToken = await redisClient.get(`refresh_token:${decodedData.id}`);
        
        if (storedToken !== refreshToken) {
            return null;
        }

        const activeSessionId = await redisClient.get(`active_session:${decodedData.id}`);
        if (activeSessionId !== decodedData.sessionId) {
            return null;
        }

        const sessionData = await redisClient.get(`session:${decodedData.sessionId}`);
        if (!sessionData) {
            return null;
        }

        const parsedSessionData = JSON.parse(sessionData);
        parsedSessionData.lastActivity = new Date().toISOString();
        await redisClient.setEx(`session:${decodedData.sessionId}`, 7*24*60*60, JSON.stringify(parsedSessionData));
        
        return decodedData;

    } catch (error) {
        console.log(error);
        
        return null;
    }
}

export const generateAccessToken = (id, sessionId, res) => {
    const accessToken = jwt.sign({ id, sessionId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m'
    });

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 15 * 60 * 1000 // 15 minute
    });
}

export const revokeRefreshToken = async (id) => {
    const activeSessionId = await redisClient.get(`active_session:${id}`);
    await redisClient.del(`refresh_token:${id}`);
    redisClient.del(`active_session:${id}`);
    if (activeSessionId) {
        await redisClient.del(`session:${activeSessionId}`);
    }
    await revokeCSRFToken(id);
}

export const isSessionActive = async (id, sessionId) => {
    const activeSessionId = await redisClient.get(`active_session:${id}`);
    return activeSessionId === sessionId;
}