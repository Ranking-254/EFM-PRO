// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // 🚀 Import helmet
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const leagueRoutes = require('./routes/league');
const adminRoutes = require('./routes/admin');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// 🔒 STRICT PRODUCTION CORS CONFIGURATION TIER
const allowedOrigins = [
    'http://localhost:5173',                  // Your local frontend development server
    'https://pattinmugambi.me.ke',            // Custom main portfolio/brand wrapper
    'https://efm-pro.me.ke',                  // Main production frontend domain
    'https://efm-frontend.vercel.app'         // Fallback Vercel staging deployment domain
];

// 🚀 UNIFIED CORS MIDDLEWARE LAYER (Must be declared before body-parsers and routes)
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile workflows, Postman, or server-to-server calls)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure Helmet with custom Content Security Policy directives to stop browser blocks
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                // Allow frontend applications to connect to your local dev and live Render servers
                "connect-src": ["'self'", "https://efm-pro.onrender.com", "http://localhost:5000"],
                // Allow external fonts (like Google Fonts) to load cleanly
                "font-src": ["'self'", "https://fonts.gstatic.com", "data:", "*"],
                // Allow verification images to render from Cloudinary
                "img-src": ["'self'", "data:", "https://res.cloudinary.com", "*"],
            },
        },
    })
);

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