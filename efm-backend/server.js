// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
//const authRoutes = require('./routes/auth');
const leagueRoutes = require('./routes/league');
const adminRoutes = require('./routes/admin');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.use(cors());

// Configure JSON and URL-encoded body parsers with an expanded 10MB limit for base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Mount EFM-PRO Routes
const authRoutes = require('./routes/auth');
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/leagues', leagueRoutes);
app.use('/api/v1/admin', adminRoutes);
// Base Root Route
app.get('/', (req, res) => {
    res.json({ 
        status: "Online",
        platform: "EFM-PRO",
        message: "Welcome to the EFM-PRO Core Backend Engine." 
    });
});

app.listen(PORT, () => {
    console.log(`[EFM-PRO] Server initialized and happily humming on port http://localhost:${PORT}`);
});