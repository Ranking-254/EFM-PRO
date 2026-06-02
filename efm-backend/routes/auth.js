// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const axios = require('axios'); // 🚀 Used instead of the cloudinary SDK package
const router = express.Router();
const User = require('../models/user');

// @desc    Manager login (by username or eFootball ID)
// @route   POST /api/v1/auth/login
router.post('/login', async (req, res) => {
    const { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
        return res.status(400).json({ success: false, error: 'Please enter your username.' });
    }
    try {
        const user = await User.findOne({ username: identifier.trim() }).select('-__v');
        if (!user) {
            return res.status(401).json({ success: false, error: 'No account found with that username.' });
        }
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1d' }
        );
        res.status(200).json({ success: true, message: 'Login successful.', data: { id: user._id, username: user.username, token } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error. Please try again later.' });
    }
});

// @desc    Register a new player to EFM-PRO (Using FormData Buffer for Unsigned Preset)
// @route   POST /api/v1/auth/register
router.post('/register', async (req, res) => {
    try {
        const { fullname, username, whatsappNumber, teamStrength, screenshot } = req.body;

        // 1. Validation checklist
        if (!fullname || !username || !whatsappNumber || !teamStrength || !screenshot) {
            return res.status(400).json({
                success: false,
                error: 'Please complete all form fields and attach a verified squad screenshot.'
            });
        }

        // 2. Fetch your existing variables from process.env
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            return res.status(500).json({
                success: false,
                error: 'Server configuration error: Cloudinary profile parameters are missing.'
            });
        }

        // 🚀 THE FIX: Convert Base64 text string into a clean binary Buffer instance
        const cleanBase64 = screenshot.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(cleanBase64, 'base64');

        // 🚀 Pack it inside a native backend FormData payload container
        const uploadForm = new FormData();
        
        // Convert the raw binary buffer into a Blob attachment so Cloudinary reads it as a physical file file!
        const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
        
        uploadForm.append('file', imageBlob, 'squad_screenshot.jpg');
        uploadForm.append('upload_preset', uploadPreset);

        // 3. Dispatch to Cloudinary's open API as standard multipart/form-data
        let uploadedAssetUrl = '';
        try {
            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
            
            const cloudResponse = await axios.post(cloudinaryUrl, uploadForm, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            uploadedAssetUrl = cloudResponse.data.secure_url;
        } catch (cloudinaryError) {
            console.error('Cloudinary FormData Upload Failure:', cloudinaryError.response?.data || cloudinaryError.message);
            return res.status(500).json({
                success: false,
                error: 'Media platform failed to cache verification image. Please upload again.'
            });
        }

        // 4. Save everything down to MongoDB
        const user = await User.create({
            fullname,
            username,
            whatsappNumber,
            teamStrength: parseInt(teamStrength, 10),
            screenshotUrl: uploadedAssetUrl, 
            approvalStatus: 'pending'         
        });

        res.status(201).json({
            success: true,
            message: "Registration successful! Submitted for admin verification. Welcome to EFM-PRO.",
            data: {
                id: user._id,
                username: user.username,
                approvalStatus: user.approvalStatus
            }
        });

    } catch (error) {
        console.error("Core Registration System Failure:", error.message);
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue)[0];
            return res.status(400).json({ success: false, error: `The ${duplicateField} you entered is already registered.` });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages[0] });
        }
        res.status(500).json({ success: false, error: "Server Error. Please try again later." });
    }
});

// @desc    Get user profile
router.get('/profile/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('username whatsappNumber teamStrength screenshotUrl fullname approvalStatus');
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// @desc    Update user profile 
router.put('/profile/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

        const { fullname, username, whatsappNumber, teamStrength, screenshotUrl, approvalStatus } = req.body;
        if (fullname !== undefined) user.fullname = fullname;
        if (username !== undefined) user.username = username;
        if (whatsappNumber !== undefined) user.whatsappNumber = whatsappNumber;
        if (teamStrength !== undefined) user.teamStrength = teamStrength;
        if (screenshotUrl !== undefined) user.screenshotUrl = screenshotUrl;
        if (approvalStatus !== undefined) user.approvalStatus = approvalStatus; 

        await user.save();
        res.status(200).json({ success: true, message: 'Profile updated successfully.', data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// @desc    Book a slot for the upcoming league cycle
// @route   POST /api/v1/auth/book-slot/:userId
router.post('/book-slot/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false, error: 'Manager account not found.' });

        user.hasBookedUpcoming = true;
        // Optionally append a pending confirmation notice
        user.notifications.push({
            message: "Slot reservation logged! You'll be notified automatically the moment an admin matches you into a fresh league.",
            type: "reservation"
        });

        await user.save();
        res.status(200).json({ 
            success: true, 
            message: 'Slot successfully reserved! Your credentials have been pushed to priority admin review channels.' 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// @desc    Clear / mark notifications as read
// @route   PUT /api/v1/auth/notifications/:userId/read
router.put('/notifications/:userId/read', async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.userId, {
            $set: { "notifications.$[].isRead": true }
        });
        res.status(200).json({ success: true, message: 'Notifications cleared.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;