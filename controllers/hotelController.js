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

        const filter = {};

        // Global search (name, city, country)
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { city: { $regex: search, $options: "i" } },
                { country: { $regex: search, $options: "i" } }
            ];
        }

        // Filters
        if (city) filter.city = { $regex: city, $options: "i" };
        if (country) filter.country = { $regex: country, $options: "i" };

        if (stars && !isNaN(stars)) {
            filter.stars = Number(stars);
        }

        // Sorting
        let sortOption = {};
        if (sort === "stars") sortOption.stars = -1;
        else if (sort === "stars-low") sortOption.stars = 1;
        else sortOption.createdAt = -1;

        const skip = (page - 1) * limit;

        const hotels = await Hotel.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit))
            .populate("rooms", "name price maxGuests images");

        const total = await Hotel.countDocuments(filter);

        res.json({
            hotels,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit)
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
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