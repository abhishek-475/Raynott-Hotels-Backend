const mongoose = require('mongoose');
const hotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    address: String,
    city: String,
    country: String,
    stars: { type: Number, default: 3 },
    images: [String],
    amenities: [String],
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }]
}, { timestamps: true });
module.exports = mongoose.model('Hotel', hotelSchema);