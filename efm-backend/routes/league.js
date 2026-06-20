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
        // 🚀 FIXED: Added tournamentFormat and groupStageCount to the selection string so MongoDB fetches them
        const leagues = await League.find({})
            .select('name maxStrengthLimit capacity players status currentMatchday rounds tournamentFormat groupStageCount rules createdAt');
        
        const leaguesWithMeta = leagues.map(league => ({
            _id: league._id,
            name: league.name,
            maxStrengthLimit: league.maxStrengthLimit,
            capacity: league.capacity,
            slotsFilled: league.players.length,
            status: league.status,
            currentMatchday: league.currentMatchday || 1,
            rounds: league.rounds !== undefined ? league.rounds : 0, 
            // 🚀 FIXED: Mapping the new fields safely into the final payload with fallbacks
            tournamentFormat: league.tournamentFormat || 'classic',
            groupStageCount: league.groupStageCount || 0,
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
        }).select('name status capacity slotsFilled maxStrengthLimit currentMatchday rounds rules tournamentFormat'); // 🚀 FIXED: Added tournamentFormat here

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
            const formatType = String(league.tournamentFormat || 'classic').trim();

            if (formatType === 'knockout') {
                schedulePlan = generateKnockoutBracket(league.players);
            } else if (formatType === 'group_knockout' || formatType.includes('group')) {
                const parsedGroupCount = parseInt(league.groupStageCount, 10);
                const finalGroupsCount = parsedGroupCount && parsedGroupCount > 0 ? parsedGroupCount : 4;

                // 🚀 EXPLICIT COMPILATION: Force the clean array directly without alternative mutations
                schedulePlan = generateGroupAndKnockout(league.players, { 
                    groupsCount: finalGroupsCount 
                });
            } else {
                schedulePlan = generateClassicLeague(league.players, league.rounds || 1);
            }

            // Seal the data structure completely
            const finalizedFixtures = schedulePlan.map(match => ({
                leagueId: league._id,
                ...match,
                // 🚀 THE DEFENSIVE SHIELD: Explicitly overwrite stageType to clamp group stage configurations
                stageType: formatType.includes('group') ? 'group_stage' : 'knockout_stage'
            }));

            // Clear any old garbage entries out of the collection for this specific league first
            await Fixture.deleteMany({ leagueId: league._id });
            
            // Write directly to MongoDB
            await Fixture.insertMany(finalizedFixtures);

            const leagueLaunchNotification = {
                _id: new mongoose.Types.ObjectId().toString(),
                message: `📅 Fixtures generated! "${league.name}" is officially full and ACTIVE.`,
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
            
            matchNotification = {
                _id: new mongoose.Types.ObjectId().toString(),
                message: `⚽ Score reported! @${submittingUser?.username || 'Opponent'} submitted a result of [${opponentScore} - ${yourScore}] for Matchday ${fixture.matchday} in "${targetLeague?.name || 'League Group'}". Head over to confirm or challenge it!`,
                type: "score_report",
                isRead: false,
                createdAt: new Date()
            };

            submitterNotification = {
                _id: new mongoose.Types.ObjectId().toString(),
                message: `⏳ Score submission logged! Your reported result of [${yourScore} - ${opponentScore}] for Matchday ${fixture.matchday} is currently pending opponent confirmation.`,
                type: "general",
                isRead: false,
                createdAt: new Date()
            };
        }

        await fixture.save();

        if (matchNotification && opponentId) {
            await pushAndEmitNotification(req, opponentId, matchNotification);
        }

        if (submitterNotification && userId) {
            await pushAndEmitNotification(req, userId, submitterNotification);
        }

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

// ========================================================
// @desc    Get individual league standings table ledger
// @route   GET /api/v1/leagues/:id/standings
// ========================================================
router.get('/:id/standings', async (req, res) => {
    try {
        const league = await League.findById(req.params.id).populate('players', 'username');
        if (!league) {
            return res.status(404).json({ success: false, error: "League not found." });
        }

        const totalFixtures = await Fixture.find({ leagueId: req.params.id });
        const confirmedFixtures = totalFixtures.filter(f => f.status === 'confirmed');

        // 🚀 THE BULLETPROOF SOLUTION: Build a flat, string-safe look-up map first
        const playerGroupMap = {};
        totalFixtures.forEach(f => {
            // Unify whatever format playerA/B is in down to a clean, simple text string
            const idA = f.playerA && typeof f.playerA === 'object' && f.playerA._id ? f.playerA._id.toString() : f.playerA?.toString();
            const idB = f.playerB && typeof f.playerB === 'object' && f.playerB._id ? f.playerB._id.toString() : f.playerB?.toString();
            
            if (idA && f.groupLabel) playerGroupMap[idA] = f.groupLabel;
            if (idB && f.groupLabel) playerGroupMap[idB] = f.groupLabel;
        });

        const standingsMap = {};
        league.players.forEach(player => {
            const playerIdStr = player._id.toString();
            
            // 🚀 Look up group label directly from our clean flat map
            const resolvedGroupLabel = playerGroupMap[playerIdStr] || 'A';

            standingsMap[playerIdStr] = {
                playerId: player._id,
                username: player.username,
                groupLabel: resolvedGroupLabel, // Now it will correctly read A, B, C, or D!
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
            const idA = match.playerA && typeof match.playerA === 'object' && match.playerA._id ? match.playerA._id.toString() : match.playerA?.toString();
            const idB = match.playerB && typeof match.playerB === 'object' && match.playerB._id ? match.playerB._id.toString() : match.playerB?.toString();
            
            const scoreA = match.playerAScore;
            const scoreB = match.playerBScore;

            if (idA && idB && standingsMap[idA] && standingsMap[idB]) {
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
            tournamentFormat: league.tournamentFormat || 'classic',
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
        fixture.fixtureId = req.params.fixtureId; 
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

        // Run season completion checks
        await checkAndCompleteLeague(req, fixture.leagueId);

        res.status(200).json({
            success: true,
            message: `Admin Override Successful. Fixture resolved and standings tables re-compiled smoothly.`,
            data: fixture
        });

    } catch (error) {
        console.error("Dispute override script collapse:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================================
// @desc    Update league configuration parameters
// @route   PUT /api/v1/leagues/:id
// ========================================================
router.put('/:id', async (req, res) => {
    try {
        const { name, maxStrengthLimit, capacity, status, rounds, rules, tournamentFormat, groupStageCount } = req.body;
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
        if (rules !== undefined) {
            league.rules = rules;
        }
        
        if (tournamentFormat !== undefined) league.tournamentFormat = tournamentFormat;
        if (groupStageCount !== undefined) league.groupStageCount = parseInt(groupStageCount, 10) || 4;

        if (rounds !== undefined && rounds !== null && rounds !== '') {
            const parsedRounds = parseInt(rounds, 10);

            if (isNaN(parsedRounds) || parsedRounds < 0) {
                return res.status(400).json({ success: false, error: "Rounds must be a valid positive whole number." });
            }

            if (parsedRounds !== league.rounds) {
                league.rounds = parsedRounds;

                if (league.status === 'active' && league.players.length > 0) {
                    await Fixture.deleteMany({ leagueId: league._id });

                    let newSchedulePlan = [];
                    const formatType = league.tournamentFormat || 'classic';

                    if (formatType === 'knockout') {
                        newSchedulePlan = generateKnockoutBracket(league.players);
                    } else if (formatType === 'group_knockout') {
                        newSchedulePlan = generateGroupAndKnockout(league.players, { 
                            groupsCount: league.groupStageCount || 4 
                        });
                    } else {
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

// ========================================================
// @desc    Admin Only: Manually add a player to a league
// @route   POST /api/v1/leagues/:id/admin-add
// ========================================================
router.post('/:id/admin-add', async (req, res) => {
    try {
        const league = await League.findById(req.params.id);
        const { identifier } = req.body; 

        if (!league) return res.status(404).json({ success: false, error: "League not found." });
        if (league.status !== 'recruiting') return res.status(400).json({ success: false, error: "Cannot add players. League is already active or completed." });
        if (league.players.length >= league.capacity) return res.status(400).json({ success: false, error: "League capacity already reached!" });

        const player = await User.findOne({
            $or: [
                { username: { $regex: `^${identifier}$`, $options: 'i' } },
                { whatsappNumber: identifier }
            ]
        });

        if (!player) return res.status(404).json({ success: false, error: "Manager profile not found in system." });
        if (league.players.includes(player._id)) return res.status(400).json({ success: false, error: "Manager is already in this league." });

        league.players.push(player._id);

        const adminInsertNotification = {
            _id: new mongoose.Types.ObjectId().toString(),
            message: `⚖️ Admin Action: Organizers have manually registered your squad into "${league.name}". Stand by for fixture generation!`,
            type: "admin_override",
            isRead: false,
            createdAt: new Date()
        };

        let systemMessage = `Successfully added @${player.username} to ${league.name}.`;
        let triggerScheduleGeneration = false;

        if (league.players.length === league.capacity) {
            league.status = 'active';
            triggerScheduleGeneration = true;
            systemMessage = `Added @${player.username}. League is now full! Status flipped to ACTIVE and fixtures generated.`;
        }

        await league.save();
        await pushAndEmitNotification(req, player._id, adminInsertNotification);

        if (triggerScheduleGeneration) {
            let schedulePlan = [];
            const formatType = String(league.tournamentFormat || 'classic').trim();

            if (formatType === 'knockout') {
                schedulePlan = generateKnockoutBracket(league.players);
            } else if (formatType === 'group_knockout' || formatType.includes('group')) {
                const parsedGroupCount = parseInt(league.groupStageCount, 10);
                const finalGroupsCount = parsedGroupCount && parsedGroupCount > 0 ? parsedGroupCount : 4;

                // 🚀 EXPLICIT COMPILATION: Force the clean array directly without alternative mutations
                schedulePlan = generateGroupAndKnockout(league.players, { 
                    groupsCount: finalGroupsCount 
                });
            } else {
                schedulePlan = generateClassicLeague(league.players, league.rounds || 1);
            }

            // Seal the data structure completely
            const finalizedFixtures = schedulePlan.map(match => ({
                leagueId: league._id,
                ...match,
                // 🚀 THE DEFENSIVE SHIELD: Explicitly overwrite stageType to clamp group stage configurations
                stageType: formatType.includes('group') ? 'group_stage' : 'knockout_stage'
            }));

            // Clear any old garbage entries out of the collection for this specific league first
            await Fixture.deleteMany({ leagueId: league._id });
            
            // Write directly to MongoDB
            await Fixture.insertMany(finalizedFixtures);

            const leagueLaunchNotification = {
                _id: new mongoose.Types.ObjectId().toString(),
                message: `📅 Fixtures generated! "${league.name}" is officially full and ACTIVE.`,
                type: "league_assignment",
                isRead: false,
                createdAt: new Date()
            };
            await pushAndEmitNotification(req, league.players, leagueLaunchNotification);
        }

        res.status(200).json({
            success: true,
            message: systemMessage,
            playerCount: league.players.length,
            capacity: league.capacity
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================================
// @desc    Admin Only: Fetch absolute populated roster for a league
// @route   GET /api/v1/leagues/:id/roster
// ========================================================
router.get('/:id/roster', async (req, res) => {
    try {
        const league = await League.findById(req.params.id).populate('players', 'username teamStrength whatsappNumber');
        
        if (!league) {
            return res.status(404).json({ success: false, error: "League target not found." });
        }

        res.status(200).json({
            success: true,
            status: league.status,
            capacity: league.capacity,
            name: league.name,
            players: league.players || [] 
        });
    } catch (error) {
        console.error("Backend roster endpoint failure:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Core automation bracket engine advancement loop logic block
const checkAndCompleteLeague = async (req, leagueId) => {
    try {
        const objectIdLeagueId = typeof leagueId === 'string' ? new mongoose.Types.ObjectId(leagueId) : leagueId;
        const league = await League.findById(objectIdLeagueId);
        
        if (!league || league.status === 'completed') return;

        const formatType = String(league.tournamentFormat || 'classic').trim();

        // --- HANDLER A: BRACKET ELIMINATION AUTOMATION (KNOCKOUTS) ---
        if (formatType === 'knockout') {
            const totalFixtures = await Fixture.find({ leagueId: objectIdLeagueId });
            const activeMatchday = league.currentMatchday || 1;
            const currentRoundMatches = totalFixtures.filter(f => f.matchday === activeMatchday);
            const confirmedMatchesInRound = currentRoundMatches.filter(f => f.status === 'confirmed');

            if (currentRoundMatches.length === 0 || confirmedMatchesInRound.length !== currentRoundMatches.length) {
                return;
            }

            if (currentRoundMatches.length === 1 && currentRoundMatches[0].roundName === "Finals") {
                league.status = 'completed';
                await league.save();
                
                await pushAndEmitNotification(req, league.players, {
                    _id: new mongoose.Types.ObjectId().toString(),
                    message: `🏆 GRAND FINALE CONCLUDED! The tournament "${league.name}" is officially complete. Congratulations to our Grand Champion! Check the final bracket layouts now.`,
                    type: "league_assignment",
                    isRead: false,
                    createdAt: new Date()
                });
                return;
            }

            let advancedWinners = [];
            currentRoundMatches.forEach(match => {
                const winnerId = match.playerAScore > match.playerBScore ? match.playerA : match.playerB;
                advancedWinners.push(winnerId);
            });

            const nextMatchdayNumber = activeMatchday + 1;
            const nextRoundMatchesCount = advancedWinners.length / 2;
            let nextRoundName = nextRoundMatchesCount === 1 ? "Finals" : nextRoundMatchesCount === 2 ? "Semifinals" : "Quarterfinals";
            
            let nextRoundFixtures = [];

            for (let i = 0; i < nextRoundMatchesCount; i++) {
                nextRoundFixtures.push({
                    leagueId: objectIdLeagueId,
                    matchday: nextMatchdayNumber,
                    roundName: nextRoundName,
                    label: `R${nextMatchdayNumber}_MATCH_${i + 1}`,
                    playerA: advancedWinners[i * 2],
                    playerB: advancedWinners[i * 2 + 1],
                    playerAScore: null,
                    playerBScore: null,
                    playerASubmittedScore: null,
                    playerBSubmittedScore: null,
                    status: 'pending'
                });
            }

            await Fixture.insertMany(nextRoundFixtures);

            league.currentMatchday = nextMatchdayNumber;
            await league.save();

            await pushAndEmitNotification(req, league.players, {
                _id: new mongoose.Types.ObjectId().toString(),
                message: `🪓 NEXT ROUND READY: Round ${nextMatchdayNumber} (${nextRoundName}) inside "${league.name}" has loaded! Congratulations! Head to your dashboard to run your match pairings.`,
                type: "general",
                isRead: false,
                createdAt: new Date()
            });

            return;
        }

        // --- HANDLER B: CLASSIC TOURNAMENTS LEG STANDARDS ---
        if (formatType === 'classic') {
            const totalFixturesCount = await Fixture.countDocuments({ leagueId: objectIdLeagueId });
            const confirmedFixturesCount = await Fixture.countDocuments({ leagueId: objectIdLeagueId, status: 'confirmed' });

            if (totalFixturesCount > 0 && confirmedFixturesCount === totalFixturesCount) {
                league.status = 'completed';
                await league.save();

                await pushAndEmitNotification(req, league.players, {
                    _id: new mongoose.Types.ObjectId().toString(),
                    message: `🏆 Season Concluded! All matchdays inside "${league.name}" are finished. Check the final Standings board to see your official rank positioning!`,
                    type: "league_assignment",
                    isRead: false,
                    createdAt: new Date()
                });
            }
            return;
        }

        // ---  HANDLER C: NEW GROUP STAGE + KNOCKOUT INTELLIGENT AUTOMATION ENGINE ---
        if (formatType === 'group_knockout' || formatType.includes('group')) {
            const totalFixtures = await Fixture.find({ leagueId: objectIdLeagueId });
            const activeMatchday = league.currentMatchday || 1;

            // Isolate group stage fixtures versus bracket knockout fixtures
            const groupStageFixtures = totalFixtures.filter(f => !f.stageType || f.stageType === 'group_stage');
            const uniqueGroupMatchdays = [...new Set(groupStageFixtures.map(f => f.matchday))].sort((a, b) => a - b);
            const maxGroupMatchday = uniqueGroupMatchdays.length > 0 ? uniqueGroupMatchdays[uniqueGroupMatchdays.length - 1] : 3;

            const currentRoundMatches = totalFixtures.filter(f => f.matchday === activeMatchday);
            const confirmedMatchesInRound = currentRoundMatches.filter(f => f.status === 'confirmed');

            // Gatekeeping block check: Stop if the current week isn't finished playing yet
            if (currentRoundMatches.length === 0 || confirmedMatchesInRound.length !== currentRoundMatches.length) {
                return;
            }

            // Scenario 1: We are still grinding inside the Group Stage pool play
            if (activeMatchday < maxGroupMatchday) {
                const nextMatchdayNumber = activeMatchday + 1;
                league.currentMatchday = nextMatchdayNumber;
                await league.save();

                await pushAndEmitNotification(req, league.players, {
                    _id: new mongoose.Types.ObjectId().toString(),
                    message: `📅 MATCHDAY COOLDOWN OVER: Week ${nextMatchdayNumber} Fixtures inside "${league.name}" are officially live! Run your games now.`,
                    type: "general",
                    isRead: false,
                    createdAt: new Date()
                });
                return;
            }

            // Scenario 2: Group stages are completely over! Transition to Knockouts / Play-offs
            if (activeMatchday === maxGroupMatchday) {
                const leagueData = await League.findById(objectIdLeagueId).populate('players', 'username');
                const playerGroupMap = {};
                totalFixtures.forEach(f => {
                    const idA = f.playerA?._id ? f.playerA._id.toString() : f.playerA?.toString();
                    const idB = f.playerB?._id ? f.playerB._id.toString() : f.playerB?.toString();
                    if (idA && f.groupLabel) playerGroupMap[idA] = f.groupLabel;
                    if (idB && f.groupLabel) playerGroupMap[idB] = f.groupLabel;
                });

                const standingsMap = {};
                leagueData.players.forEach(p => {
                    standingsMap[p._id.toString()] = { playerId: p._id, username: p.username, groupLabel: playerGroupMap[p._id.toString()] || 'A', points: 0, gd: 0 };
                });

                groupStageFixtures.forEach(f => {
                    if (f.status === 'confirmed') {
                        const idA = f.playerA?._id ? f.playerA._id.toString() : f.playerA?.toString();
                        const idB = f.playerB?._id ? f.playerB._id.toString() : f.playerB?.toString();
                        if (standingsMap[idA] && standingsMap[idB]) {
                            standingsMap[idA].gd += (f.playerAScore - f.playerBScore);
                            standingsMap[idB].gd += (f.playerBScore - f.playerAScore);
                            if (f.playerAScore > f.playerBScore) standingsMap[idA].points += 3;
                            else if (f.playerBScore > f.playerAScore) standingsMap[idB].points += 3;
                            else { standingsMap[idA].points += 1; standingsMap[idB].points += 1; }
                        }
                    }
                });

                const groupSegments = {};
                Object.values(standingsMap).forEach(row => {
                    if (!groupSegments[row.groupLabel]) groupSegments[row.groupLabel] = [];
                    groupSegments[row.groupLabel].push(row);
                });

                const survivors = [];
                const thirdPlaceWildcards = [];
                const knockedOut = [];

                Object.keys(groupSegments).forEach(label => {
                    groupSegments[label].sort((a, b) => b.points - a.points || b.gd - a.gd);
                    groupSegments[label].forEach((row, index) => {
                        if (index < 2) survivors.push(row.playerId);
                        else if (index === 2) thirdPlaceWildcards.push(row.playerId);
                        else knockedOut.push(row.playerId);
                    });
                });
//   Move notifications up here so they ALWAYS fire when groups conclude
                if (knockedOut.length > 0) {
                    await pushAndEmitNotification(req, knockedOut, {
                        _id: new mongoose.Types.ObjectId().toString(),
                        message: `💔 CAMPAIGN CONCLUDED: You finished outside the qualification tier in your pool. "${league.name}" has advanced to the bracket stage. Better luck next season!`,
                        type: "general",
                        isRead: false,
                        createdAt: new Date()
                    });
                }

                if (survivors.length > 0) {
                    await pushAndEmitNotification(req, survivors, {
                        _id: new mongoose.Types.ObjectId().toString(),
                        message: `🔥 GROUP STAGE SURVIVED: Object secured! You qualified for the Knockout Phase inside "${league.name}". Brackets have spawned live on your hub page!`,
                        type: "general",
                        isRead: false,
                        createdAt: new Date()
                    });
                }
                // Check if direct survivors hit a perfect power of two bracket scale size rule
                const countOfSurvivors = survivors.length;
                const isPowerOfTwo = countOfSurvivors > 0 && (countOfSurvivors & (countOfSurvivors - 1)) === 0;

                // THE WILDCARD EXTRACTION BRANCH: Activate play-off if direct qualifiers have irregular counts (e.g., 12 players)
                if (!isPowerOfTwo && thirdPlaceWildcards.length >= 2) {
                    const nextMatchdayNumber = activeMatchday + 1;
                    let playOffFixtures = [];
                    const matchesCount = Math.floor(thirdPlaceWildcards.length / 2);

                    for (let i = 0; i < matchesCount; i++) {
                        playOffFixtures.push({
                            leagueId: objectIdLeagueId,
                            matchday: nextMatchdayNumber,
                            roundName: "Wildcard Play-off",
                            stageType: 'wildcard_stage', // Unique structural identifier tag
                            label: `WILDCARD_M${i + 1}`,
                            playerA: thirdPlaceWildcards[i],
                            playerB: thirdPlaceWildcards[thirdPlaceWildcards.length - 1 - i],
                            playerAScore: null,
                            playerBScore: null,
                            playerASubmittedScore: null,
                            playerBSubmittedScore: null,
                            status: 'pending'
                        });
                    }

                    await Fixture.insertMany(playOffFixtures);
                    league.currentMatchday = nextMatchdayNumber;
                    await league.save();

                    // Alert players to check the newly spawned play-off round
                    await pushAndEmitNotification(req, thirdPlaceWildcards, {
                        _id: new mongoose.Types.ObjectId().toString(),
                        message: `🔥 WILDCARD LINE ACTIVATED: You finished 3rd in your pool and qualified for the high-stakes Wildcard Play-off round inside "${league.name}"! Run your survival pairing match now.`,
                        type: "general",
                        isRead: false,
                        createdAt: new Date()
                    });
                    return;
                }

               

                const nextMatchdayNumber = activeMatchday + 1;
                const matchesCount = survivors.length / 2;
                let roundName = matchesCount === 1 ? "Finals" : matchesCount === 2 ? "Semifinals" : "Quarterfinals";

                let bracketFixtures = [];
                for (let i = 0; i < matchesCount; i++) {
                    bracketFixtures.push({
                        leagueId: objectIdLeagueId,
                        matchday: nextMatchdayNumber,
                        roundName: roundName,
                        stageType: 'knockout_stage',
                        label: `BRACKET_R${nextMatchdayNumber}_M${i + 1}`,
                        playerA: survivors[i],
                        playerB: survivors[survivors.length - 1 - i], 
                        playerAScore: null,
                        playerBScore: null,
                        playerASubmittedScore: null,
                        playerBSubmittedScore: null,
                        status: 'pending'
                    });
                }

                await Fixture.insertMany(bracketFixtures);
                league.currentMatchday = nextMatchdayNumber;
                await league.save();
                return;
            }

            // Scenario 3: Handling progression after the transitional Wildcard stage / deep Knockout stages
            if (activeMatchday > maxGroupMatchday) {
                const wildcardFixtures = totalFixtures.filter(f => f.stageType === 'wildcard_stage');
                const isWildcardMatchdayActive = wildcardFixtures.length > 0 && wildcardFixtures[0].matchday === activeMatchday;

                //  POST-WILDCARD MERGE LOGIC LAYER: Runs when the wildcard play-off matches finish playing
                if (isWildcardMatchdayActive) {
                    const wildcardWinners = currentRoundMatches.map(m => m.playerAScore > m.playerBScore ? m.playerA : m.playerB);
                    
                    // Re-compile the original Top 2 direct qualifiers who were resting during the wildcard round
                    const leagueData = await League.findById(objectIdLeagueId).populate('players', 'username');
                    const playerGroupMap = {};
                    totalFixtures.forEach(f => {
                        const idA = f.playerA?._id ? f.playerA._id.toString() : f.playerA?.toString();
                        const idB = f.playerB?._id ? f.playerB._id.toString() : f.playerB?.toString();
                        if (idA && f.groupLabel) playerGroupMap[idA] = f.groupLabel;
                        if (idB && f.groupLabel) playerGroupMap[idB] = f.groupLabel;
                    });

                    const standingsMap = {};
                    leagueData.players.forEach(p => {
                        standingsMap[p._id.toString()] = { playerId: p._id, points: 0, gd: 0, groupLabel: playerGroupMap[p._id.toString()] || 'A' };
                    });

                    groupStageFixtures.forEach(f => {
                        if (f.status === 'confirmed') {
                            const idA = f.playerA?._id ? f.playerA._id.toString() : f.playerA?.toString();
                            const idB = f.playerB?._id ? f.playerB._id.toString() : f.playerB?.toString();
                            if (standingsMap[idA] && standingsMap[idB]) {
                                standingsMap[idA].gd += (f.playerAScore - f.playerBScore);
                                standingsMap[idB].gd += (f.playerBScore - f.playerAScore);
                                if (f.playerAScore > f.playerBScore) standingsMap[idA].points += 3;
                                else if (f.playerBScore > f.playerAScore) standingsMap[idB].points += 3;
                                else { standingsMap[idA].points += 1; standingsMap[idB].points += 1; }
                            }
                        }
                    });

                    const groupSegments = {};
                    Object.values(standingsMap).forEach(row => {
                        if (!groupSegments[row.groupLabel]) groupSegments[row.groupLabel] = [];
                        groupSegments[row.groupLabel].push(row);
                    });

                    const directSurvivors = [];
                    Object.keys(groupSegments).forEach(label => {
                        groupSegments[label].sort((a, b) => b.points - a.points || b.gd - a.gd);
                        groupSegments[label].forEach((row, index) => {
                            if (index < 2) directSurvivors.push(row.playerId);
                        });
                    });

                    // Merge direct qualifiers with our new wildcard play-off winners
                    const finalKnockoutPool = [...directSurvivors, ...wildcardWinners];
                    const nextMatchdayNumber = activeMatchday + 1;
                    const nextMatchesCount = finalKnockoutPool.length / 2;
                    
                    // Determine the bracket round name dynamically based on the total team count
                    let roundName = nextMatchesCount === 1 ? "Finals" : nextMatchesCount === 2 ? "Semifinals" : nextMatchesCount === 4 ? "Quarterfinals" : `Round of ${finalKnockoutPool.length}`;

                    let mergedBracketFixtures = [];
                    for (let i = 0; i < nextMatchesCount; i++) {
                        mergedBracketFixtures.push({
                            leagueId: objectIdLeagueId,
                            matchday: nextMatchdayNumber,
                            roundName: roundName,
                            stageType: 'knockout_stage',
                            label: `BRACKET_R${nextMatchdayNumber}_M${i + 1}`,
                            playerA: finalKnockoutPool[i],
                            playerB: finalKnockoutPool[finalKnockoutPool.length - 1 - i],
                            playerAScore: null,
                            playerBScore: null,
                            playerASubmittedScore: null,
                            playerBSubmittedScore: null,
                            status: 'pending'
                        });
                    }

                    await Fixture.insertMany(mergedBracketFixtures);
                    league.currentMatchday = nextMatchdayNumber;
                    await league.save();

                    await pushAndEmitNotification(req, league.players, {
                        _id: new mongoose.Types.ObjectId().toString(),
                        message: `🪓 MAIN BRACKETS SPAWNED: The official ${roundName} stage fixtures inside "${league.name}" are loaded! Check the leaderboard tree now.`,
                        type: "general",
                        isRead: false,
                        createdAt: new Date()
                    });
                    return;
                }

                // Standard implementation: Progressive advancement inside deep sudden-death knockout trees
                const knockoutFixtures = totalFixtures.filter(f => f.stageType === 'knockout_stage');
                const currentRoundKnockouts = knockoutFixtures.filter(f => f.matchday === activeMatchday);
                
                const isFinalsMatch = currentRoundKnockouts.length === 1 && 
                    currentRoundKnockouts[0].roundName && 
                    String(currentRoundKnockouts[0].roundName).trim().toLowerCase() === "finals";

                if (isFinalsMatch) {
                    league.status = 'completed';
                    await league.save();

                    await pushAndEmitNotification(req, league.players, {
                        _id: new mongoose.Types.ObjectId().toString(),
                        message: `🏆 CHAMPIONSHIP TIMELINE SEALED! The dynamic bracket for "${league.name}" is finished. Hail to the champion!`,
                        type: "league_assignment",
                        isRead: false,
                        createdAt: new Date()
                    });
                    return;
                }

                let advancedWinners = [];
                currentRoundKnockouts.forEach(match => {
                    const winnerId = match.playerAScore > match.playerBScore ? match.playerA : match.playerB;
                    advancedWinners.push(winnerId);
                });

                const nextMatchdayNumber = activeMatchday + 1;
                const nextMatchesCount = advancedWinners.length / 2;
                let nextRoundName = nextMatchesCount === 1 ? "Finals" : "Semifinals";

                let nextRoundFixtures = [];
                for (let i = 0; i < nextMatchesCount; i++) {
                    nextRoundFixtures.push({
                        leagueId: objectIdLeagueId,
                        matchday: nextMatchdayNumber,
                        roundName: nextRoundName,
                        stageType: 'knockout_stage',
                        label: `BRACKET_R${nextMatchdayNumber}_M${i + 1}`,
                        playerA: advancedWinners[i * 2],
                        playerB: advancedWinners[i * 2 + 1],
                        playerAScore: null,
                        playerBScore: null,
                        playerASubmittedScore: null,
                        playerBSubmittedScore: null,
                        status: 'pending'
                    });
                }

                await Fixture.insertMany(nextRoundFixtures);
                league.currentMatchday = nextMatchdayNumber;
                await league.save();

                await pushAndEmitNotification(req, league.players, {
                    _id: new mongoose.Types.ObjectId().toString(),
                    message: `🪓 SUDDEN DEATH BRACKET UPDATED: The next knockout tier (${nextRoundName}) inside "${league.name}" is ready!`,
                    type: "general",
                    isRead: false,
                    createdAt: new Date()
                });
            }
        }

    } catch (error) {
        console.error("Critical failure executing automated progression pipeline loops:", error);
    }
};

// Subsidiary structural handler helper managing nested post-group bracket escalations
const handleKnockoutProgressionCheck = async (req, league, totalFixtures) => {
    const activeMatchday = league.currentMatchday || 1;
    const currentMatches = totalFixtures.filter(f => f.matchday === activeMatchday);
    const confirmedMatches = currentMatches.filter(f => f.status === 'confirmed');

    if (currentMatches.length === 0 || confirmedMatches.length !== currentMatches.length) return;

    if (currentMatches.length === 1 && currentMatches[0].roundName === "Finals") {
        league.status = 'completed';
        await league.save();
        return;
    }

    let advancedWinners = currentMatches.map(m => m.playerAScore > m.playerBScore ? m.playerA : m.playerB);
    const nextMatchday = activeMatchday + 1;
    const nextMatchesCount = advancedWinners.length / 2;
    const roundName = nextMatchesCount === 1 ? "Finals" : "Semifinals";

    let nextFixtures = [];
    for (let i = 0; i < nextMatchesCount; i++) {
        nextFixtures.push({
            leagueId: league._id,
            matchday: nextMatchday,
            stageType: 'knockout_stage',
            roundName,
            label: `K_R${nextMatchday}_MATCH_${i + 1}`,
            playerA: advancedWinners[i * 2],
            playerB: advancedWinners[i * 2 + 1],
            status: 'pending'
        });
    }

    await Fixture.insertMany(nextFixtures);
    league.currentMatchday = nextMatchday;
    await league.save();
};

module.exports = router;