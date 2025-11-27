const express = require('express');
const { register, login , getAllUsers, updateUser, deleteUser, createAdmin, getProfile} = require('../controllers/authController');
const { protect, admin} = require('../middleware/authMiddleware')

const router = express.Router();


router.post('/register', register);
router.post('/login', login);
router.post("/create-admin", createAdmin);
router.get("/profile", protect, getProfile); 

// /api/admin/users
router.get("/users", protect, admin, getAllUsers);
router.put("/users/:id", protect, admin, updateUser);
router.delete("/users/:id", protect, admin, deleteUser);

module.exports = router;