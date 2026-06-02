// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, 'Please add a full name'],
        trim: true,
        maxlength: [100, 'Full name cannot be more than 100 characters']
    },
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true,
        maxlength: [20, 'Username cannot be more than 20 characters']
    },
    whatsappNumber: {
        type: String,
        required: [true, 'Please add a valid WhatsApp phone number'],
        trim: true
    },
    // 🚀 NEW: Tracks the exact numeric squad tier rating for tournament seeding
    teamStrength: {
        type: Number,
        required: [true, 'Please provide your exact team strength rating'],
        min: [2500, 'Team strength cannot be less than 2500'],
        max: [4000, 'Team strength cannot exceed 4000']
    },
    // 🚀 NEW: Stores the secure storage URL link (Cloudinary) for admin visual verification
    screenshotUrl: {
        type: String,
        required: [true, 'A verification squad screenshot asset link is required']
    },
    // 🚀 NEW: Tier state manager for league entries
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    role: {
        type: String,
        enum: ['player', 'admin'],
        default: 'player'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Add these fields inside your mongoose.Schema object layout:
    hasBookedUpcoming: {
        type: Boolean,
        default: false
    },
    notifications: [
        {
            message: { type: String, required: true },
            type: { type: String, default: 'general' },
            isRead: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        }
    ],
});

module.exports = mongoose.model('User', UserSchema);