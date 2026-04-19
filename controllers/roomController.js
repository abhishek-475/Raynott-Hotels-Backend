const Room = require("../models/Room");
const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");


// ================= GET ALL ROOMS =================
exports.getRooms = async (req, res, next) => {
    try {
        const rooms = await Room.find().populate("hotel");
        res.json(rooms);
    } catch (err) {
        next(err);
    }
};


// ================= GET ROOM BY ID =================
exports.getRoomById = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.id).populate("hotel");

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.json(room);
    } catch (err) {
        next(err);
    }
};


// ================= CREATE ROOM (ADMIN) =================
exports.createRoom = async (req, res, next) => {
    try {
        const room = await Room.create(req.body);

        // attach room to hotel
        if (room.hotel) {
            const hotel = await Hotel.findById(room.hotel);

            if (hotel) {
                hotel.rooms = hotel.rooms || [];
                hotel.rooms.push(room._id);
                await hotel.save();
            }
        }

        res.status(201).json(room);

    } catch (err) {
        next(err);
    }
};


// ================= UPDATE ROOM (ADMIN) =================
exports.updateRoom = async (req, res, next) => {
    try {
        const updated = await Room.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.json(updated);

    } catch (err) {
        next(err);
    }
};


// ================= DELETE ROOM (ADMIN) =================
exports.deleteRoom = async (req, res, next) => {
    try {
        const removed = await Room.findByIdAndDelete(req.params.id);

        if (!removed) {
            return res.status(404).json({ message: "Room not found" });
        }

        // remove from hotel
        if (removed.hotel) {
            const hotel = await Hotel.findById(removed.hotel);

            if (hotel) {
                hotel.rooms = (hotel.rooms || []).filter(
                    r => r.toString() !== removed._id.toString()
                );
                await hotel.save();
            }
        }

        res.json({ message: "Room deleted successfully" });

    } catch (err) {
        next(err);
    }
};


// ================= CHECK AVAILABILITY =================
exports.checkRoomAvailability = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut } = req.query;

        if (!checkIn || !checkOut) {
            return res.status(400).json({
                message: "checkIn and checkOut are required"
            });
        }

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({
                message: "Invalid date format"
            });
        }

        if (startDate >= endDate) {
            return res.status(400).json({
                message: "Check-out must be after check-in"
            });
        }

        const existingBooking = await Booking.findOne({
            room: id,
            status: { $in: ["confirmed", "pending"] },
            startDate: { $lt: endDate },
            endDate: { $gt: startDate }
        });

        const available = !existingBooking;

        res.json({
            available,
            roomId: id,
            checkIn: startDate,
            checkOut: endDate,
            message: available
                ? "Room is available"
                : "Room is not available",
            conflictingBooking: existingBooking || null
        });

    } catch (err) {
        next(err);
    }
};