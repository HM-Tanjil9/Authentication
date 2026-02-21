import jwt from 'jsonwebtoken';
import { redisClient } from '../index.js';
import User from '../models/User.js';


export const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(403).json({ message: 'Unauthorized: Please login first' });
        }
        const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if(!decodedData) {
            return res.status(400).json({ message: 'Invalid token' });
        }
        
        const cacheUser = await redisClient.get(`user:${decodedData.id}`);
        if(cacheUser) {
            req.user = JSON.parse(cacheUser);
            return next();
        }

        const user = await User.findById(decodedData.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user)); // Cache user data for 1 hour
        
        req.user = user;
        next();

    } catch (error) {
        return res.status(500).json({ message: error });  
    }
}

export const authorizedAdmin = async (req, res, next) => {
    const user = req.user;
    if(user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized: Only admin can access this route' });
    }
    next();
}