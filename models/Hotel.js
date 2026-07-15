const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        address: {
            type: String,
            default: ""
        },

        city: {
            type: String,
            required: true,
            index: true
        },

        country: {
            type: String,
            required: true,
            index: true
        },

        stars: {
            type: Number,
            default: 3,
            min: 1,
            max: 5
        },

        images: {
            type: [String],
            default: []
        },

        amenities: {
            type: [String],
            default: []
        },

        rooms: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room'
        }]
    },
    { timestamps: true }
);

hotelSchema.index({ city: 1, country: 1 });
hotelSchema.index({ stars: 1 });

module.exports = mongoose.model('Hotel', hotelSchema);