const express = require('express');
const {
    register,
    login,
    getAllUsers,
    updateUser,
    deleteUser,
    createAdmin,
    getProfile
} = require('../controllers/authController');

const { protect, admin } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();


// ================= AUTH ROUTES =================
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);


// ================= PROFILE =================
router.get('/profile', protect, getProfile);


// ================= ADMIN CREATION (SECURED) =================
router.post('/create-admin', protect, admin, createAdmin);


// ================= ADMIN USER MANAGEMENT =================
router.get('/users', protect, admin, getAllUsers);
router.delete('/users/:id', protect, admin, deleteUser);


// ================= USER UPDATE =================
// allow self OR admin (NO admin-only restriction here)
router.put('/users/:id', protect, updateUser);


module.exports = router;