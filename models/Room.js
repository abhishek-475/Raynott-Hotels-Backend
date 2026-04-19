const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
    {
        hotel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hotel',
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        capacity: {
            type: Number,
            required: true,
            min: 1
        },

        description: {
            type: String,
            default: ""
        },

        images: {
            type: [String],
            default: []
        },

        availDates: [
            {
                start: Date,
                end: Date
            }
        ]
    },
    { timestamps: true }
);

roomSchema.index({ hotel: 1 });
roomSchema.index({ price: 1 });

module.exports = mongoose.model('Room', roomSchema);