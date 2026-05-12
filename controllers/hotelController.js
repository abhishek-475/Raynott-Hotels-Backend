const Hotel = require('../models/Hotel');


// ================= CREATE HOTEL =================
exports.createHotel = async (req, res) => {
    try {
        const hotel = await Hotel.create(req.body);
        res.status(201).json(hotel);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ================= GET HOTELS =================
exports.getHotels = async (req, res) => {
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

        // Search
        if (search) {
            const regex = new RegExp(search, "i");

            filter.$or = [
                { name: regex },
                { city: regex },
                { country: regex }
            ];
        }

        // Filters
        if (city) {
            filter.city = new RegExp(city, "i");
        }

        if (country) {
            filter.country = new RegExp(country, "i");
        }

        if (stars && !isNaN(stars)) {
            filter.stars = Number(stars);
        }

        // Sorting
        const sortOption = {
            newest: { createdAt: -1 },
            stars: { stars: -1 },
            "stars-low": { stars: 1 }
        }[sort] || { createdAt: -1 };

        // Execute in parallel
        const [hotels, total] = await Promise.all([
            Hotel.find(filter)
                .sort(sortOption)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .select("-__v")
                .populate({
                    path: "rooms",
                    select: "name price maxGuests images",
                    options: { lean: true }
                })
                .lean(),

            Hotel.countDocuments(filter)
        ]);

        return res.json({
            hotels,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

// ================= GET HOTEL BY ID =================
exports.getHotelById = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id)
            .populate('rooms');

        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        res.json(hotel);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ================= UPDATE HOTEL =================
exports.updateHotel = async (req, res) => {
    try {
        const updated = await Hotel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate("rooms");

        if (!updated) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        res.json(updated);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ================= DELETE HOTEL =================
exports.deleteHotel = async (req, res) => {
    try {
        const removed = await Hotel.findByIdAndDelete(req.params.id);

        if (!removed) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        res.json({ message: "Hotel removed" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};