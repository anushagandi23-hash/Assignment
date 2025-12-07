# MODEX API - Quick Testing Guide

## 🚀 Quick Start - Copy & Paste Commands

### 1️⃣ CREATE A SHOW
```bash
curl -X POST http://localhost:4000/api/admin/shows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coldplay World Tour 2025",
    "startTime": "2025-12-20T19:00:00Z",
    "totalSeats": 120
  }'
```
**Expected:** Returns Show ID (e.g., 1) - **Save this for next steps**

---

### 2️⃣ LIST ALL SHOWS
```bash
curl -X GET http://localhost:4000/api/shows \
  -H "Content-Type: application/json"
```
**Expected:** Array of all shows with available seat counts

---

### 3️⃣ GET SHOW DETAILS (with Show ID from step 1)
```bash
curl -X GET http://localhost:4000/api/shows/1 \
  -H "Content-Type: application/json"
```
**Expected:** Complete show info with all seats and their statuses

---

### 4️⃣ BOOK SEATS (with Show ID from step 1)
```bash
curl -X POST http://localhost:4000/api/shows/1/book \
  -H "Content-Type: application/json" \
  -d '{
    "seatNumbers": ["A1", "A2", "A3"]
  }'
```
**Expected:** Returns Booking ID and confirmation - **Save this for next steps**

---

### 5️⃣ CHECK BOOKING DETAILS (with Booking ID from step 4)
```bash
curl -X GET http://localhost:4000/api/bookings/1 \
  -H "Content-Type: application/json"
```
**Expected:** Booking status, seats, and expiry time

---

### 6️⃣ EXPIRE BOOKINGS (Admin/Maintenance)
```bash
curl -X POST http://localhost:4000/api/admin/bookings/expire \
  -H "Content-Type: application/json"
```
**Expected:** Number of bookings processed

---

## 📋 ENDPOINT REFERENCE

| Operation | Method | URL | Notes |
|-----------|--------|-----|-------|
| Create Show | POST | `http://localhost:4000/api/admin/shows` | Admin only |
| List Shows | GET | `http://localhost:4000/api/shows` | No auth needed |
| Show Details | GET | `http://localhost:4000/api/shows/{showId}` | See all seats |
| **Book Seats** | POST | `http://localhost:4000/api/shows/{showId}/book` | ⭐ Main feature |
| Booking Details | GET | `http://localhost:4000/api/bookings/{bookingId}` | Check status |
| Expire Bookings | POST | `http://localhost:4000/api/admin/bookings/expire` | Maintenance |

---

## 🧪 COMPLETE TEST SCENARIO

### Scenario: User Books 3 Seats

**Step 1:** Admin creates a show
```bash
curl -X POST http://localhost:4000/api/admin/shows \
  -H "Content-Type: application/json" \
  -d '{"name": "Beyoncé Concert", "startTime": "2025-12-25T20:00:00Z", "totalSeats": 100}'
```
Response: `"id": 1` ← Use this

**Step 2:** User checks available shows
```bash
curl -X GET http://localhost:4000/api/shows \
  -H "Content-Type: application/json"
```
Response: Shows list with seat counts

**Step 3:** User views specific show (ID=1)
```bash
curl -X GET http://localhost:4000/api/shows/1 \
  -H "Content-Type: application/json"
```
Response: All seats with statuses (AVAILABLE, BOOKED)

**Step 4:** User books 3 seats
```bash
curl -X POST http://localhost:4000/api/shows/1/book \
  -H "Content-Type: application/json" \
  -d '{"seatNumbers": ["A1", "A2", "A3"]}'
```
Response: `"id": 5` ← This is bookingId (expires in 2 mins)

**Step 5:** User confirms booking details (ID=5)
```bash
curl -X GET http://localhost:4000/api/bookings/5 \
  -H "Content-Type: application/json"
```
Response: Booking confirmed with seats and expiry time

---

## 🔍 TESTING DIFFERENT SCENARIOS

### Scenario A: Book Seats That Are Already Booked
```bash
# Try to book same seats again
curl -X POST http://localhost:4000/api/shows/1/book \
  -H "Content-Type: application/json" \
  -d '{"seatNumbers": ["A1", "A2"]}'
```
**Expected Error:** 409 Conflict - "Some seats are already booked"

