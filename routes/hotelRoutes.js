const express = require("express");

const {
    getHotelById,
    getHotels,
    createHotel,
    updateHotel,
    deleteHotel
} = require("../controllers/hotelController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();


// ================= PUBLIC =================
router.get("/", getHotels);
router.get("/:id", getHotelById);


// ================= ADMIN =================
router.post("/", protect, admin, createHotel);
router.put("/:id", protect, admin, updateHotel);
router.delete("/:id", protect, admin, deleteHotel);

module.exports = router;