// models/HallOfFame.js
const mongoose = require("mongoose");

const HallOfFameSchema = new mongoose.Schema({
  leagueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "League",
    required: true,
  },
  leagueName: { type: String, required: true },
  formatType: { type: String, required: true }, // 'classic', 'knockout'
  isPaid: { type: Boolean, default: false },
  prizePool: { type: Number, default: 0 },
  podium: {
    winner: {
      userId: String,
      username: String,
      teamName: String,
    },
    runnerUp: {
      userId: String,
      username: String,
      teamName: String,
    },
    thirdPlace: {
      userId: String,
      username: String,
      teamName: String,
    },
  },
  concludedAt: { type: Date, default: Date.now },
});

// 🟢 Checks if Mongoose already compiled it; if not, compiles it cleanly.
module.exports =
  mongoose.models.HallOfFame || mongoose.model("HallOfFame", HallOfFameSchema);
