// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`[EFM-PRO] Database Connected Successfully: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[EFM-PRO] Database Connection Error: ${error.message}`);
        process.exit(1); // Stop the server entirely if the database connection fails
    }
};

module.exports = connectDB;