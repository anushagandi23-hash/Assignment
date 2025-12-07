const router = require("express").Router();
const { bookSeats, getBooking, expireBookings } = require("../controllers/bookingController");
const { createShow, getAllShows, getShowById } = require("../controllers/showController");

// ============ SHOW ROUTES ============

// Admin: Create a new show
router.post("/admin/shows", createShow);

// User: Get all available shows
router.get("/shows", getAllShows);

// User: Get show details with seat information
router.get("/shows/:id", getShowById);

// ============ BOOKING ROUTES ============

// User: Book seats for a show
router.post("/shows/:showId/book", bookSeats);

// User: Get booking details
router.get("/bookings/:bookingId", getBooking);

// Admin: Expire PENDING bookings (call this periodically via cron)
router.post("/admin/bookings/expire", expireBookings);

module.exports = router;
