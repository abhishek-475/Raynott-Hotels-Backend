const calculatePrice = (room, startDate, endDate) => {
    const s = new Date(startDate);
    const e = new Date(endDate);

    const nights = Math.max(
        1,
        Math.ceil((e - s) / (1000 * 60 * 60 * 24))
    );

    return {
        nights,
        totalPrice: room.price * nights
    };
};

module.exports = calculatePrice;