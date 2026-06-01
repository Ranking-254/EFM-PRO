// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
//const authRoutes = require('./routes/auth');
const leagueRoutes = require('./routes/league');



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Mount EFM-PRO Routes
const authRoutes = require('./routes/auth');
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/leagues', leagueRoutes);


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