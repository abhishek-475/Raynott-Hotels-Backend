require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();


// ================= MIDDLEWARE =================
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}


// ================= ROUTES =================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hotels', require('./routes/hotelRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));


// ================= HEALTH CHECK =================
app.get('/', (req, res) => {
    res.json({
        status: 'API Running ',
        time: new Date()
    });
});


// ================= ERROR HANDLER =================
app.use(errorHandler);


// ================= DB + SERVER START =================
const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(` Server running on port: ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('DB connection failed:', err.message);
        process.exit(1);
    });