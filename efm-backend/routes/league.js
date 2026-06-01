// routes/leagues.js
const express = require('express');
const router = express.Router();
const League = require('../models/League');
const User = require('../models/User');
const Fixture = require('../models/Fixture'); 
const generateRoundRobin = require('../utils/scheduler'); 

// ========================================================
// @desc    Get all recruiting leagues with capacity info
// @route   GET /api/v1/leagues/recruiting
// @access  Public
// ========================================================
router.get('/recruiting', async (req, res) => {
    try {
        const leagues = await League.find({ status: 'recruiting' })
            .select('name maxStrengthLimit capacity players createdAt');
        
        const leaguesWithMeta = leagues.map(league => ({
            _id: league._id,
            name: league.name,
            maxStrengthLimit: league.maxStrengthLimit,
            capacity: league.capacity,
            slotsFilled: league.players.length,
            status: league.status,
            createdAt: league.createdAt
        }));

        res.status(200).json({
            success: true,
            count: leaguesWithMeta.length,
            data: leaguesWithMeta
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/active', async (req, res) => {
    try {
        const leagues = await League.find({ status: 'active' })
            .select('name maxStrengthLimit capacity players currentMatchday createdAt');
        
        const leaguesWithMeta = leagues.map(league => ({
            _id: league._id,
            name: league.name,
            maxStrengthLimit: league.maxStrengthLimit,
            capacity: league.capacity,
            slotsFilled: league.players.length,
            status: league.status,
            currentMatchday: league.currentMatchday,
            createdAt: league.createdAt
        }));

        res.status(200).json({
            success: true,
            count: leaguesWithMeta.length,
            data: leaguesWithMeta
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/all', async (req, res) => {
    try {
        const leagues = await League.find({})
            .select('name maxStrengthLimit capacity players status currentMatchday createdAt');
        
        const leaguesWithMeta = leagues.map(league => ({
            _id: league._id,
            name: league.name,
            maxStrengthLimit: league.maxStrengthLimit,
            capacity: league.capacity,
            slotsFilled: league.players.length,
            status: league.status,
            currentMatchday: league.currentMatchday || 1,
            createdAt: league.createdAt
        }));

        res.status(200).json({
            success: true,
            count: leaguesWithMeta.length,
            data: leaguesWithMeta
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/my-leagues/:userId', async (req, res) => {
    try {
        const userLeagues = await League.find({ players: req.params.userId })
            .select('name maxStrengthLimit capacity players status currentMatchday createdAt');

        const leaguesWithMeta = userLeagues.map(league => ({
            _id: league._id,
            name: league.name,
            maxStrengthLimit: league.maxStrengthLimit,
            capacity: league.capacity,
            slotsFilled: league.players.length,
            status: league.status,
            currentMatchday: league.currentMatchday || 1,
            createdAt: league.createdAt
        }));

        res.status(200).json({
            success: true,
            count: leaguesWithMeta.length,
            data: leaguesWithMeta
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================================
// @desc    Create a new league tier (Admin action)
// @route   POST /api/v1/leagues
// @access  Public
// ========================================================
router.post('/', async (req, res) => {
    try {
        const league = await League.create(req.body);
        res.status(201).json({
            success: true,
            message: `League '${league.name}' initialized successfully!`,
            data: league
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: "A league with this name already exists." });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================================
// @desc    Join an open tournament league
// @route   POST /api/v1/leagues/:id/join
// @access  Public
// ========================================================
router.post('/:id/join', async (req, res) => {
    try {
        const league = await League.findById(req.params.id);
        const { userId } = req.body;

        if (!league) return res.status(404).json({ success: false, error: "League not found." });
        if (league.status !== 'recruiting') return res.status(400).json({ success: false, error: "Registration locked." });
        if (league.players.includes(userId)) return res.status(400).json({ success: false, error: "Already joined." });

        const player = await User.findById(userId);
        if (!player) return res.status(404).json({ success: false, error: "Player profile not found." });
        if (player.teamStrength > league.maxStrengthLimit) {
            return res.status(400).json({ success: false, error: "Team strength exceeds limit." });
        }
        if (league.players.length >= league.capacity) return res.status(400).json({ success: false, error: "League full!" });

        // Register the player locally
        league.players.push(userId);

        let systemMessage = `Successfully joined ${league.name}!`;
        let triggerScheduleGeneration = false;

        if (league.players.length === league.capacity) {
            league.status = 'active'; 
            triggerScheduleGeneration = true;
            systemMessage = `League is officially full! Status flipped to ACTIVE, and full season fixtures have been generated automatically.`;
        }

        // Save the state of the league FIRST
        await league.save();

        // Generate and bulk insert matches ONLY after the league successfully saves
        if (triggerScheduleGeneration) {
            const schedulePlan = generateRoundRobin(league.players, league.rounds || 0);

            const finalizedFixtures = schedulePlan.map(match => ({
                leagueId: league._id,
                ...match
            }));

            await Fixture.insertMany(finalizedFixtures);
        }

        res.status(200).json({
            success: true,
            message: systemMessage,
            status: league.status,
            currentPlayersCount: league.players.length,
            capacity: league.capacity
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ========================================================
// @desc    Get all fixtures for a league (with player details)
// @route   GET /api/v1/leagues/:id/fixtures
// @access  Public
// ========================================================
router.get('/:id/fixtures', async (req, res) => {
    try {
        // We use .populate() to automatically replace the user ObjectIDs with real user profiles
        const fixtures = await Fixture.find({ leagueId: req.params.id })
            .populate('playerA', 'username whatsappNumber efootballId')
            .populate('playerB', 'username whatsappNumber efootballId')
            .sort('matchday');

        res.status(200).json({
            success: true,
            count: fixtures.length,
            data: fixtures
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================================
// @desc    Submit a match score (Player action)
// @route   POST /api/v1/leagues/fixtures/:fixtureId/submit
// ========================================================
router.post('/fixtures/:fixtureId/submit', async (req, res) => {
    try {
        const { userId, yourScore, opponentScore } = req.body;
        const fixture = await Fixture.findById(req.params.fixtureId);

        if (!fixture) {
            return res.status(404).json({ success: false, error: "Fixture not found." });
        }

        if (fixture.status === 'confirmed') {
            return res.status(400).json({ success: false, error: "This match result has already been finalized." });
        }

        const isPlayerA = fixture.playerA.toString() === userId;
        const isPlayerB = fixture.playerB.toString() === userId;

        if (!isPlayerA && !isPlayerB) {
            return res.status(403).json({ success: false, error: "You are not a participant in this match." });
        }

        // 1. Record individual claims cleanly
        if (isPlayerA) {
            fixture.playerASubmittedScore = yourScore;     // What A says A scored
            fixture.playerBScore = opponentScore;          // What A says B scored
        } else if (isPlayerB) {
            fixture.playerBSubmittedScore = yourScore;     // What B says B scored
            fixture.playerAScore = opponentScore;          // What B says A scored
        }

        // 2. TRUST ENGINE MUTUAL VERIFICATION
        // Check if both players have logged a submission
        if (fixture.playerASubmittedScore !== null && fixture.playerBSubmittedScore !== null) {
            
            // Mirror Cross-Check:
            // Does what A claims A scored equal what B claims A conceded?
            // AND does what B claims B scored equal what A claims B conceded?
            const doesPlayerAAlign = fixture.playerASubmittedScore === fixture.playerAScore;
            const doesPlayerBAlign = fixture.playerBSubmittedScore === fixture.playerBScore;

            if (doesPlayerAAlign && doesPlayerBAlign) {
                fixture.status = 'confirmed';
                // TODO: Trigger League Table Standing Recalculation Here!
            } else {
                fixture.status = 'disputed';
            }
        } else {
            // Only one user has submitted so far
            fixture.status = 'awaiting_confirmation';
        }

        await fixture.save();

        await checkAndCompleteLeague(fixture.leagueId);

        res.status(200).json({
            success: true,
            message: `Score processed. Current match status: ${fixture.status.toUpperCase()}`,
            data: fixture
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================================
// @desc    Get live calculated league standings table
// @route   GET /api/v1/leagues/:id/standings
// ========================================================
router.get('/:id/standings', async (req, res) => {
    try {
        const league = await League.findById(req.params.id).populate('players', 'username');
        if (!league) {
            return res.status(404).json({ success: false, error: "League not found." });
        }

        // Fetch only the finalized matches for this league
        const confirmedFixtures = await Fixture.find({ 
            leagueId: req.params.id, 
            status: 'confirmed' 
        });

        // 1. Initialize a clean scorecard map for every player in the league
        const standingsMap = {};
        league.players.forEach(player => {
            standingsMap[player._id.toString()] = {
                playerId: player._id,
                username: player.username,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0
            };
        });

        // 2. Loop through every confirmed match and aggregate the stats
        confirmedFixtures.forEach(match => {
            const idA = match.playerA.toString();
            const idB = match.playerB.toString();
            const scoreA = match.playerAScore;
            const scoreB = match.playerBScore;

            // Ensure players exist in the scorecard map (edge-case safety check)
            if (standingsMap[idA] && standingsMap[idB]) {
                // Update matches played
                standingsMap[idA].played += 1;
                standingsMap[idB].played += 1;

                // Update raw goals
                standingsMap[idA].goalsFor += scoreA;
                standingsMap[idA].goalsAgainst += scoreB;
                standingsMap[idB].goalsFor += scoreB;
                standingsMap[idB].goalsAgainst += scoreA;

                // Evaluate Match Outcomes
                if (scoreA > scoreB) {
                    // Player A Wins
                    standingsMap[idA].won += 1;
                    standingsMap[idA].points += 3;
                    standingsMap[idB].lost += 1;
                } else if (scoreB > scoreA) {
                    // Player B Wins
                    standingsMap[idB].won += 1;
                    standingsMap[idB].points += 3;
                    standingsMap[idA].lost += 1;
                } else {
                    // It's a Draw
                    standingsMap[idA].drawn += 1;
                    standingsMap[idA].points += 1;
                    standingsMap[idB].drawn += 1;
                    standingsMap[idB].points += 1;
                }
            }
        });

        // 3. Convert scorecard map to an array and calculate final Goal Differences
        const standingsArray = Object.values(standingsMap).map((row) => {
            row.goalDifference = row.goalsFor - row.goalsAgainst;
            return row;
        });

        // 4. Sort the table arrays (Standard Football Hierarchy: Points -> GD -> GF)
        standingsArray.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });

        res.status(200).json({
            success: true,
            leagueName: league.name,
            table: standingsArray
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ========================================================
// @desc    Admin override to resolve disputed matches
// @route   PATCH /api/v1/leagues/fixtures/:fixtureId/resolve
// @access  Private (Admin Only)
// ========================================================
router.patch('/fixtures/:fixtureId/resolve', async (req, res) => {
    try {
        const { playerAScore, playerBScore } = req.body;
        
        if (playerAScore === undefined || playerBScore === undefined || isNaN(playerAScore) || isNaN(playerBScore)) {
            return res.status(400).json({ 
                success: false, 
                error: "Please provide valid numeric scores for both players." 
            });
        }

        const fixture = await Fixture.findById(req.params.fixtureId);
        if (!fixture) {
            return res.status(404).json({ success: false, error: "Fixture not found." });
        }

        fixture.playerAScore = playerAScore;
        fixture.playerBScore = playerBScore;
        fixture.playerASubmittedScore = playerAScore;
        fixture.playerBSubmittedScore = playerBScore;
        fixture.status = 'confirmed';

        await fixture.save();

        await checkAndCompleteLeague(fixture.leagueId);

        res.status(200).json({
            success: true,
            message: `Admin Override Successful. Fixture resolved and locked manually.`,
            data: fixture
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { name, maxStrengthLimit, capacity, status, rounds } = req.body;
        const league = await League.findById(req.params.id);

        if (!league) {
            return res.status(404).json({ success: false, error: "League not found." });
        }

        if (name !== undefined) league.name = name;
        if (maxStrengthLimit !== undefined) league.maxStrengthLimit = maxStrengthLimit;
        if (capacity !== undefined) {
            if (capacity < 2) {
                return res.status(400).json({ success: false, error: "Capacity must be at least 2." });
            }
            league.capacity = capacity;
        }
        if (status !== undefined && ['recruiting', 'active', 'completed'].includes(status)) {
            league.status = status;
        }
        if (rounds !== undefined) {
            if (rounds < 0 || !Number.isInteger(rounds)) {
                return res.status(400).json({ success: false, error: "Rounds must be a whole number (0 = full round-robin)." });
            }
            league.rounds = rounds;
        }

        await league.save();

        res.status(200).json({
            success: true,
            message: "League updated successfully.",
            data: league
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: "A league with this name already exists." });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const league = await League.findById(req.params.id);

        if (!league) {
            return res.status(404).json({ success: false, error: "League not found." });
        }

        if (league.status === 'active') {
            return res.status(400).json({ success: false, error: "Cannot delete an active league. Complete or cancel the tournament first." });
        }

        await League.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "League deleted successfully."
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/:id/remove-member/:userId', async (req, res) => {
    try {
        const league = await League.findById(req.params.id);

        if (!league) {
            return res.status(404).json({ success: false, error: "League not found." });
        }

        const userId = req.params.userId;
        const memberIndex = league.players.indexOf(userId);

        if (memberIndex === -1) {
            return res.status(400).json({ success: false, error: "User is not a member of this league." });
        }

        league.players.splice(memberIndex, 1);
        await league.save();

        res.status(200).json({
            success: true,
            message: "Member removed successfully.",
            playerCount: league.players.length,
            capacity: league.capacity
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const checkAndCompleteLeague = async (leagueId) => {
    const mongoose = require('mongoose');
    const objectIdLeagueId = typeof leagueId === 'string' ? new mongoose.Types.ObjectId(leagueId) : leagueId;
    
    const league = await League.findById(objectIdLeagueId);
    if (!league || league.status !== 'active') return;

    const totalFixtures = await Fixture.countDocuments({ leagueId: objectIdLeagueId });
    const confirmedFixtures = await Fixture.countDocuments({ leagueId: objectIdLeagueId, status: 'confirmed' });

    if (totalFixtures > 0 && confirmedFixtures === totalFixtures) {
        league.status = 'completed';
        await league.save();
    }
};

module.exports = router;