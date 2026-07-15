const mongoose = require('mongoose'); 
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const calculatePrice = require("../utils/priceCalculator");
const validateBookingDates = require("../utils/dateValidator");

// ================= CREATE BOOKING =================
exports.createBooking = async (req, res, next) => {
    try {
        const { hotel, room, startDate, endDate, guests } = req.body;

        if (!hotel || !room || !startDate || !endDate || !guests) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const { s, e } = validateBookingDates(startDate, endDate);

        const roomData = await Room.findById(room);
        if (!roomData) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (guests > roomData.capacity) {
            return res.status(400).json({
                message: `Room capacity is ${roomData.capacity} guests`
            });
        }

        // --- Use transaction ---
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Check overlap with transaction
            const existing = await Booking.findOne({
                room,
                status: { $in: ["confirmed", "pending"] },
                startDate: { $lt: e },
                endDate: { $gt: s }
            }).session(session);

            if (existing) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    message: "Room already booked for selected dates"
                });
            }

            const { nights, totalPrice } = calculatePrice(roomData, s, e);

            const booking = await Booking.create([{
                user: req.user.id,
                hotel,
                room,
                startDate: s,
                endDate: e,
                guests,
                nights,           // now stored
                totalPrice,
                status: "confirmed"
            }], { session });

            await session.commitTransaction();
            session.endSession();

            return res.status(201).json({
                message: "Booking successful",
                booking: booking[0]
            });

        } catch (txErr) {
            await session.abortTransaction();
            session.endSession();
            throw txErr;
        }

    } catch (err) {
        next(err);
    }
};

// ================= USER BOOKINGS =================
exports.getUserBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate("hotel")
            .populate("room")
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (err) {
        next(err);
    }
};

// ================= ADMIN: ALL BOOKINGS =================
exports.getAllBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find()
            .populate("user", "name email")
            .populate("hotel")
            .populate("room")
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (err) {
        next(err);
    }
};

// ================= SINGLE BOOKING =================
exports.getBookingById = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("user", "name email")
            .populate("hotel")
            .populate("room");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (
            booking.user._id.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        res.json(booking);
    } catch (err) {
        next(err);
    }
};

// ================= CANCEL BOOKING =================
exports.cancelBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (
            booking.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        booking.status = "cancelled";
        await booking.save();

        res.json({
            message: "Booking cancelled",
            booking
        });
    } catch (err) {
        next(err);
    }
};

// ================= ADMIN: UPDATE STATUS =================
exports.updateBookingStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const allowed = ["pending", "confirmed", "cancelled"];

        if (!allowed.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        booking.status = status;
        await booking.save();

        res.json({
            message: "Status updated",
            booking
        });
    } catch (err) {
        next(err);
    }
};