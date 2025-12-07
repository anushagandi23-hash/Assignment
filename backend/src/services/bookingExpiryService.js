const pool = require("../db");

/**
 * Background service to automatically expire PENDING bookings
 * that have exceeded their 2-minute expiry time.
 * 
 * This service runs every 30 seconds to check for expired bookings
 * and automatically mark them as EXPIRED, releasing the seats.
 */
class BookingExpiryService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.intervalMs = 30000; // Check every 30 seconds
  }

  /**
   * Start the automatic expiry service
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️  Booking expiry service is already running");
      return;
    }

    console.log("🔄 Starting automatic booking expiry service...");
    this.isRunning = true;

    // Run immediately on start, then every interval
    this.expireBookings();
    this.intervalId = setInterval(() => {
      this.expireBookings();
    }, this.intervalMs);

    console.log(`✅ Booking expiry service started (checking every ${this.intervalMs / 1000}s)`);
  }

  /**
   * Stop the automatic expiry service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log("🛑 Booking expiry service stopped");
  }

  /**
   * Process expired bookings
   * Finds all PENDING bookings that have expired and marks them as EXPIRED
   */
  async expireBookings() {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Find all PENDING bookings that have expired (expires_at < NOW())
      const expiredRes = await client.query(
        `SELECT id FROM bookings
         WHERE status = 'PENDING' AND expires_at < NOW()`
      );

      const expiredBookingIds = expiredRes.rows.map((r) => r.id);

      if (expiredBookingIds.length === 0) {
        await client.query("COMMIT");
        return; // No expired bookings to process
      }

      console.log(`⏰ Found ${expiredBookingIds.length} expired booking(s) to process`);

      // Update expired bookings to EXPIRED status
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

      console.log(`✅ Processed ${expiredBookingIds.length} expired booking(s)`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("❌ Error in booking expiry service:", err.message);
    } finally {
      client.release();
    }
  }
}

// Create singleton instance
const bookingExpiryService = new BookingExpiryService();

module.exports = bookingExpiryService;

