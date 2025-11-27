const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    startDate: Date,
    endDate: Date,
    guests: Number,
    totalPrice: Number,
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
}, { timestamps: true });
module.exports = mongoose.model('Booking', bookingSchema);