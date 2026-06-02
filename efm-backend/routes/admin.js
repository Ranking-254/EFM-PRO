// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const League = require('../models/League'); // Adjust path to your League model

// @desc    Get all unassigned/pending reserve players
// @route   GET /api/v1/admin/pending-users
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
router.post('/leagues/create-from-reserve', async (req, res) => {
    try {
        const { leagueName, maxStrengthLimit, capacity, rounds, playerIds } = req.body;

        if (!leagueName || !playerIds || playerIds.length === 0) {
            return res.status(400).json({ success: false, error: 'Provide a league name and select at least one player.' });
        }

        // 1. Create the new league bracket
        const newLeague = await League.create({
            name: leagueName,
            maxStrengthLimit: parseInt(maxStrengthLimit, 10) || 3200,
            capacity: parseInt(capacity, 10) || 10,
            rounds: parseInt(rounds, 10) || 0,
            players: playerIds,
            status: 'recruiting'
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
        

module.exports = router;