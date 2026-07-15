const Room = require("../models/Room");
const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");
const cloudinary = require("../config/cloudinary");

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
        // Build clean data – avoid any accidental fields from req.body
        const roomData = {
            hotel: req.body.hotel,
            title: req.body.title,
            price: Number(req.body.price),
            capacity: Number(req.body.capacity),
            description: req.body.description || '',
            images: [], // always start empty
        };

        // Check hotel existence
        const hotelExists = await Hotel.findById(roomData.hotel);
        if (!hotelExists) {
            return res.status(400).json({ message: "Hotel not found" });
        }

        // Upload images if provided
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => {
                return new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'rooms' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result.secure_url);
                        }
                    );
                    uploadStream.end(file.buffer);
                });
            });
            // No try/catch here — if Cloudinary fails, let it throw so the
            // outer catch/next(err) reports the real reason instead of
            // silently creating a room with no images.
            roomData.images = await Promise.all(uploadPromises);
        }

        const room = await Room.create(roomData);

        // Attach to hotel
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
        console.error('🔥 Create room error:', err);
        next(err);
    }
};

// ================= UPDATE ROOM (ADMIN) =================
exports.updateRoom = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Build update data explicitly – avoid spreading req.body
        const updateData = {
            hotel: req.body.hotel || room.hotel,
            title: req.body.title || room.title,
            price: req.body.price !== undefined ? Number(req.body.price) : room.price,
            capacity: req.body.capacity !== undefined ? Number(req.body.capacity) : room.capacity,
            description: req.body.description !== undefined ? req.body.description : room.description,
            images: room.images, // keep existing images unless new ones are uploaded
        };

        // Upload new images if provided (replace old ones)
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => {
                return new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'rooms' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result.secure_url);
                        }
                    );
                    uploadStream.end(file.buffer);
                });
            });
            // No try/catch here — if Cloudinary fails, let it throw so the
            // outer catch/next(err) reports the real reason instead of
            // silently keeping stale images with no explanation.
            updateData.images = await Promise.all(uploadPromises);
        }

        const updated = await Room.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json(updated);
    } catch (err) {
        console.error('🔥 Update room error:', err);
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
            return res.status(400).json({ message: "checkIn and checkOut are required" });
        }

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        if (startDate >= endDate) {
            return res.status(400).json({ message: "Check-out must be after check-in" });
        }

        const existingBooking = await Booking.findOne({
            room: id,
            status: { $in: ["confirmed", "pending"] },
            startDate: { $lt: endDate },
            endDate: { $gt: startDate }
        });

        res.json({
            available: !existingBooking,
            roomId: id,
            checkIn: startDate,
            checkOut: endDate,
            message: existingBooking ? "Room is not available" : "Room is available",
            conflictingBooking: existingBooking || null
        });
    } catch (err) {
        next(err);
    }
};