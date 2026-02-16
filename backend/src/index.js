import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

dotenv.config();
await connectDB();


// Redis Client Setup
import { createClient } from 'redis';
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("REDIS_URL is missing.");
  process.exit(1);
}

export const redisClient = createClient({
  url: redisUrl
});

await redisClient.connect()
  .then(() => console.log('Connected to Redis'))
  .catch((err) => {
    console.error('Failed to connect to Redis:', err);
    process.exit(1);
  });


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

import userRoutes from './routes/user.js';

app.use('/api/v1', userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});