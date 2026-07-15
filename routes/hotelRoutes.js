const express = require("express");
const {
    getHotelById,
    getHotels,
    createHotel,
    updateHotel,
    deleteHotel
} = require("../controllers/hotelController");
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");   

const router = express.Router();

// ================= PUBLIC =================


router.get("/", getHotels);
router.get("/:id", getHotelById);

// ================= ADMIN =================


router.post("/", protect, admin, upload.array('images', 5), createHotel);
router.put("/:id", protect, admin, upload.array('images', 5), updateHotel);
router.delete("/:id", protect, admin, deleteHotel);

module.exports = router;