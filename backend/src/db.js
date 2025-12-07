const { Pool } = require("pg");
require("dotenv").config();

// Create a connection pool to PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "modex_ticket",
});

// Initialize database schema
const initializeDatabase = async () => {
  try {
    // Create shows table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shows (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        total_seats INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create seats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seats (
        id SERIAL PRIMARY KEY,
        show_id INT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
        seat_number VARCHAR(10) NOT NULL,
        status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED', 'LOCKED')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(show_id, seat_number)
      );
    `);

    // Create bookings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        show_id INT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED')),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create booking_seats junction table (many-to-many)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS booking_seats (
        id SERIAL PRIMARY KEY,
        booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        seat_id INT NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(booking_id, seat_id)
      );
    `);

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_seats_show_id ON seats(show_id);
      CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);
      CREATE INDEX IF NOT EXISTS idx_bookings_show_id ON bookings(show_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_bookings_expires_at ON bookings(expires_at);
    `);

    console.log("✓ Database schema initialized successfully");
  } catch (err) {
    console.error("✗ Error initializing database schema:", err);
    console.warn("⚠️  Continuing despite database error. Server will still start.");
    // Don't exit, allow server to start and retry connection later
  }
};

// Call initialization on module load (non-blocking)
initializeDatabase().catch(err => {
  console.error("Database initialization error:", err);
});

module.exports = pool;
