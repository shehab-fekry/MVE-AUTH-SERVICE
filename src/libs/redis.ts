import 'dotenv/config'; // Load environment variables from .env file to process.env

import { Redis } from 'ioredis';

const redis = new Redis(String(process.env.REDIS_URL));

export { redis };
