// routes/hallOfFame.js
const express = require("express");
const router = express.Router();
const HallOfFame = require("../models/HallOfFame");

// 🔌 GET Endpoint to fetch all historical tournament documents
router.get("/hall-of-fame", async (req, res) => {
  try {
    console.log(
      "🔌 [HOF ROUTE] Fetching Hall of Fame documents from MongoDB...",
    );
    const history = await HallOfFame.find().sort({ concludedAt: -1 });

    res.status(200).json({ success: true, data: history });
  } catch (err) {
    console.error("❌ [HOF ROUTE] Fetch Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
// 🔬 DIAGNOSTIC ENDPOINT: Inspect tournament data states
router.get("/hof-debug", async (req, res) => {
  try {
    // Fetch the 3 most recently updated leagues to see their status
    const recentLeagues = await require("../models/League")
      .find()
      .sort({ updatedAt: -1 })
      .limit(3);

    const diagnosticData = recentLeagues.map((l) => ({
      name: l.name,
      status: l.status, // Is this 'active', 'completed', or something else?
      formatType: l.formatType,
      hasStandingsArray: Array.isArray(l.standings),
      standingsLength: l.standings ? l.standings.length : 0,
    }));

    res.status(200).json({
      success: true,
      message: "HOF pipeline diagnosis logs retrieved.",
      recentLeagues: diagnosticData,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🏆 FORCE MANUAL COMPLETION & HOF MIGRATION
router.post("/force-complete/:leagueId", async (req, res) => {
  try {
    const League = require("../models/League");
    const Fixture = require("../models/Fixture");
    const HallOfFame = require("../models/HallOfFame");

    const leagueId = req.params.leagueId;
    const league = await League.findById(leagueId).populate(
      "players",
      "username",
    );

    if (!league) {
      return res
        .status(404)
        .json({ success: false, error: "League not found." });
    }

    // 1. Pull all confirmed fixtures for this league to calculate standings dynamically
    const fixtures = await Fixture.find({
      leagueId: league._id,
      status: "confirmed",
    });

    const statsMap = {};
    league.players.forEach((p) => {
      statsMap[p._id.toString()] = {
        userId: p._id,
        username: p.username,
        teamName: "Club Owner",
        points: 0,
        gd: 0,
      };
    });

    fixtures.forEach((f) => {
      const idA = f.playerA?.toString();
      const idB = f.playerB?.toString();

      if (statsMap[idA] && statsMap[idB]) {
        statsMap[idA].gd += f.playerAScore - f.playerBScore;
        statsMap[idB].gd += f.playerBScore - f.playerAScore;

        if (f.playerAScore > f.playerBScore) statsMap[idA].points += 3;
        else if (f.playerBScore > f.playerAScore) statsMap[idB].points += 3;
        else {
          statsMap[idA].points += 1;
          statsMap[idB].points += 1;
        }
      }
    });

    const sortedStandings = Object.values(statsMap).sort(
      (a, b) => b.points - a.points || b.gd - a.gd,
    );

    if (sortedStandings.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No player statistics could be computed for this league.",
      });
    }

    // 2. Safely create the Hall of Fame entry mapping tournamentFormat dynamically
    const hofRecord = await HallOfFame.create({
      leagueId: league._id,
      leagueName: league.name,
      formatType: league.tournamentFormat || league.formatType || "classic",
      isPaid: league.isPaid || false,
      prizePool: league.prizePool || 0,
      podium: {
        winner: sortedStandings[0]
          ? {
              userId: sortedStandings[0].userId.toString(),
              username: sortedStandings[0].username,
              teamName: sortedStandings[0].teamName,
            }
          : null,
        runnerUp: sortedStandings[1]
          ? {
              userId: sortedStandings[1].userId.toString(),
              username: sortedStandings[1].username,
              teamName: sortedStandings[1].teamName,
            }
          : null,
        thirdPlace: sortedStandings[2]
          ? {
              userId: sortedStandings[2].userId.toString(),
              username: sortedStandings[2].username,
              teamName: sortedStandings[2].teamName,
            }
          : null,
      },
    });

    // 3. Mark the league as officially completed inside the database
    league.status = "completed";
    await league.save();

    res.status(200).json({
      success: true,
      message: `Tournament "${league.name}" has been successfully pushed to the Hall of Fame!`,
      data: hofRecord,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
module.exports = router;
