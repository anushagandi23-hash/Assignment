const pool = require("../db");

/**
 * Book seats for a show (CORE FUNCTIONALITY)
 * POST /api/shows/:showId/book
 * Body: { seatNumbers: ["A1", "A2", "B1"] }
 *
 * Uses database transactions with row-level locking (FOR UPDATE)
 * to prevent race conditions and overbooking.
 */
exports.bookSeats = async (req, res) => {
  const { showId } = req.params;
  const { seatNumbers } = req.body;

  // Validation
  if (!seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return res
      .status(400)
      .json({ error: "seatNumbers must be a non-empty array" });
  }

  const client = await pool.connect();

  try {
    // Begin transaction with SERIALIZABLE isolation for maximum safety
    // This prevents phantom reads and ensures consistency under concurrency
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");

    // 1. Verify show exists
    const showRes = await client.query("SELECT id FROM shows WHERE id = $1", [
      showId,
    ]);
    if (showRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Show not found" });
    }

    // 2. Lock and check seat availability with FOR UPDATE
    // This acquires exclusive locks on matching rows, preventing other
    // transactions from modifying them until this transaction commits.
    const seatRows = await client.query(
      `SELECT id, seat_number, status FROM seats
       WHERE show_id = $1 AND seat_number = ANY($2)
       FOR UPDATE`,
      [showId, seatNumbers]
    );

    // Verify all requested seats exist
    if (seatRows.rows.length !== seatNumbers.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Some seats do not exist for this show",
        requested: seatNumbers,
        found: seatRows.rows.map((s) => s.seat_number),
      });
    }

    // Check all seats are AVAILABLE
    const unavailableSeats = seatRows.rows.filter(
      (s) => s.status !== "AVAILABLE"
    );
    if (unavailableSeats.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Some seats are already booked or locked",
        unavailable: unavailableSeats.map((s) => s.seat_number),
      });
    }

    // 3. Create booking record in PENDING status (2-minute expiry)
    const bookingRes = await client.query(
      `INSERT INTO bookings(show_id, status, expires_at)
       VALUES ($1, 'PENDING', NOW() + interval '2 minutes')
       RETURNING id, status, expires_at, created_at`,
      [showId]
    );
    const bookingId = bookingRes.rows[0].id;

    // 4. Update seat status to BOOKED
    const seatIds = seatRows.rows.map((s) => s.id);
    await client.query(
      `UPDATE seats SET status='BOOKED', updated_at=NOW() WHERE id = ANY($1)`,
      [seatIds]
    );

    // 5. Create booking_seats junction records
    for (const seatId of seatIds) {
      await client.query(
        `INSERT INTO booking_seats(booking_id, seat_id)
         VALUES ($1, $2)`,
        [bookingId, seatId]
      );
    }

    // 6. Keep booking as PENDING - user needs to confirm at counter
    // Status will remain PENDING until explicitly confirmed
    // No update needed - it's already set to PENDING on creation

    // 7. Commit transaction
    await client.query("COMMIT");

    res.status(201).json({
      message: "Seats locked successfully. Please proceed to confirm your booking.",
      booking: {
        id: bookingId,
        showId: parseInt(showId),
        seats: seatRows.rows.map((s) => s.seat_number),
        status: "PENDING",
        createdAt: bookingRes.rows[0].created_at,
        expiresAt: bookingRes.rows[0].expires_at,
        updatedAt: bookingRes.rows[0].created_at,
      },
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (e) {
      // Rollback might fail if transaction is already rolled back
    }

    console.error("Error booking seats:", err.message);

    // Handle serialization conflicts (concurrent bookings for same seats)
    if (
      err.code === "40P01" ||
      err.message.includes("serialization")
    ) {
      return res.status(409).json({
        error:
          "Booking conflict: seats were just booked by another user. Please try again.",
      });
    }

    res
      .status(500)
      .json({ error: "Failed to book seats", details: err.message });
  } finally {
    client.release();
  }
};

/**
 * Get booking details
 * GET /api/bookings/:bookingId
 */
exports.getBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const bookingRes = await pool.query(
      `SELECT id, show_id, status, expires_at, created_at, updated_at
       FROM bookings
       WHERE id = $1`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingRes.rows[0];

    // Get booked seats
    const seatsRes = await pool.query(
      `SELECT s.id, s.seat_number, s.status
       FROM seats s
       INNER JOIN booking_seats bs ON s.id = bs.seat_id
       WHERE bs.booking_id = $1`,
      [bookingId]
    );

    res.json({
      booking: {
        id: booking.id,
        showId: booking.show_id,
        status: booking.status,
        seats: seatsRes.rows.map((s) => s.seat_number),
        createdAt: booking.created_at,
        expiresAt: booking.expires_at,
        updatedAt: booking.updated_at,
      },
    });
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};

/**
 * Mark expired PENDING bookings as FAILED
 * This should be called periodically (e.g., via cron job or background task)
 * POST /api/admin/bookings/expire
 */
exports.expireBookings = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Find all PENDING bookings that have expired
    const expiredRes = await client.query(
      `SELECT id FROM bookings
       WHERE status = 'PENDING' AND expires_at < NOW()`
    );

    const expiredBookingIds = expiredRes.rows.map((r) => r.id);

    if (expiredBookingIds.length === 0) {
      await client.query("COMMIT");
      return res.json({
        message: "No expired bookings to process",
        processed: 0,
      });
    }

    // Update expired bookings to FAILED status
    await client.query(
      `UPDATE bookings SET status='EXPIRED', updated_at=NOW()
       WHERE id = ANY($1)`,
      [expiredBookingIds]
    );

    // Release the seats (set them back to AVAILABLE)
    await client.query(
      `UPDATE seats SET status='AVAILABLE', updated_at=NOW()
       WHERE id IN (
         SELECT seat_id FROM booking_seats
         WHERE booking_id = ANY($1)
       )`,
      [expiredBookingIds]
    );

    // Delete the booking_seats associations
    await client.query(
      `DELETE FROM booking_seats WHERE booking_id = ANY($1)`,
      [expiredBookingIds]
    );

    await client.query("COMMIT");

    res.json({
      message: "Expired bookings processed",
      processed: expiredBookingIds.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error expiring bookings:", err);
    res.status(500).json({ error: "Failed to expire bookings" });
  } finally {
    client.release();
  }
};

// ============ CONFIRM BOOKING ============
const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required" });
    }

    // Update booking status to CONFIRMED
    const result = await pool.query(
      `UPDATE bookings 
       SET status='CONFIRMED', updated_at=NOW()
       WHERE id=$1
       RETURNING *`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = result.rows[0];

    // Get all seats for this booking
    const seatsResult = await pool.query(
      `SELECT seat_number FROM seats 
       WHERE id IN (SELECT seat_id FROM booking_seats WHERE booking_id=$1)`,
      [bookingId]
    );

    res.json({
      message: "Booking confirmed successfully",
      booking: {
        id: booking.id,
        status: booking.status,
        seats: seatsResult.rows.map((s) => s.seat_number),
        expiresAt: booking.expires_at,
        updatedAt: booking.updated_at,
      },
    });
  } catch (err) {
    console.error("Error confirming booking:", err);
    res.status(500).json({ error: "Failed to confirm booking" });
  }
};

module.exports = {
  bookSeats: exports.bookSeats,
  getBooking: exports.getBooking,
  expireBookings: exports.expireBookings,
  confirmBooking,
};
