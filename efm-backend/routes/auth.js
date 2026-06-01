// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs'); // Note: Consider implementing password hashing in register/login later!
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/user');

// @desc    Manager login (by username or eFootball ID)
// @route   POST /api/v1/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { identifier } = req.body;

    if (!identifier || !identifier.trim()) {
        return res.status(400).json({ success: false, error: 'Please enter your username.' });
    }

    try {
        // Querying username (or other fields can be added inside $or if needed)
        const user = await User.findOne({
            $or: [
                { username: identifier.trim() }
            ]
        }).select('-__v');

        if (!user) {
            return res.status(401).json({ success: false, error: 'No account found with that username or eFootball ID.' });
        }

        // Fixed: Passed standard fallback secret and correct options positioning
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                id: user._id,
                username: user.username,
                token
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error. Please try again later.' });
    }
});

// @desc    Register a new player to EFM-PRO
// @route   POST /api/v1/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { fullname, username, whatsappNumber, teamStrength } = req.body;

        const user = await User.create({
            fullname,
            username,
            whatsappNumber,
            teamStrength
        });

        res.status(201).json({
            success: true,
            message: "Registration successful! Welcome to EFM-PRO.",
            data: {
                id: user._id,
                username: user.username
            }
        });

    } catch (error) {
        // Handle Mongoose duplicate key errors (code 11000) cleanly
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                error: `The ${duplicateField} you entered is already registered.`
            });
        }

        // Handle validation errors (missing fields, wrong data types)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                error: messages[0] // Return the first validation error message
            });
        }

        // Catch-all server error fallback
        res.status(500).json({
            success: false,
            error: "Server Error. Please try again later."
        });
    }
});

// @desc    Get user profile for contact lookup
// @route   GET /api/v1/auth/profile/:userId
// @access  Public
router.get('/profile/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('username whatsappNumber teamStrength squadImage fullname');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }
        res.status(200).json({
            success: true,
            data: {
                fullname: user.fullname,
                username: user.username,
                whatsappNumber: user.whatsappNumber,
                teamStrength: user.teamStrength,
                squadImage: user.squadImage
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// @desc    Update user profile (including squad image URL)
// @route   PUT /api/v1/auth/profile/:userId
// @access  Public
router.put('/profile/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        const { fullname, username, whatsappNumber, teamStrength, squadImage } = req.body;

        if (fullname !== undefined) user.fullname = fullname;
        if (username !== undefined) user.username = username;
        if (whatsappNumber !== undefined) user.whatsappNumber = whatsappNumber;
        if (teamStrength !== undefined) user.teamStrength = teamStrength;
        if (squadImage !== undefined) user.squadImage = squadImage;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            data: {
                fullname: user.fullname,
                username: user.username,
                whatsappNumber: user.whatsappNumber,
                teamStrength: user.teamStrength,
                squadImage: user.squadImage
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue)[0];
            return res.status(400).json({ success: false, error: `The ${duplicateField} you entered is already registered.` });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// @desc    Upload squad image as base64
// @route   POST /api/v1/auth/profile/:userId/upload-image
// @access  Public
router.post('/profile/:userId/upload-image', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ success: false, error: 'No image data provided.' });
        }

        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // Expect client to send a data URL like: data:image/png;base64,XXXX
        user.squadImage = image;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully.',
            data: { squadImage: user.squadImage }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;