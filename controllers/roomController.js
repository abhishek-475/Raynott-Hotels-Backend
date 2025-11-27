const Room = require("../models/Room");
const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking"); // ADD THIS IMPORT

exports.getRooms = async (req, res, next) => {
    try {
        const rooms = await Room.find().populate("hotel");
        res.json(rooms);
    } catch (err) {
        next(err);
    }
};

exports.getRoomById = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.id).populate("hotel");
        if (!room) {
            res.status(404);
            return next(new Error("Room not found"));
        }
        res.json(room);
    } catch (err) {
        next(err);
    }
};

exports.createRoom = async (req, res, next) => {
    try {
        const payload = req.body;
        const room = await Room.create(payload);

        if (payload.hotel) {
            const hotel = await Hotel.findById(payload.hotel);
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

exports.updateRoom = async (req, res, next) => {
    try {
        const updated = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) {
            res.status(404);
            return next(new Error("Room not found"));
        }
        res.json(updated);
    } catch (err) {
        next(err);
    }
};

exports.deleteRoom = async (req, res, next) => {
    try {
        const removed = await Room.findByIdAndDelete(req.params.id);
        if (!removed) {
            res.status(404);
            return next(new Error("Room not found"));
        }
        if (removed.hotel) {
            const HotelModel = require("../models/Hotel");
            const hotel = await HotelModel.findById(removed.hotel);
            if (hotel) {
                hotel.rooms = (hotel.rooms || []).filter((r) => r.toString() !== removed._id.toString());
                await hotel.save();
            }
        }

        res.json({ message: "Room deleted" });
    } catch (err) {
        next(err);
    }
};

// FIXED: Added Booking import above
exports.checkRoomAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      res.status(400);
      return next(new Error("checkIn and checkOut dates are required"));
    }

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    // Validate dates
    if (startDate >= endDate) {
      res.status(400);
      return next(new Error("Check-out date must be after check-in date"));
    }

    // Check for overlapping bookings - FIXED QUERY
    const existingBooking = await Booking.findOne({
      room: id,
      status: { $in: ["confirmed", "pending"] },
      $or: [
        {
          startDate: { $lt: endDate },
          endDate: { $gt: startDate }
        }
      ]
    });

    const available = !existingBooking;

    res.json({
      available,
      roomId: id,
      checkIn: startDate,
      checkOut: endDate,
      message: available ? "Room is available" : "Room is not available for selected dates",
      conflictingBooking: available ? null : {
        id: existingBooking._id,
        startDate: existingBooking.startDate,
        endDate: existingBooking.endDate,
        status: existingBooking.status
      }
    });

  } catch (err) {
    console.error("Availability check error:", err);
    next(err);
  }
};