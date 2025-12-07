const pool = require("../db");
const { v4: uuidv4 } = require("uuid");

/**
 * Admin: Create a new show/trip
 * POST /api/admin/shows
 */
exports.createShow = async (req, res) => {
  const { name, startTime, totalSeats } = req.body;

  // Validation
  if (!name || !startTime || !totalSeats) {
    return res.status(400).json({
      error: "Missing required fields: name, startTime, totalSeats",
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
      `INSERT INTO shows(name, start_time, total_seats)
       VALUES ($1, $2, $3)
       RETURNING id, name, start_time, total_seats, created_at`,
      [name, new Date(startTime), totalSeats]
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
    res.status(500).json({ error: "Failed to create show" });
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
        start_time, 
        total_seats,
        (SELECT COUNT(*) FROM seats WHERE show_id = shows.id AND status = 'AVAILABLE') as available_seats,
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
      `SELECT id, name, start_time, total_seats, created_at
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
