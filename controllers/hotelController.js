const Hotel = require('../models/Hotel');
const cloudinary = require('../config/cloudinary');

// ================= CREATE HOTEL =================
exports.createHotel = async (req, res, next) => {
    try {
        const hotelData = { ...req.body };

        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => {
                return new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'hotels' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result.secure_url);
                        }
                    );
                    uploadStream.end(file.buffer);
                });
            });
            hotelData.images = await Promise.all(uploadPromises);
        }

        const hotel = await Hotel.create(hotelData);
        res.status(201).json(hotel);
    } catch (err) {
        next(err);
    }
};

// ================= GET HOTELS =================
exports.getHotels = async (req, res, next) => {
    try {
        const {
            city,
            country,
            stars,
            search,
            page = 1,
            limit = 9,
            sort = "newest"
        } = req.query;

        const pageNum = Math.max(Number(page), 1);
        const limitNum = Math.min(Number(limit), 50);
        const filter = {};

        if (search) {
            const regex = new RegExp(search, "i");
            filter.$or = [
                { name: regex },
                { city: regex },
                { country: regex }
            ];
        }

        if (city) filter.city = new RegExp(city, "i");
        if (country) filter.country = new RegExp(country, "i");
        if (stars && !isNaN(stars)) filter.stars = Number(stars);

        const sortOption = {
            newest: { createdAt: -1 },
            stars: { stars: -1 },
            "stars-low": { stars: 1 }
        }[sort] || { createdAt: -1 };

        const [hotels, total] = await Promise.all([
            Hotel.find(filter)
                .sort(sortOption)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .select("-__v")
                .populate({
                    path: "rooms",
                    select: "title price capacity images",
                    options: { lean: true }
                })
                .lean(),
            Hotel.countDocuments(filter)
        ]);

        res.json({
            hotels,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
        });
    } catch (err) {
        next(err);
    }
};

// ================= GET HOTEL BY ID =================
exports.getHotelById = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id).populate('rooms');
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        res.json(hotel);
    } catch (err) {
        next(err);
    }
};

// ================= UPDATE HOTEL =================
exports.updateHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) return res.status(404).json({ message: "Hotel not found" });

        const updateData = { ...req.body };

        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => {
                return new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'hotels' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result.secure_url);
                        }
                    );
                    uploadStream.end(file.buffer);
                });
            });
            updateData.images = await Promise.all(uploadPromises);
        }

        const updated = await Hotel.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate("rooms");

        res.json(updated);
    } catch (err) {
        next(err);
    }
};

// ================= DELETE HOTEL =================
exports.deleteHotel = async (req, res, next) => {
    try {
        const removed = await Hotel.findByIdAndDelete(req.params.id);
        if (!removed) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        res.json({ message: "Hotel removed" });
    } catch (err) {
        next(err);
    }
};