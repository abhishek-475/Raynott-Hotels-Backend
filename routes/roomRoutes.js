const express = require("express");
const {
    getRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    checkRoomAvailability
} = require("../controllers/roomController");
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // <-- import upload middleware

const router = express.Router();

// ================= PUBLIC ROUTES =================
router.get("/", getRooms);
router.get("/:id", getRoomById);
router.get("/:id/availability", checkRoomAvailability);

// ================= ADMIN ROUTES =================

router.post("/", protect, admin, upload.array('images', 5), createRoom);
router.put("/:id", protect, admin, upload.array('images', 5), updateRoom);
router.delete("/:id", protect, admin, deleteRoom);

module.exports = router;