require('dotenv').config()
const express = require('express');
const cors = require('cors')
const morgan = require('morgan');
const connectDB = require('./config/db')

const errorHandler = require('./middleware/errorMiddleware');



const app = express();

app.use(cors())
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', require('./routes/authRoutes')); 
app.use('/api/hotels', require('./routes/hotelRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));



connectDB()

app.use(errorHandler);


const PORT = process.env.PORT || 5000


app.listen(PORT,()=>{
    console.log(`server running on port: ${PORT}`);
    
})