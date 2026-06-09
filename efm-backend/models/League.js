// models/League.js
const mongoose = require('mongoose');

const LeagueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a league name'],
        unique: true,
        trim: true,
        maxlength: [50, 'League name cannot exceed 50 characters']
    },
    maxStrengthLimit: {
        type: Number,
        required: [true, 'Please define a maximum collective team strength limit for this league'],
        default: 3100
    },
    capacity: {
        type: Number,
        required: [true, 'Please specify the maximum number of participating players'],
        default: 10 // Typically 10 or 12 players for a tight local league
    },
    rounds: {
        type: Number,
        required: [true, 'Please specify the number of rounds to play'],
        default: 0 // 0 = full round-robin (n-1 rounds), otherwise use the number provided
    },
    status: {
        type: String,
        enum: ['recruiting', 'active', 'completed'],
        default: 'recruiting'
    },
    currentMatchday: {
        type: Number,
        default: 1
    },

    // 🚀 NEW: Tracks the style configuration structure used by your fixtures generator engine
    tournamentFormat: {
        type: String,
        enum: ['classic', 'knockout', 'group_knockout'],
        default: 'classic'
    },

    // 🚀 NEW: Specifies how many group pools to divide players into (Only active for group_knockout)
    groupStageCount: {
        type: Number,
        default: 4
    },
    
    // We will store an array of user Object IDs representing players who have joined this specific league
    players: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],

    // Custom text field for tournament rules and special manager guidelines
    rules: {
        type: String,
        default: ''
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('League', LeagueSchema);