// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, 'Please add a full name'],
        trim: true,
        maxlength: [100, 'Full name cannot be more than 100 characters']
    },
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true,
        maxlength: [20, 'Username cannot be more than 20 characters']
    },
    whatsappNumber: {
        type: String,
        required: [true, 'Please add a valid WhatsApp phone number'],
        trim: true
    },
    role: {
        type: String,
        enum: ['player', 'admin'],
        default: 'player'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);