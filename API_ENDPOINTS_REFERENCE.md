# MODEX Ticket Booking System - API Endpoints Reference

## Base URL
```
http://localhost:4000/api
```

---

## SHOW MANAGEMENT ENDPOINTS

### 1. Create New Show (Admin Only)
**Endpoint:** `POST /admin/shows`

**Description:** Create a new show with auto-generated seat labels (A1, A2, ... Z10)

**Request Body:**
```json
{
  "name": "Concert 2025 - Taylor Swift",
  "startTime": "2025-12-15T19:00:00Z",
  "totalSeats": 100
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Event/show name |
| startTime | ISO 8601 datetime | Yes | Show start time (e.g., "2025-12-15T19:00:00Z") |
| totalSeats | number | Yes | Total seats to create (must be > 0) |

**Success Response:** `201 Created`
```json
{
  "message": "Show created successfully",
  "show": {
    "id": 1,
    "name": "Concert 2025 - Taylor Swift",
    "start_time": "2025-12-15T19:00:00.000Z",
    "total_seats": 100,
    "created_at": "2025-12-07T10:30:00.000Z"
  },
  "totalSeatsCreated": 100
}
```

**Error Response:** `400 Bad Request`
```json
{
  "error": "Missing required fields: name, startTime, totalSeats"
}
```

---

### 2. Get All Shows (User)
**Endpoint:** `GET /shows`

**Description:** Retrieve list of all shows with available/booked seat counts

**Request Body:** None

**Success Response:** `200 OK`
```json
{
  "shows": [
    {
      "id": 1,
      "name": "Concert 2025 - Taylor Swift",
      "start_time": "2025-12-15T19:00:00.000Z",
      "total_seats": 100,
      "available_seats": 98,
      "created_at": "2025-12-07T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 3. Get Show Details with Seat Grid (User)
**Endpoint:** `GET /shows/{showId}`

**Description:** Get detailed show information including all seats with their statuses

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| showId | number | Yes | Show ID (e.g., 1) |

**Request Body:** None

**Success Response:** `200 OK`
```json
{
  "show": {
    "id": 1,
    "name": "Concert 2025 - Taylor Swift",
    "start_time": "2025-12-15T19:00:00.000Z",
    "total_seats": 100,
    "created_at": "2025-12-07T10:30:00.000Z",
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
    "availableSeats": 98,
    "bookedSeats": 2
  }
}
```

**Seat Status Values:**
- `AVAILABLE` - Seat can be booked
- `BOOKED` - Seat is already booked

---

## BOOKING MANAGEMENT ENDPOINTS

### 4. Book Seats (CORE - User) ⭐
**Endpoint:** `POST /shows/{showId}/book`

**Description:** Book seats with SERIALIZABLE transaction isolation and row-level locking for race condition prevention

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| showId | number | Yes | Show ID (e.g., 1) |

**Request Body:**
```json
{
  "seatNumbers": ["A1", "A2", "B1"]
}
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| seatNumbers | array of strings | Yes | List of seat labels to book |

**Success Response:** `201 Created`
```json
{
  "message": "Booking confirmed successfully",
  "booking": {
    "id": 1,
    "showId": 1,
    "seatNumbers": ["A1", "A2", "B1"],
    "status": "CONFIRMED",
    "createdAt": "2025-12-07T10:35:00.000Z",
    "expiresAt": "2025-12-07T10:37:00.000Z"
  }
}
```

**Error Response - Seats Already Booked:** `409 Conflict`
```json
{
  "error": "Some seats are already booked or locked",
  "unavailable": ["A1", "A2"]
}
```

**Error Response - Invalid Seats:** `400 Bad Request`
```json
{
  "error": "Some seats do not exist for this show",
  "requested": ["A1", "A2", "Z99"],
  "found": ["A1", "A2"]
}
```

**Error Response - Show Not Found:** `404 Not Found`
```json
{
  "error": "Show not found"
}
```

**Important Notes:**
- Booking expires in **2 minutes** if not confirmed at counter
- Uses SERIALIZABLE isolation + FOR UPDATE locks
- Prevents overbooking under concurrent requests
- Booking status: PENDING → CONFIRMED (automatically)

---

### 5. Get Booking Details (User)
**Endpoint:** `GET /bookings/{bookingId}`

**Description:** Retrieve detailed booking information including all booked seats

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| bookingId | number | Yes | Booking ID (e.g., 1) |

**Request Body:** None

**Success Response:** `200 OK`
```json
{
  "booking": {
    "id": 1,
    "showId": 1,
    "status": "CONFIRMED",
    "seats": ["A1", "A2", "B1"],
    "createdAt": "2025-12-07T10:35:00.000Z",
    "expiresAt": "2025-12-07T10:37:00.000Z",
    "updatedAt": "2025-12-07T10:35:00.000Z"
  }
}
```

**Booking Status Values:**
- `CONFIRMED` - Valid booking within 2-minute window
- `EXPIRED` - Booking expired (seats released back to AVAILABLE)
- `PENDING` - Initial state (auto-converted to CONFIRMED)

---

### 6. Expire Pending Bookings (Admin/Cron)
**Endpoint:** `POST /admin/bookings/expire`

**Description:** Mark all expired PENDING bookings as EXPIRED and release their seats

**Request Body:** None

**Success Response:** `200 OK`
```json
{
  "message": "Expired bookings processed",
  "processed": 2
}
```

**Response (No Expired Bookings):** `200 OK`
```json
{
  "message": "No expired bookings to process",
  "processed": 0
}
```

**Notes:**
- Runs automatically every 30 seconds (background service)
- Can be called manually for immediate processing
- Marks PENDING bookings as EXPIRED when expires_at < NOW()
- Automatically releases booked seats back to AVAILABLE status

---

## ENDPOINT SUMMARY TABLE

| # | Method | Endpoint | Description | Auth | Response |
|---|--------|----------|-------------|------|----------|
| 1 | POST | /admin/shows | Create show | Admin | 201 |
| 2 | GET | /shows | List shows | User | 200 |
| 3 | GET | /shows/:id | Show details | User | 200 |
| 4 | POST | /shows/:showId/book | Book seats ⭐ | User | 201 |
| 5 | GET | /bookings/:bookingId | Booking details | User | 200 |
| 6 | POST | /admin/bookings/expire | Expire bookings | Admin | 200 |

---

## CURL EXAMPLES

### Create a Show
```bash
curl -X POST http://localhost:4000/api/admin/shows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Concert 2025",
    "startTime": "2025-12-15T19:00:00Z",
    "totalSeats": 50
  }'
```

### Get All Shows
```bash
curl -X GET http://localhost:4000/api/shows \
  -H "Content-Type: application/json"
```

### Get Show with ID 1
```bash
curl -X GET http://localhost:4000/api/shows/1 \
  -H "Content-Type: application/json"
```

### Book Seats (Show ID 1)
```bash
curl -X POST http://localhost:4000/api/shows/1/book \
  -H "Content-Type: application/json" \
  -d '{
    "seatNumbers": ["A1", "A2", "B1"]
  }'
```

### Get Booking Details (Booking ID 1)
```bash
curl -X GET http://localhost:4000/api/bookings/1 \
  -H "Content-Type: application/json"
```

### Expire Pending Bookings
```bash
curl -X POST http://localhost:4000/api/admin/bookings/expire \
  -H "Content-Type: application/json"
```

---

## TESTING WORKFLOW

### Step 1: Create a Show
```
POST /admin/shows
Body: {"name": "Test Show", "startTime": "2025-12-20T18:00:00Z", "totalSeats": 50}
→ Copy the returned "id" for next steps
```

### Step 2: View Show Details
```
GET /shows/{id}
→ See all available seats
```

### Step 3: Book Seats
```
POST /shows/{id}/book
Body: {"seatNumbers": ["A1", "A2"]}
→ Copy the returned "id" (this is bookingId)
```

### Step 4: Check Booking
```
GET /bookings/{bookingId}
→ Verify booking status and seats
```

### Step 5: Expire Bookings (Optional)
```
POST /admin/bookings/expire
→ Expire old bookings and release seats
```

---

## POSTMAN COLLECTION IMPORT

1. Open Postman
2. Click "Import" (top-left)
3. Select "MODEX_API_Collection.postman_collection.json"
4. All endpoints will be pre-configured with:
   - Correct HTTP methods
   - Request bodies
   - Example responses
   - Description and parameters for each endpoint

---

## CONCURRENCY & SAFETY

The booking system uses advanced database features:

- **SERIALIZABLE Isolation Level**: Prevents phantom reads and ensures strong consistency
- **Row-Level Locking (FOR UPDATE)**: Exclusive locks on selected seats during transaction
- **Atomic Transactions**: All or nothing - seats can't be partially booked
- **2-Minute Expiry**: Automatic seat release if booking not confirmed at counter

Result: **Zero overbooking** even with thousands of concurrent requests

---

## ERROR HANDLING

Common HTTP Status Codes:

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successfully retrieved data |
| 201 | Created | Successfully created resource |
| 400 | Bad Request | Missing/invalid parameters |
| 404 | Not Found | Show/booking doesn't exist |
| 409 | Conflict | Seats already booked (concurrency) |
| 500 | Server Error | Database connection issue |

---

## VERSION
- **API Version:** 1.0.0
- **Last Updated:** December 7, 2025
- **Status:** Production Ready ✅
