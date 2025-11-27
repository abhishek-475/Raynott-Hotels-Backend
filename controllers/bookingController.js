const Booking = require("../models/Booking");
const Room = require("../models/Room");
const Hotel = require("../models/Hotel");


exports.createBooking = async (req, res, next) => {
    try {
        const { hotelId, roomId, startDate, endDate, guests } = req.body;

        if (!hotelId || !roomId || !startDate || !endDate) {
            res.status(400);
            return next(new Error("hotelId, roomId, startDate and endDate are required"));
        }

        const room = await Room.findById(roomId);
        if (!room) {
            res.status(404);
            return next(new Error("Room not found"));
        }

        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            res.status(404);
            return next(new Error("Hotel not found"));
        }

        // Check availability: ensure no overlap with existing bookings for this room
        // Overlap if: existing.startDate < newEnd && existing.endDate > newStart
        const existingOverlap = await Booking.findOne({
            room: roomId,
            $or: [
                {
                    startDate: { $lt: new Date(endDate) },
                    endDate: { $gt: new Date(startDate) },
                },
            ],
        });

        if (existingOverlap) {
            res.status(400);
            return next(new Error("Room not available for selected dates"));
        }

        // Calculate nights and total (simple: nights * room.price)
        const s = new Date(startDate);
        const e = new Date(endDate);
        const msPerDay = 1000 * 60 * 60 * 24;
        const nights = Math.max(1, Math.round((e - s) / msPerDay));
        const totalPrice = (room.price || 0) * nights;

        const booking = await Booking.create({
            user: req.user._id,
            hotel: hotelId,
            room: roomId,
            startDate: s,
            endDate: e,
            guests: guests || 1,
            totalPrice,
            status: "pending",
        });

        res.status(201).json(booking);
    } catch (err) {
        next(err);
    }
};


exports.getBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find()
            .populate("user", "-password")
            .populate("room")
            .populate("hotel");
        res.json(bookings);
    } catch (err) {
        next(err);
    }
};


exports.getMyBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate("room")
            .populate("hotel");
        res.json(bookings);
    } catch (err) {
        next(err);
    }
};


exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            res.status(404);
            return next(new Error("Booking not found"));
        }

        // Allow deletion if owner or admin
        if (req.user._id.toString() !== booking.user.toString() && req.user.role !== "admin") {
            res.status(403);
            return next(new Error("Not authorized to delete this booking"));
        }

        await Booking.findByIdAndDelete(req.params.id);
        res.json({ message: "Booking deleted" });
    } catch (err) {
        next(err);
    }
};


exports.updateBookingStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            res.status(404);
            return next(new Error("Booking not found"));
        }
        booking.status = status;
        await booking.save();
        res.json(booking);
    } catch (err) {
        next(err);
    }
};


