// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const League = require('../models/League'); // Adjust path to your League model
const { adminLimiter } = require('../config/rateLimeter'); // FIXED: Converted to CommonJS require format

// @desc    Get all unassigned/pending reserve players
// @route   GET /api/v1/admin/pending-users
// 💡 NOTE: Left without limiter so your admin dashboard layout reads smoothly without restriction logs
router.get('/pending-users', async (req, res) => {
    try {
        // Find players who are still marked pending or haven't been assigned to an active league bracket
        const reservePlayers = await User.find({ approvalStatus: 'pending', role: 'player' }).select('-__v');
        
        res.status(200).json({
            success: true,
            data: reservePlayers
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// @desc    Batch Create a League directly using Selected Reserve Players
// @route   POST /api/v1/admin/leagues/create-from-reserve
router.post('/leagues/create-from-reserve', adminLimiter, async (req, res) => { // 🚀 PROTECTED
    try {
        // 🚀 FIXED: Added 'rules' to the destructuring assignment block!
        const { leagueName, maxStrengthLimit, capacity, rounds, playerIds, rules } = req.body;

        if (!leagueName || !playerIds || playerIds.length === 0) {
            return res.status(400).json({ success: false, error: 'Provide a league name and select at least one player.' });
        }

        // 1. Create the new league bracket with rules explicitly passed
        const newLeague = await League.create({
            name: leagueName,
            maxStrengthLimit: parseInt(maxStrengthLimit, 10) || 3200,
            capacity: parseInt(capacity, 10) || 10,
            rounds: parseInt(rounds, 10) || 0,
            players: playerIds,
            status: 'recruiting',
            rules: rules || '' // 🚀 FIXED: Saved into your database document correctly!
        });

        // 2. Clear booking flags, set approval status to 'approved', and insert entry notification
        const welcomeNotification = {
            message: `🔥 Boom! You have been officially added to the newly formed league: "${leagueName}". Head over to the Tournament Hub to review your fixtures!`,
            type: "league_assignment"
        };

        await User.updateMany(
            { _id: { $in: playerIds } },
            { 
                $set: { approvalStatus: 'approved', hasBookedUpcoming: false },
                $push: { notifications: welcomeNotification }
            }
        );

        res.status(201).json({
            success: true,
            message: `Successfully provisioned "${leagueName}" with ${playerIds.length} reserve managers!`,
            data: newLeague
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// @desc    Standalone Single-User Approval
// @route   POST /api/v1/admin/users/:userId/approve
router.post('/users/:userId/approve', adminLimiter, async (req, res) => { // 🚀 PROTECTED
    try {
        const { userId } = req.params;

        const approvalNotification = {
            message: `✨ Congratulations! Your manager registration credentials have been verified and approved by the admin. You are now free to join open tournament brackets!`,
            type: "general"
        };

        // Switch user to approved status, clear waitlist tags, and dispatch confirmation alert
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: { approvalStatus: 'approved', hasBookedUpcoming: false },
                $push: { notifications: approvalNotification }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'Manager account context not found.' });
        }

        res.status(200).json({
            success: true,
            message: `Manager profile @${user.username} successfully approved without explicit bracket locking.`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// @desc    Standalone Single-User Rejection
// @route   POST /api/v1/admin/users/:userId/reject
router.post('/users/:userId/reject', adminLimiter, async (req, res) => { // 🚀 PROTECTED
    try {
        const { userId } = req.params;

        // Completely removes the pending user from registration listings
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ success: false, error: 'Manager profile context not found.' });
        }

        res.status(200).json({
            success: true,
            message: `Application for manager @${deletedUser.username} has been rejected and cleared from server documents.`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;