---

### Scenario B: Book Seats That Don't Exist
```bash
curl -X POST http://localhost:4000/api/shows/1/book \
  -H "Content-Type: application/json" \
  -d '{"seatNumbers": ["Z99"]}'
```
**Expected Error:** 400 Bad Request - "Some seats do not exist"

---

### Scenario C: Book from Non-Existent Show
```bash
curl -X POST http://localhost:4000/api/shows/999/book \
  -H "Content-Type: application/json" \
  -d '{"seatNumbers": ["A1"]}'
```
**Expected Error:** 404 Not Found - "Show not found"

---

### Scenario D: Invalid Request (Empty Seats)
```bash
curl -X POST http://localhost:4000/api/shows/1/book \
  -H "Content-Type: application/json" \
  -d '{"seatNumbers": []}'
```
**Expected Error:** 400 Bad Request - "seatNumbers must be non-empty array"

---

## 🌐 TESTING WITH DIFFERENT TOOLS

### Using PowerShell (Windows)
```powershell
$body = @{
    name = "Test Show"
    startTime = "2025-12-20T18:00:00Z"
    totalSeats = 50
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4000/api/admin/shows" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### Using Python
```python
import requests
import json

url = "http://localhost:4000/api/admin/shows"
payload = {
    "name": "Test Show",
    "startTime": "2025-12-20T18:00:00Z",
    "totalSeats": 50
}

response = requests.post(url, json=payload)
print(response.json())
```

### Using Node.js/fetch
```javascript
const response = await fetch('http://localhost:4000/api/admin/shows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Show',
    startTime: '2025-12-20T18:00:00Z',
    totalSeats: 50
  })
});

const data = await response.json();
console.log(data);
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] Backend running on `http://localhost:4000`
- [ ] Can create a show (HTTP 201)
- [ ] Can list shows (HTTP 200)
- [ ] Can view show details (HTTP 200)
- [ ] Can book seats successfully (HTTP 201)
- [ ] Can get booking details (HTTP 200)
- [ ] Can view booked seats as unavailable
- [ ] Booking expiry works (automatic or via expire endpoint)

---

## 📊 POSTMAN COLLECTION

Already created! File: `MODEX_API_Collection.postman_collection.json`

### How to Import:
1. Open Postman
2. Click **Import** (top-left corner)
3. Upload: `MODEX_API_Collection.postman_collection.json`
4. All 6 endpoints are pre-configured with examples

---

## 🐛 DEBUGGING TIPS

### Backend not responding?
```bash
# Check if backend is running
curl http://localhost:4000/api/shows
```

### Database connection error?
- Check `.env` file in backend folder
- Verify PostgreSQL is running
- Check DATABASE_URL is correct

### CORS errors?
- Backend should handle with explicit headers
- Check backend logs for errors

---

## 📝 SEAT NAMING CONVENTION

Seats are auto-generated with this pattern:
- **A1, A2, A3, A4, A5, A6, A7, A8, A9, A10** (Row A - 10 seats)
- **B1, B2, B3, ...** (Row B - 10 seats)
- **C1, C2, C3, ...** (Row C - 10 seats)
- And so on...

Max 26 rows (A-Z) × 10 seats = 260 total seats supported

For 100 seats: Rows A-J (A1 to J10)

---

## ⏱️ BOOKING EXPIRY

- **Booking Duration:** 2 minutes
- **Expiry Check:** Runs every 30 seconds (automatic)
- **Manual Trigger:** Call `/admin/bookings/expire` endpoint
- **After Expiry:** Seats return to AVAILABLE status

---

## 🔒 CONCURRENCY SAFETY

The booking system is **race-condition proof**:
- Uses SERIALIZABLE transaction isolation
- Row-level locking (FOR UPDATE)
- Atomic operations
- **No overbooking possible** even with 1000+ concurrent requests

---

## 📞 SUPPORT

For detailed API documentation, see: `API_ENDPOINTS_REFERENCE.md`
For Postman collection: `MODEX_API_Collection.postman_collection.json`

---

**Version:** 1.0 | **Updated:** December 7, 2025 | **Status:** ✅ Production Ready
