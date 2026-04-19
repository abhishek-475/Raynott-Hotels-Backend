const Booking = require("../models/Booking");
const Room = require("../models/Room");
const calculatePrice = require("../utils/priceCalculator");


// ================= DATE VALIDATION =================
const validateBookingDates = (startDate, endDate) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const s = new Date(startDate);
    const e = new Date(endDate);

    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        throw new Error("Invalid date format");
    }

    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);

    if (s < now) throw new Error("Cannot book past dates");
    if (e <= s) throw new Error("Check-out must be after check-in");

    const nights = Math.ceil((e - s) / (1000 * 60 * 60 * 24));

    if (nights > 30) {
        throw new Error("Maximum stay is 30 nights");
    }

    return { s, e, nights };
};


// ================= CREATE BOOKING =================
exports.createBooking = async (req, res, next) => {
    try {
        const { hotel, room, startDate, endDate, guests } = req.body;

        if (!hotel || !room || !startDate || !endDate || !guests) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // validate dates
        const { s, e } = validateBookingDates(startDate, endDate);

        // check room
        const roomData = await Room.findById(room);
        if (!roomData) {
            return res.status(404).json({ message: "Room not found" });
        }

        // capacity check
        if (guests > roomData.capacity) {
            return res.status(400).json({
                message: `Room capacity is ${roomData.capacity} guests`
            });
        }

        // overlap check (important for availability)
        const existing = await Booking.findOne({
            room,
            status: { $in: ["confirmed", "pending"] },
            startDate: { $lt: e },
            endDate: { $gt: s }
        });

        if (existing) {
            return res.status(400).json({
                message: "Room already booked for selected dates"
            });
        }

        // secure price calculation
        const { nights, totalPrice } = calculatePrice(roomData, s, e);

        const booking = await Booking.create({
            user: req.user.id,
            hotel,
            room,
            startDate: s,
            endDate: e,
            guests,
            nights,
            totalPrice,
            status: "confirmed"
        });

        return res.status(201).json({
            message: "Booking successful",
            booking
        });

    } catch (err) {
        next(err);
    }
};


// ================= USER BOOKINGS =================
exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate("hotel")
            .populate("room")
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ================= ADMIN: ALL BOOKINGS =================
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("user", "name email")
            .populate("hotel")
            .populate("room")
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ================= SINGLE BOOKING =================
exports.getBookingById = async (req, res) => {
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
        res.status(500).json({ message: err.message });
    }
};


// ================= CANCEL BOOKING =================
exports.cancelBooking = async (req, res) => {
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
        res.status(500).json({ message: err.message });
    }
};


// ================= ADMIN: UPDATE STATUS =================
exports.updateBookingStatus = async (req, res) => {
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
        res.status(500).json({ message: err.message });
    }
};