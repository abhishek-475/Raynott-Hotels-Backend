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

const router = express.Router();

router.get("/", getRooms);
router.get("/:id", getRoomById);
router.route("/:id/availability")
  .get(checkRoomAvailability);

// Admin-only
router.post("/", protect, admin, createRoom);
router.put("/:id", protect, admin, updateRoom);
router.delete("/:id", protect, admin, deleteRoom);


module.exports = router;
