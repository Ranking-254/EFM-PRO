// models/Fixture.js
const mongoose = require('mongoose');

const FixtureSchema = new mongoose.Schema({
    leagueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League',
        required: true
    },
    matchday: {
        type: Number,
        required: true // e.g., Matchday 1, Matchday 2...
    },
    // 🚀 NEW: Schema explicitly authorizes dynamic stage configurations tags tracking
    stageType: {
        type: String,
        enum: ['group_stage', 'knockout_stage'],
        default: 'group_stage'
    },
    // 🚀 NEW: Schema explicitly authorizes round-robin group letter bindings
    groupLabel: {
        type: String,
        default: null // Will hold raw string markers like 'A', 'B', 'C', 'D'
    },
    playerA: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    playerB: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    playerAScore: {
        type: Number,
        default: null // null means the game hasn't been played/reported yet
    },
    playerBScore: {
        type: Number,
        default: null
    },
    playerASubmittedScore: {
        type: Number,
        default: null // Track individual entry for verification
    },
    playerBSubmittedScore: {
        type: Number,
        default: null // Track individual entry for verification
    },
    roundName:
     {
         type: String, default: ''
 },
    status: {
        type: String,
        enum: ['pending', 'awaiting_confirmation', 'confirmed', 'disputed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Fixture', FixtureSchema);