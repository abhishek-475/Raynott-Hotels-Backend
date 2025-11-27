const Hotel = require('../models/Hotel');


exports.createHotel = async (req, res) => {
    try {
        const hotel = await Hotel.create(req.body);
        res.status(201).json(hotel);
    } catch (err) { res.status(500).json({ message: err.message }); }
};


exports.getHotels = async (req, res) => {
    const { city, country, stars } = req.query;
    const filter = {};
    if (city) filter.city = city;
    if (country) filter.country = country;
    if (stars) filter.stars = stars;
    try {
        const hotels = await Hotel.find(filter).populate('rooms');
        res.json(hotels);
    } catch (err) { res.status(500).json({ message: err.message }); }
};


exports.getHotelById = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id).populate('rooms');
        if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
        res.json(hotel);
    } catch (err) { res.status(500).json({ message: err.message }); }
};


exports.updateHotel = async (req, res, next) => {
    try {
        const updated = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        }).populate("rooms");
        if (!updated) {
            res.status(404);
            return next(new Error("Hotel not found"));
        }
        res.json(updated);
    } catch (err) {
        next(err);
    }
};



exports.deleteHotel = async (req, res, next) => {
    try {
        const removed = await Hotel.findByIdAndDelete(req.params.id);
        if (!removed) {
            res.status(404);
            return next(new Error("Hotel not found"));
        }
        res.json({ message: "Hotel removed" });
    } catch (err) {
        next(err);
    }
};