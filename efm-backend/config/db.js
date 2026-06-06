// config/db.js
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
    throw new Error('[EFM-PRO] Please define the MONGO_URI environment variable inside your .env file');
}

/**
 * Global is used here to maintain a cached connection across serverless 
 * function invocations in Vercel and prevent exhausting Atlas M0 connection pools.
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    // 1. If an active connection already exists, reuse it!
    if (cached.conn) {
        return cached.conn;
    }

    // 2. If no connection promise exists, create a new one
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            // Keep pool size modest per lambda instance to respect the 50-connection ceiling
            maxPoolSize: 10, 
            serverSelectionTimeoutMS: 5000, // Fail fast instead of hanging if Atlas is busy
            socketTimeoutMS: 45000,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
            console.log(`[EFM-PRO] Database Connected Successfully: ${mongooseInstance.connection.host}`);
            return mongooseInstance;
        });
    }

    try {
        // 3. Wait for the connection promise to resolve and cache it globally
        cached.conn = await cached.promise;
    } catch (error) {
        // If connection fails, clear the promise so the next request can retry
        cached.promise = null;
        console.error(`[EFM-PRO] Database Connection Error: ${error.message}`);
        // Crucial for serverless: do not use process.exit(1) here as it kills the lambda environment
        throw error; 
    }

    return cached.conn;
};

module.exports = connectDB;