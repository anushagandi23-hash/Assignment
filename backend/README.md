# Modex Ticket Booking System - Backend

A production-grade ticket booking system backend built with **Node.js**, **Express.js**, and **PostgreSQL**. The system handles high-concurrency scenarios, prevents overbooking through database transactions and row-level locking, and includes booking expiry logic.

## Features

✅ **Admin Features**
- Create new shows/trips with configurable seats
- View all shows and their availability

✅ **User Features**
- Browse available shows
- Book one or multiple seats atomically
- View booking status (PENDING, CONFIRMED, FAILED, EXPIRED)
- Real-time seat availability

✅ **Concurrency Handling**
- Database transactions with SERIALIZABLE isolation
- Row-level locks (FOR UPDATE) to prevent race conditions
- Atomic seat booking operations
- Handles concurrent booking requests safely

✅ **Booking Expiry**
- PENDING bookings automatically expire after 2 minutes
- Automatic seat release on expiry
- Admin endpoint to trigger expiry processing

## Tech Stack

- **Runtime:** Node.js v14+
- **Framework:** Express.js 5.x
- **Database:** PostgreSQL 12+
- **Additional:** dotenv, cors, uuid

## Setup Instructions

### 1. Prerequisites

- Node.js v14+ installed
- PostgreSQL 12+ installed and running
- npm or yarn package manager

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb modex_ticket
```

The schema will be automatically initialized on first run via `src/db.js`.

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
PORT=4000
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=modex_ticket
NODE_ENV=development
```

Update the values to match your PostgreSQL configuration.

### 4. Install Dependencies

```bash
cd backend
npm.cmd install
```

(On Windows with PowerShell script restrictions, use `npm.cmd install`)

### 5. Run the Server

