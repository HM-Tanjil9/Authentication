import jwt from 'jsonwebtoken';
import { redisClient } from '../index.js';

export const generateToken = async (id, res) => {
    const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1m'
    });

    const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d'
    });

    const refreshTokenKey = `refresh_token:${id}`;
    await redisClient.set(refreshTokenKey, 7*24*60*60, refreshToken); // Store refresh token with expiration of 7 days

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        // secure: true,
        sameSite: 'strict',
        maxAge: 1 * 60 * 1000 // 1 minute
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        // secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return { accessToken, refreshToken };
}