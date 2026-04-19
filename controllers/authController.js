const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ================= COMMON HELPERS =================

// Password validation
const validatePassword = (password) => {
    if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters');
    }

    if (
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/[0-9]/.test(password)
    ) {
        throw new Error(
            'Password must contain uppercase, lowercase, and number'
        );
    }
};

// Generate JWT
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('FATAL: JWT_SECRET not configured');
    }

    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};
// ================= REGISTER =================
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Apply password validation BEFORE hashing
        validatePassword(password);

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashed
        });

        // Use safe token generator
        const token = generateToken(user._id);

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// ================= LOGIN =================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Uses validated JWT_SECRET
        const token = generateToken(user._id);

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= GET PROFILE =================
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= GET ALL USERS (ADMIN ONLY) =================
exports.getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const users = await User.find().select("-password");
        res.json(users);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= UPDATE USER =================
exports.updateUser = async (req, res) => {
    try {
        // Allow only self or admin
        if (req.user.id !== req.params.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const updateData = { ...req.body };

        // Prevent role change by normal users
        if (req.user.role !== "admin") {
            delete updateData.role;
        }

        // Handle password update
        if (updateData.password) {
            validatePassword(updateData.password);
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(updatedUser);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= DELETE USER (ADMIN ONLY) =================
exports.deleteUser = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const deleted = await User.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= CREATE ADMIN (ADMIN ONLY) =================
exports.createAdmin = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        validatePassword(password);

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const admin = await User.create({
            name,
            email,
            password: hashed,
            role: "admin"
        });

        res.status(201).json({
            message: "Admin created",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};