**Development** (with auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

The server will start on `http://localhost:4000`

Health check: `http://localhost:4000/health`

## API Documentation

All endpoints are prefixed with `/api`

### Show Management

#### 1. Create Show (Admin)
```http
POST /api/admin/shows
Content-Type: application/json

{
  "name": "Bus: Mumbai to Delhi",
  "startTime": "2024-12-10T10:00:00Z",
  "totalSeats": 40
}
```

**Response:**
```json
{
  "message": "Show created successfully",
  "show": {
    "id": 1,
    "name": "Bus: Mumbai to Delhi",
    "start_time": "2024-12-10T10:00:00.000Z",
    "total_seats": 40,
    "created_at": "2024-12-06T10:30:45.123Z"
  },
  "totalSeatsCreated": 40
}
```

#### 2. Get All Shows
```http
GET /api/shows
```

**Response:**
```json
{
  "shows": [
    {
      "id": 1,
      "name": "Bus: Mumbai to Delhi",
      "start_time": "2024-12-10T10:00:00.000Z",
      "total_seats": 40,
      "available_seats": 40,
      "created_at": "2024-12-06T10:30:45.123Z"
    }
  ],
  "total": 1
}
```

#### 3. Get Show by ID (with seat details)
```http
GET /api/shows/1
```

**Response:**
```json
{
  "show": {
    "id": 1,
    "name": "Bus: Mumbai to Delhi",
    "start_time": "2024-12-10T10:00:00.000Z",
    "total_seats": 40,
    "created_at": "2024-12-06T10:30:45.123Z",
    "seats": [
      {
        "id": 1,
        "seat_number": "A1",
        "status": "AVAILABLE"
      },
      {
        "id": 2,
        "seat_number": "A2",
        "status": "BOOKED"
      }
    ],
    "availableSeats": 39,
    "bookedSeats": 1
  }
}
```

### Booking Management

#### 1. Book Seats
```http
POST /api/shows/1/book
Content-Type: application/json

{
  "seatNumbers": ["A1", "A2", "B1"]
}
```

**Success Response (201):**
```json
{
  "message": "Booking confirmed successfully",
  "booking": {
    "id": 1,
    "showId": 1,
    "seatNumbers": ["A1", "A2", "B1"],
    "status": "CONFIRMED",
    "createdAt": "2024-12-06T10:35:10.123Z",
    "expiresAt": "2024-12-06T10:37:10.123Z"
  }
}
```

**Conflict Response (409):**
```json
{
  "error": "Some seats are already booked or locked",
  "unavailable": ["A1"]
}
```

#### 2. Get Booking Details
```http
GET /api/bookings/1
```

**Response:**
```json
{
  "booking": {
    "id": 1,
    "showId": 1,
    "status": "CONFIRMED",
    "seats": ["A1", "A2", "B1"],
    "createdAt": "2024-12-06T10:35:10.123Z",
    "expiresAt": "2024-12-06T10:37:10.123Z",
    "updatedAt": "2024-12-06T10:35:10.123Z"
  }
}
```

#### 3. Expire PENDING Bookings (Admin)
```http
POST /api/admin/bookings/expire
```

**Response:**
```json
{
  "message": "Expired bookings processed",
  "processed": 5
}
```

**Note:** This endpoint is available for manual triggering, but **automatic expiry is already running in the background**. The system includes a background service that automatically checks for and expires PENDING bookings every 30 seconds. No manual intervention is required.

## Database Schema

### Shows Table
```sql
CREATE TABLE shows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  total_seats INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Seats Table
```sql
CREATE TABLE seats (
  id SERIAL PRIMARY KEY,
  show_id INT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  seat_number VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED', 'LOCKED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(show_id, seat_number)
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  show_id INT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Booking Seats Table (Junction)
```sql
CREATE TABLE booking_seats (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id INT NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(booking_id, seat_id)
);
```

## Concurrency Handling & Race Condition Prevention

### The Problem
In a distributed system with concurrent booking requests, the following race condition can occur:

1. User A queries seat availability → Seat X is AVAILABLE
2. User B queries seat availability → Seat X is AVAILABLE
3. User A books Seat X → Success
4. User B books Seat X → FAILURE (should be caught, not succeeded)

### Our Solution

We use **database-level transaction isolation and row-level locking**:

```javascript
// Within booking transaction:
BEGIN ISOLATION LEVEL SERIALIZABLE;

// 1. Lock seats with FOR UPDATE (exclusive lock)
SELECT id, seat_number, status FROM seats
WHERE show_id = $1 AND seat_number = ANY($2)
FOR UPDATE;  // ← Acquires exclusive lock on these rows

// 2. Check availability
// 3. Update seats to BOOKED
// 4. Create booking records
// 5. Commit

COMMIT;
```

**Why this works:**
- `FOR UPDATE` acquires exclusive locks on selected rows
- Other transactions must wait until the lock is released
- This ensures only one transaction can book a given seat
- SERIALIZABLE isolation prevents phantom reads
- Conflicts are detected and rolled back with proper error messages

### Key Design Decisions

| Feature | Implementation | Benefit |
|---------|---|---|
| **Row-level Locking** | `SELECT FOR UPDATE` in transaction | Prevents simultaneous bookings of same seat |
| **SERIALIZABLE Isolation** | `BEGIN ISOLATION LEVEL SERIALIZABLE` | Prevents all race conditions |
| **Atomic Transactions** | All seat ops in single transaction | All-or-nothing booking |
| **Booking Expiry** | 2-min expires_at timestamp | Auto-release if payment timeout |
| **Optimistic Retries** | Client retries on serialization conflicts | Handles conflict gracefully |

## Scalability Considerations

See `TECHNICAL_DESIGN.md` for detailed production scalability architecture including:
- Database sharding strategies
- Caching layers (Redis)
- Message queues (RabbitMQ, Kafka)
- Load balancing
- Monitoring and alerting

## Testing

### Load Testing (Concurrency)

```bash
# Simulate 10 concurrent users booking seats for show ID 1
# Each user tries to book 3 seats
# Using Apache Bench or curl in a loop
```

Example test script:
```bash
#!/bin/bash
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/shows/1/book \
    -H "Content-Type: application/json" \
    -d "{\"seatNumbers\": [\"A$i\", \"B$i\", \"C$i\"]}" &
done
wait
```

## Common Issues & Troubleshooting

### PostgreSQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Ensure PostgreSQL is running:
```bash
# Windows (PowerShell)
Get-Service -Name postgres* | Start-Service

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### PowerShell Script Execution Error
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded
```
**Solution:** Use `npm.cmd install` instead of `npm install`:
```bash
npm.cmd install express pg dotenv cors
```

Or set execution policy:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

### Database Already Exists
If you get "database already exists" error, drop and recreate:
```bash
dropdb modex_ticket
createdb modex_ticket
```

## File Structure

```
backend/
├── .env                          # Environment configuration
├── .gitignore                    # Git ignore file
├── package.json                  # Dependencies
├── package-lock.json             # Lock file
├── server.js                     # Entry point
├── src/
│   ├── app.js                    # Express app configuration
│   ├── db.js                     # Database connection & schema
│   ├── controllers/
│   │   ├── bookingController.js  # Booking logic (concurrency)
│   │   └── showController.js     # Show CRUD operations
│   └── routes/
│       └── bookingRoutes.js      # API route definitions
└── README.md                     # This file
```

## Future Enhancements

- [ ] Authentication & Authorization (JWT)
- [ ] Rate limiting per user
- [ ] Payment gateway integration
- [ ] Seat hold functionality (soft lock)
- [ ] Real-time seat updates via WebSocket
- [ ] Email notifications for bookings
- [ ] Automated booking expiry via cron
- [ ] Comprehensive logging (Winston, Morgan)
- [ ] API metrics & monitoring (Prometheus)
- [ ] Integration tests & stress tests

## Contributing

For now, this is an assessment project. Future contributions should follow:
1. Create a feature branch
2. Make changes with clear commit messages
3. Add tests for new functionality
4. Update documentation

## License

ISC

---

**Built with ❤️ for Modex Assessment**
