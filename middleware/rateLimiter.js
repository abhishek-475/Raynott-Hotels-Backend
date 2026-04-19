const rateLimit = require('express-rate-limit');

// Login limiter (strict)
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: {
        message: 'Too many attempts. Try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});