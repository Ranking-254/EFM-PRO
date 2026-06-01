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