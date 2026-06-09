// routes/leagues.js
const express = require('express');
const router = express.Router();
const League = require('../models/League');
const User = require('../models/user');
const Fixture = require('../models/Fixture'); 
// 🚀 FIXED: Swapped out single function import for our Advanced Triple-Format Engine Map Objects
const { 
    generateClassicLeague, 
    generateKnockoutBracket, 
    generateGroupAndKnockout 
} = require('../utils/scheduler');

const crypto = require('crypto');
const mongoose = require('mongoose'); 

// Utility Helper: Safely updates user document arrays and triggers immediate socket push notifications
const pushAndEmitNotification = async (req, userIds, notificationPayload) => {
    try {
        const io = req.app.get('io');
        const idsArray = Array.isArray(userIds) ? userIds : [userIds];
        const stringIds = idsArray.map(id => id.toString());

        // 1. Persist securely to MongoDB documents
        await User.updateMany(
            { _id: { $in: stringIds } },
            { $push: { notifications: notificationPayload } }
        );

        // 2. Real-Time Socket Push Dispatch
        if (io) {
            stringIds.forEach(id => {
                // Fetch the updated notifications array from the database to ensure state sync consistency
                User.findById(id).select('notifications').then(user => {
                    if (user) {
                        io.to(id).emit('notifications_updated', user.notifications);
                    }
                }).catch(err => console.error(`Socket broadcast pipeline failure for user ${id}:`, err));
            });
        }
    } catch (error) {
        console.error("Failed executing pushAndEmitNotification pipeline helper:", error);
    }
};

