require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');        
const compression = require('compression'); 

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Security headers
app.use(helmet());

// Compress responses
app.use(compression());

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', 
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging in development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ================= ROUTES =================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hotels', require('./routes/hotelRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes')); 

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'API Running',
        time: new Date()
    });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port: ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('DB connection failed:', err.message);
        process.exit(1);
    });