// server.js
// 🚀 CRITICAL: Sentry instrumentation MUST be loaded first!
require("./instrument");

const express = require('express');
const http = require('http'); // 🚀 IMPORTED: Native Node HTTP server module
const { Server } = require('socket.io'); // 🚀 IMPORTED: Socket.io Server class
const cors = require('cors');
const helmet = require('helmet'); // 🚀 Import helmet
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const leagueRoutes = require('./routes/league');
const adminRoutes = require('./routes/admin');
const HallOfFame = require('./models/HallOfFame');
const hallOfFameRouter = require('./routes/hallOfFame');
const Sentry = require("@sentry/node"); // Import Sentry instance for error tracking


const app = express();
const server = http.createServer(app); // 🚀 ATTACHED: Created HTTP server instance wrapper for Express
const PORT = process.env.PORT || 5000;

// 🚀 INITIALIZED: Bound Socket.io instance to the HTTP server instance with your project origins mapped out
const io = new Server(server, {
    cors: {
        origin: ["https://efm-pro.vercel.app", "http://localhost:5173", "https://efm-pro.me.ke", "https://efm-frontend.vercel.app"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    }
});

// 🚀 MAPPED: Global active connection mapping logic for the real-time tunnel network pipeline
const activeConnections = new Map();

io.on('connection', (socket) => {
    console.log(`🔌 New real-time socket link open: ${socket.id}`);

    socket.on('register_manager', (userId) => {
        if (userId) {
            activeConnections.set(userId, socket.id);
            socket.join(userId);
            console.log(`👤 Manager ${userId} locked onto socket room: ${socket.id}`);
        }
    });

    socket.on('disconnect', () => {
        for (let [userId, socketId] of activeConnections.entries()) {
            if (socketId === socket.id) {
                activeConnections.delete(userId);
                console.log(`❌ Manager ${userId} left the socket network channel.`);
                break;
            }
        }
    });
});

// 🚀 LINKED: Injected socket instance globally inside your Express context environment instance settings configuration
app.set('io', io);

app.set('trust proxy', 1); // Trust first proxy for correct IP logging and rate limiting behind proxies/load balancers

// 🔒 STRICT PRODUCTION CORS CONFIGURATION TIER
const allowedOrigins = [
    'http://localhost:5173',                  // Your local frontend development server
    'https://pattinmugambi.me.ke',            // Custom main portfolio/brand wrapper
    'https://efm-pro.me.ke',                  // Main production frontend domain
    'https://efm-frontend.vercel.app',        // Fallback Vercel staging deployment domain
   // 'https://animal-challenge-spruce.ngrok-free.dev/' // Temporary ngrok tunnel for testing (Replace with your actual tunnel URL when active)
];

// 🚀 UNIFIED CORS MIDDLEWARE LAYER (Must be declared before body-parsers and routes)
app.use(cors({
    origin: ["https://efm-pro.vercel.app", "http://localhost:5173"], // Your production and development frontend links
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));

// 2. Adjust Helmet to prevent it from interfering with cross-origin assets and preflights
app.use(
    helmet({
        // This stops helmet from blocking images/assets crossing domains
        crossOriginResourcePolicy: { policy: "cross-origin" }, 
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "connect-src": ["'self'", "https://efm-pro.onrender.com", "http://localhost:5000"],
                "font-src": ["'self'", "https://fonts.gstatic.com", "data:", "*"],
                "img-src": ["'self'", "data:", "https://res.cloudinary.com", "*"],
            },
        },
    })
);

// Configure JSON and URL-encoded body parsers with an expanded 10MB limit for base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 🚀 SERVERLESS MONGOOSE POOL MIDDLEWARE 
// Ensures a pooled or cached connection is available before reaching any API route
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: "Database handshake failed. Please try again." 
        });
    }
});

// Mount EFM-PRO Routes
const authRoutes = require('./routes/auth');
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/leagues', leagueRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/halloffame', hallOfFameRouter);
app.use('/api/v1', hallOfFameRouter);

// Base Root Route
app.get('/', (req, res) => {
    res.json({ 
        status: "Online",
        platform: "EFM-PRO",
        message: "Welcome to the EFM-PRO Core Backend Engine." 
    });
});



// 🎯 SENTRY ERROR HANDLER MIDDLEWARE
// This must be positioned AFTER all controllers/routes, but BEFORE any custom error handling layers
Sentry.setupExpressErrorHandler(app);

// ⚠️ FIXED EXECUTION BRIDGE: Swapped app.listen out for server.listen so socket tunnels activate seamlessly
server.listen(PORT, () => {
    console.log(`[EFM-PRO] Server initialized and happily humming on port http://localhost:${PORT}`);
});