// ========================================================
// @desc    Get all recruiting leagues with capacity info
// @route   GET /api/v1/leagues/recruiting
// ========================================================
router.get('/recruiting', async (req, res) => {
    try {
        const leagues = await League.find({ status: 'recruiting' })
            .select('name maxStrengthLimit capacity players rounds rules createdAt');
        
        const leaguesWithMeta = leagues.map(league => ({
            _id: league._id,
            name: league.name,
            maxStrengthLimit: league.maxStrengthLimit,
            capacity: league.capacity,
            slotsFilled: league.players.length,
            status: league.status,
            rounds: league.rounds !== undefined ? league.rounds : 0, 
            rules: league.rules || '', 
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
// @desc    Get all active leagues with progression stats
// @route   GET /api/v1/leagues/active
// ========================================================
router.get('/active', async (req, res) => {
    try {
        const leagues = await League.find({ status: 'active' })
            .select('name maxStrengthLimit capacity players currentMatchday rounds rules createdAt');
        
        const leaguesWithMeta = leagues.map(league => ({
            _id: league._id,
            name: league.name,
            maxStrengthLimit: league.maxStrengthLimit,
            capacity: league.capacity,
            slotsFilled: league.players.length,
            status: league.status,
            currentMatchday: league.currentMatchday,
            rounds: league.rounds !== undefined ? league.rounds : 0, 
            rules: league.rules || '', 
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
// @desc    Get all leagues in system (Master Dashboard Ledger)
// @route   GET /api/v1/leagues/all
// ========================================================
router.get('/all', async (req, res) => {
    try {
        const leagues = await League.find({})
            .select('name maxStrengthLimit capacity players status currentMatchday rounds rules createdAt');
        
        const leaguesWithMeta = leagues.map(league => ({
            _id: league._id,
            name: league.name,
            maxStrengthLimit: league.maxStrengthLimit,
            capacity: league.capacity,
            slotsFilled: league.players.length,
            status: league.status,
            currentMatchday: league.currentMatchday || 1,
            rounds: league.rounds !== undefined ? league.rounds : 0, 
            rules: league.rules || '', 
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
// @desc    Get leagues a specific user is registered into
// @route   GET /api/v1/leagues/my-leagues/:userId
// ========================================================
router.get('/my-leagues/:userId', async (req, res) => {
    try {
        const userLeagues = await League.find({ players: req.params.userId })
            .select('name maxStrengthLimit capacity players status currentMatchday rounds rules createdAt');

        const leaguesWithMeta = userLeagues.map(league => ({
            _id: league._id,
            name: league.name,
            maxStrengthLimit: league.maxStrengthLimit,
            capacity: league.capacity,
            slotsFilled: league.players.length,
            status: league.status,
            currentMatchday: league.currentMatchday || 1,
            rounds: league.rounds !== undefined ? league.rounds : 0, 
            rules: league.rules || '', 
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

router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userLeagues = await League.find({ 
            players: userId 
        }).select('name status capacity slotsFilled maxStrengthLimit currentMatchday rounds rules');

        res.status(200).json({
            success: true,
            data: userLeagues
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================================
// @desc    Initialize a brand new league
// @route   POST /api/v1/leagues
// ========================================================
router.post('/', async (req, res) => {
    try {
        const league = await League.create(req.body);

        const io = req.app.get('io');
        if (io) {
            io.emit('global_notification', {
                _id: new mongoose.Types.ObjectId().toString(), 
                message: `📢 New League Formed: "${league.name}" has just opened registrations! Max STR: ${league.maxStrengthLimit}. Secure your slot now!`,
                type: 'new_league',
                isRead: false,                       
                createdAt: new Date()
            });
        }

        res.status(201).json({
            success: true,
            message: `League '${league.name}' initialized successfully!`,
            data: league
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ========================================================
// @desc    Join an open recruiting league group slot
// @route   POST /api/v1/leagues/:id/join
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

        league.players.push(userId);

        let systemMessage = `Successfully joined ${league.name}!`;
        let triggerScheduleGeneration = false;

        // Send confirmation alert to the user who just registered
        const joinAlertPayload = {
            _id: new mongoose.Types.ObjectId().toString(),
            message: `🔔 Slot reservation logged! You have successfully registered into "${league.name}". You'll be notified automatically the moment this group fills up and matches begin!`,
            type: "general",
            isRead: false,
            createdAt: new Date()
        };
        await pushAndEmitNotification(req, userId, joinAlertPayload);

        if (league.players.length === league.capacity) {
            league.status = 'active'; 
            triggerScheduleGeneration = true;
            systemMessage = `League is officially full! Status flipped to ACTIVE, and full season fixtures have been generated automatically.`;
        }

        await league.save();

        if (triggerScheduleGeneration) {
            let schedulePlan = [];
            const formatType = league.tournamentFormat || 'classic';

            // 🚀 DYNAMIC GENERATION ROUTER: Intelligently switches logic without dropping notifications
            if (formatType === 'knockout') {
                schedulePlan = generateKnockoutBracket(league.players);
            } else if (formatType === 'group_knockout') {
                schedulePlan = generateGroupAndKnockout(league.players, { 
                    groupsCount: league.groupStageCount || 4 
                });
            } else {
                // Classic League configuration (Home/Away leg optimization matrix)
                schedulePlan = generateClassicLeague(league.players, league.rounds || 1);
            }

            const finalizedFixtures = schedulePlan.map(match => ({
                leagueId: league._id,
                ...match
            }));

            await Fixture.insertMany(finalizedFixtures);

            const leagueLaunchNotification = {
                _id: new mongoose.Types.ObjectId().toString(),
                message: `📅 Fixtures generated! "${league.name}" is officially full and ACTIVE. Head to the Fixtures and scores page to run your matches!`,
                type: "league_assignment",
                isRead: false,
                createdAt: new Date()
            };

            await pushAndEmitNotification(req, league.players, leagueLaunchNotification);
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


router.get('/:id/fixtures', async (req, res) => {
    try {
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
// @desc    Process match score results submission
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

        if (fixture.matchday > 1) {
            const outstandingPriorFixtures = await Fixture.countDocuments({
                leagueId: fixture.leagueId,
                matchday: { $lt: fixture.matchday }, 
                status: { $ne: 'confirmed' }        
            });

            if (outstandingPriorFixtures > 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Progression Blocked: Round ${fixture.matchday} is locked. All tournament groups must complete and confirm outstanding Matchday ${fixture.matchday - 1} results before anyone can advance.` 
                });
            }
        }

        const isPlayerA = fixture.playerA.toString() === userId;
        const isPlayerB = fixture.playerB.toString() === userId;

        if (!isPlayerA && !isPlayerB) {
            return res.status(403).json({ success: false, error: "You are not a participant in this match." });
        }

        const submittingUser = await User.findById(userId);
        const opponentId = isPlayerA ? fixture.playerB : fixture.playerA;

        if (isPlayerA) {
            fixture.playerASubmittedScore = yourScore;
            fixture.playerBScore = opponentScore;
        } else if (isPlayerB) {
            fixture.playerBSubmittedScore = yourScore;
            fixture.playerAScore = opponentScore;
        }

        const targetLeague = await League.findById(fixture.leagueId);
        let matchNotification = null;
        let submitterNotification = null;
        let progressionAlert = null;
        let triggerProgressionPush = false;

        if (fixture.playerASubmittedScore !== null && fixture.playerBSubmittedScore !== null) {
            const doesPlayerAAlign = fixture.playerASubmittedScore === fixture.playerAScore;
            const doesPlayerBAlign = fixture.playerBSubmittedScore === fixture.playerBScore;

            if (doesPlayerAAlign && doesPlayerBAlign) {
                fixture.status = 'confirmed';
                
                // 🚀 FIXED: Both players get immediate confirmation cards
                matchNotification = {
                    _id: new mongoose.Types.ObjectId().toString(),
                    message: `✅ Match result finalized! Your Matchday ${fixture.matchday} fixture in "${targetLeague?.name || 'League Group'}" against @${submittingUser?.username || 'Opponent'} [${opponentScore} - ${yourScore}] has been confirmed and applied to standings.`,
                    type: "general",
                    isRead: false,
                    createdAt: new Date()
                };

                submitterNotification = {
                    _id: new mongoose.Types.ObjectId().toString(),
                    message: `✅ Matchday ${fixture.matchday} score confirmed! Your result in "${targetLeague?.name || 'League Group'}" [${yourScore} - ${opponentScore}] has been verified and applied to standings.`,
                    type: "general",
                    isRead: false,
                    createdAt: new Date()
                };

                const nextMatchdayNumber = fixture.matchday + 1;
                progressionAlert = {
                    _id: new mongoose.Types.ObjectId().toString(),
                    message: `📅 Matchday ${fixture.matchday} complete! Look ahead to Matchday ${nextMatchdayNumber} in your hub to scout your next opponent.`,
                    type: "general",
                    isRead: false,
                    createdAt: new Date()
                };

                triggerProgressionPush = true;

            } else {
                fixture.status = 'disputed';
                
                // 🚀 FIXED: Disputed real-time alerts pushed to both dashboards
                matchNotification = {
                    _id: new mongoose.Types.ObjectId().toString(),
                    message: `⚠️ Score conflict! The score reported for Matchday ${fixture.matchday} in "${targetLeague?.name || 'League Group'}" does not align with your submission. Match flagged for dispute resolution.`,
                    type: "admin_override",
                    isRead: false,
                    createdAt: new Date()
                };

                submitterNotification = {
                    _id: new mongoose.Types.ObjectId().toString(),
                    message: `⚠️ Score conflict! Your reported score for Matchday ${fixture.matchday} in "${targetLeague?.name || 'League Group'}" does not match your opponent's submission. Flagged for dispute.`,
                    type: "admin_override",
                    isRead: false,
                    createdAt: new Date()
                };
            }
        } else {
            fixture.status = 'awaiting_confirmation';
            
            // 🚀 FIXED: Recipient gets "Awaiting" alert card
            matchNotification = {
                _id: new mongoose.Types.ObjectId().toString(),
                message: `⚽ Score reported! @${submittingUser?.username || 'Opponent'} submitted a result of [${opponentScore} - ${yourScore}] for Matchday ${fixture.matchday} in "${targetLeague?.name || 'League Group'}". Head over to confirm or challenge it!`,
                type: "score_report",
                isRead: false,
                createdAt: new Date()
            };

            // Submitter gets a validation card
            submitterNotification = {
                _id: new mongoose.Types.ObjectId().toString(),
                message: `⏳ Score submission logged! Your reported result of [${yourScore} - ${opponentScore}] for Matchday ${fixture.matchday} is currently pending opponent confirmation.`,
                type: "general",
                isRead: false,
                createdAt: new Date()
            };
        }

        await fixture.save();

        // Push to opponent player session
        if (matchNotification && opponentId) {
            await pushAndEmitNotification(req, opponentId, matchNotification);
        }

        // Push to submitting player session
        if (submitterNotification && userId) {
            await pushAndEmitNotification(req, userId, submitterNotification);
        }

        // Handle sequential match progression notifications 
        if (triggerProgressionPush) {
            await pushAndEmitNotification(req, [fixture.playerA, fixture.playerB], progressionAlert);
        }

        await checkAndCompleteLeague(req, fixture.leagueId);

        res.status(200).json({
            success: true,
            message: `Score processed. Current match status: ${fixture.status.toUpperCase()}`,
            data: fixture
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/:id/standings', async (req, res) => {
    try {
        const league = await League.findById(req.params.id).populate('players', 'username');
        if (!league) {
            return res.status(404).json({ success: false, error: "League not found." });
        }

        const confirmedFixtures = await Fixture.find({ 
            leagueId: req.params.id, 
            status: 'confirmed' 
        });

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

        confirmedFixtures.forEach(match => {
            const idA = match.playerA.toString();
            const idB = match.playerB.toString();
            const scoreA = match.playerAScore;
            const scoreB = match.playerBScore;

            if (standingsMap[idA] && standingsMap[idB]) {
                standingsMap[idA].played += 1;
                standingsMap[idB].played += 1;

                standingsMap[idA].goalsFor += scoreA;
                standingsMap[idA].goalsAgainst += scoreB;
                standingsMap[idB].goalsFor += scoreB;
                standingsMap[idB].goalsAgainst += scoreA;

                if (scoreA > scoreB) {
                    standingsMap[idA].won += 1;
                    standingsMap[idA].points += 3;
                    standingsMap[idB].lost += 1;
                } else if (scoreB > scoreA) {
                    standingsMap[idB].won += 1;
                    standingsMap[idB].points += 3;
                    standingsMap[idA].lost += 1;
                } else {
                    standingsMap[idA].drawn += 1;
                    standingsMap[idA].points += 1;
                    standingsMap[idB].drawn += 1;
                    standingsMap[idB].points += 1;
                }
            }
        });

        const standingsArray = Object.values(standingsMap).map((row) => {
            row.goalDifference = row.goalsFor - row.goalsAgainst;
            return row;
        });

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
// @desc    Admin dispute resolution and score override
// @route   PATCH /api/v1/leagues/fixtures/:fixtureId/resolve
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

        const targetLeague = await League.findById(fixture.leagueId);
        const disputeResolvedNotification = {
            _id: new mongoose.Types.ObjectId().toString(),
            message: `⚖️ Admin Intervention: The dispute on your Matchday ${fixture.matchday} fixture in "${targetLeague?.name || 'Tournament Group'}" has been settled and locked by organizers.`,
            type: "admin_override",
            isRead: false,
            createdAt: new Date()
        };

        await pushAndEmitNotification(req, [fixture.playerA, fixture.playerB], disputeResolvedNotification);

        await checkAndCompleteLeague(req, fixture.leagueId);

        res.status(200).json({
            success: true,
            message: `Admin Override Successful. Fixture resolved and locked manually.`,
            data: fixture
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ========================================================
// @desc    Update league configuration parameters
// @route   PUT /api/v1/leagues/:id
// ========================================================
router.put('/:id', async (req, res) => {
    try {
        // 🚀 UPDATED: Extracted tournamentFormat and groupStageCount from the payload request body
        const { name, maxStrengthLimit, capacity, status, rounds, rules, tournamentFormat, groupStageCount } = req.body;
        const league = await League.findById(req.params.id);

        if (!league) {
            return res.status(404).json({ success: false, error: "League not found." });
        }

        // Apply standard updates
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
        if (rules !== undefined) {
            league.rules = rules;
        }
        
        // 🚀 UPDATED: Persist new formatting parameters directly to the league document state
        if (tournamentFormat !== undefined) league.tournamentFormat = tournamentFormat;
        if (groupStageCount !== undefined) league.groupStageCount = parseInt(groupStageCount, 10) || 4;

        // Track if a manual scheduling generation override needs to be triggered
        if (rounds !== undefined && rounds !== null && rounds !== '') {
            const parsedRounds = parseInt(rounds, 10);

            if (isNaN(parsedRounds) || parsedRounds < 0) {
                return res.status(400).json({ success: false, error: "Rounds must be a valid positive whole number." });
            }

            if (parsedRounds !== league.rounds) {
                league.rounds = parsedRounds;

                if (league.status === 'active' && league.players.length > 0) {
                    // Wipe the stale, old fixtures list completely
                    await Fixture.deleteMany({ leagueId: league._id });

                    let newSchedulePlan = [];
                    const formatType = league.tournamentFormat || 'classic';

                    // 🚀 FIXED: Dynamic generation mapping selector following our advanced scheduling engine parameters
                    if (formatType === 'knockout') {
                        newSchedulePlan = generateKnockoutBracket(league.players);
                    } else if (formatType === 'group_knockout') {
                        newSchedulePlan = generateGroupAndKnockout(league.players, { 
                            groupsCount: league.groupStageCount || 4 
                        });
                    } else {
                        // Falls back safely to your multi-round classic configuration legs matrix
                        newSchedulePlan = generateClassicLeague(league.players, parsedRounds);
                    }

                    const updatedFixtures = newSchedulePlan.map(match => ({
                        leagueId: league._id,
                        ...match
                    }));

                    await Fixture.insertMany(updatedFixtures);
                }
            }
        }

        await league.save();

        res.status(200).json({
            success: true,
            message: "League and matches updated successfully.",
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

const checkAndCompleteLeague = async (req, leagueId) => {
    const mongoose = require('mongoose');
    const objectIdLeagueId = typeof leagueId === 'string' ? new mongoose.Types.ObjectId(leagueId) : leagueId;
    
    const league = await League.findById(objectIdLeagueId);
    if (!league || league.status !== 'active') return;

    const totalFixtures = await Fixture.countDocuments({ leagueId: objectIdLeagueId });
    const confirmedFixtures = await Fixture.countDocuments({ leagueId: objectIdLeagueId, status: 'confirmed' });

    if (totalFixtures > 0 && confirmedFixtures === totalFixtures) {
        league.status = 'completed';
        await league.save();

        const endOfSeasonNotification = {
            _id: new mongoose.Types.ObjectId().toString(),
            message: `🏆 Season Concluded! All matchdays inside "${league.name}" are finished. Check the final Standings board to see your official rank positioning!`,
            type: "league_assignment",
            isRead: false,
            createdAt: new Date()
        };

        await pushAndEmitNotification(req, league.players, endOfSeasonNotification);
    }
};

module.exports = router;