const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        hotel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hotel',
            required: true
        },

        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: true
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        guests: {
            type: Number,
            required: true,
            min: 1
        },

        totalPrice: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'pending'
        }
    },
    { timestamps: true }
);


// ================= INDEXES (IMPORTANT FOR PERFORMANCE) =================
bookingSchema.index({ room: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ hotel: 1, startDate: 1 });
bookingSchema.index({ user: 1 });


module.exports = mongoose.model('Booking', bookingSchema);