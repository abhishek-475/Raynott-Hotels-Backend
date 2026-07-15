const razorpay = require('../config/razorpay');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const calculatePrice = require('../utils/priceCalculator');
const validateBookingDates = require('../utils/dateValidator');

// ====== 1. CREATE RAZORPAY ORDER ======
exports.createOrder = async (req, res, next) => {
  try {
    const { roomId, startDate, endDate, guests } = req.body;

    // Validate input
    if (!roomId || !startDate || !endDate || !guests) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Fetch room details
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Calculate price
    const { totalPrice } = calculatePrice(room, startDate, endDate);
    const amountInPaise = Math.round(totalPrice * 100); // Razorpay expects paise

   

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // auto-capture
    };

    const order = await razorpay.orders.create(options);

    // Return order details to frontend
    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error(' createOrder error:', err);
    console.log(err);
    
    next(err);
  }
};



// ====== 3. VERIFY PAYMENT AND CREATE BOOKING ======
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      paymentId,
      signature,
      hotelId,
      roomId,
      startDate,
      endDate,
      guests,
    } = req.body;

    // Validate required fields
    if (!orderId || !paymentId || !signature || !hotelId || !roomId || !startDate || !endDate || !guests) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify signature
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Payment verified – now create booking
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Validate dates again (prevent past dates, etc.)
    const { s, e, nights } = validateBookingDates(startDate, endDate);

    // Double-check availability (still important to prevent race)
    const existing = await Booking.findOne({
      room: roomId,
      status: { $in: ['confirmed', 'pending'] },
      startDate: { $lt: e },
      endDate: { $gt: s },
    });
    if (existing) {
      return res.status(400).json({ message: 'Room already booked for these dates' });
    }

    // Calculate total price (using same util)
    const { totalPrice } = calculatePrice(room, s, e);

    // Create booking with confirmed status and payment details
    const booking = await Booking.create({
      user: req.user.id,
      hotel: hotelId,
      room: roomId,
      startDate: s,
      endDate: e,
      guests,
      nights,
      totalPrice,
      status: 'confirmed',
      orderId,
      paymentId,
      paymentStatus: 'paid',
    });

    res.status(201).json({
      message: 'Booking confirmed and payment verified',
      booking,
    });

  } catch (err) {
    next(err);
  }
};