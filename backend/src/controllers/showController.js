const pool = require("../db");
const { v4: uuidv4 } = require("uuid");

/**
 * Admin: Create a new show/trip
 * POST /api/admin/shows
 */
exports.createShow = async (req, res) => {
  const { name, fromLocation, toLocation, startTime, totalSeats } = req.body;

  // Validation
  if (!name || !fromLocation || !toLocation || !startTime || !totalSeats) {
    return res.status(400).json({
      error: "Missing required fields: name, fromLocation, toLocation, startTime, totalSeats",
    });
  }

  if (totalSeats <= 0) {
    return res.status(400).json({ error: "Total seats must be greater than 0" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create show
    const showRes = await client.query(
      `INSERT INTO shows(name, from_location, to_location, start_time, total_seats)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, from_location, to_location, start_time, total_seats, created_at`,
      [name, fromLocation, toLocation, new Date(startTime), totalSeats]
    );

    const showId = showRes.rows[0].id;

    // Generate seats (A1, A2, ... B1, B2, etc.)
    const seatInserts = [];
    let seatNumber = 1;

    for (let i = 0; i < totalSeats; i++) {
      const row = Math.floor(i / 10); // 10 seats per row
      const col = (i % 10) + 1;
      const seatLabel = `${String.fromCharCode(65 + row)}${col}`; // A1, A2, ... Z10

      seatInserts.push([showId, seatLabel]);
    }

    // Batch insert all seats
    for (const [sid, label] of seatInserts) {
      await client.query(
        `INSERT INTO seats(show_id, seat_number, status)
         VALUES ($1, $2, 'AVAILABLE')`,
        [sid, label]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Show created successfully",
      show: showRes.rows[0],
      totalSeatsCreated: totalSeats,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating show:", err);
    res.status(500).json({ 
      error: "Failed to add bus",
      details: err.message 
    });
  } finally {
    client.release();
  }
};

/**
 * Get all shows
 * GET /api/shows
 */
exports.getAllShows = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, 
        name,
        from_location,
        to_location, 
        start_time, 
        total_seats,
        (SELECT COUNT(*) FROM seats WHERE show_id = shows.id AND status = 'AVAILABLE') as available_seats,
        (SELECT COUNT(*) FROM seats WHERE show_id = shows.id AND status = 'BOOKED') as booked_seats,
        created_at
       FROM shows
       ORDER BY start_time ASC`
    );

    res.json({
      shows: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    console.error("Error fetching shows:", err);
    res.status(500).json({ error: "Failed to fetch shows" });
  }
};

/**
 * Get a single show with seat details
 * GET /api/shows/:id
 */
exports.getShowById = async (req, res) => {
  const { id } = req.params;

  try {
    const showRes = await pool.query(
      `SELECT id, name, from_location, to_location, start_time, total_seats, created_at
       FROM shows
       WHERE id = $1`,
      [id]
    );

    if (showRes.rows.length === 0) {
      return res.status(404).json({ error: "Show not found" });
    }

    const show = showRes.rows[0];

    // Get seat details
    const seatsRes = await pool.query(
      `SELECT id, seat_number, status
       FROM seats
       WHERE show_id = $1
       ORDER BY seat_number ASC`,
      [id]
    );

    res.json({
      show: {
        ...show,
        seats: seatsRes.rows,
        availableSeats: seatsRes.rows.filter((s) => s.status === "AVAILABLE")
          .length,
        bookedSeats: seatsRes.rows.filter((s) => s.status === "BOOKED").length,
      },
    });
  } catch (err) {
    console.error("Error fetching show:", err);
    res.status(500).json({ error: "Failed to fetch show" });
  }
};

/**
 * Admin: Update a show
 * PUT /api/admin/shows/:id
 */
exports.updateShow = async (req, res) => {
  const { id } = req.params;
  const { name, fromLocation, toLocation, startTime } = req.body;

  if (!name || !fromLocation || !toLocation || !startTime) {
    return res.status(400).json({
      error: "Missing required fields: name, fromLocation, toLocation, startTime",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE shows
       SET name = $1, from_location = $2, to_location = $3, start_time = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, from_location, to_location, start_time, total_seats, created_at`,
      [name, fromLocation, toLocation, new Date(startTime), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Show not found" });
    }

    res.json({
      message: "Show updated successfully",
      show: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating show:", err);
    res.status(500).json({ error: "Failed to update show" });
  }
};

/**
 * Admin: Delete a show
 * DELETE /api/admin/shows/:id
 */
exports.deleteShow = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check if show has any CONFIRMED bookings
    const bookingCheck = await client.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE show_id = $1 AND status = 'CONFIRMED'`,
      [id]
    );

    if (parseInt(bookingCheck.rows[0].count) > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Cannot delete show with confirmed bookings",
      });
    }

    // Delete all seats for this show
    await client.query(`DELETE FROM seats WHERE show_id = $1`, [id]);

    // Delete all bookings for this show
    await client.query(`DELETE FROM bookings WHERE show_id = $1`, [id]);

    // Delete the show
    const result = await client.query(
      `DELETE FROM shows WHERE id = $1 RETURNING id, name`,
      [id]
    );

    await client.query("COMMIT");

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Show not found" });
    }

    res.json({
      message: "Show deleted successfully",
      show: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting show:", err);
    res.status(500).json({ error: "Failed to delete show" });
  } finally {
    client.release();
  }
};
