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
        const { city, country, stars } = req.query;

        const filter = {};

        if (city) filter.city = city;
        if (country) filter.country = country;
        if (stars) filter.stars = Number(stars);

        const hotels = await Hotel.find(filter)
            .populate('rooms');

        res.json(hotels);

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