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
    // We will store an array of user Object IDs representing players who have joined this specific league
    players: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('League', LeagueSchema);