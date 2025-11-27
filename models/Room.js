const mongoose = require('mongoose');
const roomSchema = new mongoose.Schema({
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    title: String,
    price: Number,
    capacity: Number,
    description: String,
    images: [String],
    availDates: [{ start: Date, end: Date }]
}, { timestamps: true });
module.exports = mongoose.model('Room', roomSchema);