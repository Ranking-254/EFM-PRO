// config/rateLimiter.js
import rateLimit from 'express-rate-limit';

// 🛑 GLOBAL AUTH LIMITER: Applies to standard users logging in
// config/rateLimiter.js
export const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 10, 
    statusCode: 200, // 🚀 CRITICAL FIX: Forces the server to send a 200 OK so the payload isn't swallowed by proxies
    message: {
        success: false, // 💡 Tells your frontend logic this request actually failed
        error: "Too many login attempts from this device. Please try again after 15 minutes."
    },
    standardHeaders: true, 
    legacyHeaders: false, 
});

// ⚡ HIGH-SECURITY ADMIN LIMITER: Extra tight rules for the administrative desk console
export const adminLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window segment
    max: 5, // Allow only 5 attempts per hour for security authentication
    message: {
        success: false,
        error: "Critical Security Lockout: Too many admin verification attempts. Try again in an hour."
    },
    standardHeaders: true,
    legacyHeaders: false,
});