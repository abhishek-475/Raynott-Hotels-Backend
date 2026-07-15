
const validateBookingDates = (startDate, endDate) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const s = new Date(startDate);
    const e = new Date(endDate);

    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        throw new Error("Invalid date format");
    }

    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);

    if (s < now) throw new Error("Cannot book past dates");
    if (e <= s) throw new Error("Check-out must be after check-in");

    const nights = Math.ceil((e - s) / (1000 * 60 * 60 * 24));

    if (nights > 30) {
        throw new Error("Maximum stay is 30 nights");
    }

    return { s, e, nights };
};

module.exports = validateBookingDates;