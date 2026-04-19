const express = require("express");

const {
    createBooking,
    getUserBookings,
    getAllBookings,
    getBookingById,
    cancelBooking,
    updateBookingStatus
} = require("../controllers/bookingController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();


// ================= USER ROUTES =================
router.post("/", protect, createBooking);
router.get("/my", protect, getUserBookings);
router.get("/:id", protect, getBookingById);
router.put("/:id/cancel", protect, cancelBooking);


// ================= ADMIN ROUTES =================
router.get("/", protect, admin, getAllBookings);
router.put("/:id/status", protect, admin, updateBookingStatus);

module.exports = router;