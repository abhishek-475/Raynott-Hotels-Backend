const express = require("express");

const {
    createBooking,
    getBookings,
    getMyBookings,
    deleteBooking,
    updateBookingStatus,
} = require("../controllers/bookingController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Create booking (user)
router.post("/", protect, createBooking);

// Get my bookings (user)
router.get("/my", protect, getMyBookings);

// Admin: list all bookings
router.get("/", protect, admin, getBookings);

// Admin: update booking status
router.put("/:id/status", protect, admin, updateBookingStatus);

// Delete booking (owner or admin)
router.delete("/:id", protect, deleteBooking);

module.exports = router;
