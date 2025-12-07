# MODEX API - QUICK REFERENCE CARD

## 🌐 Base URL
```
http://localhost:4000/api
```

---

## 📊 6 ENDPOINTS AT A GLANCE

### 1. CREATE SHOW (Admin)
```
POST /admin/shows
{
  "name": "string",
  "startTime": "ISO-8601",
  "totalSeats": number
}
Response: 201 + Show ID
```

### 2. LIST SHOWS (User)
```
GET /shows
Response: 200 + Array of shows
```

### 3. SHOW DETAILS (User)
```
GET /shows/{showId}
Response: 200 + Show + All seats
```

### 4. BOOK SEATS ⭐ (User - CORE)
```
POST /shows/{showId}/book
{
  "seatNumbers": ["A1", "A2"]
}
Response: 201 + Booking ID
Features: SERIALIZABLE, FOR UPDATE, 2-min expiry
```

### 5. BOOKING DETAILS (User)
```
GET /bookings/{bookingId}
Response: 200 + Booking info
```

### 6. EXPIRE BOOKINGS (Admin)
```
POST /admin/bookings/expire
Response: 200 + Count processed
```

---

## 🚀 QUICK TEST

```bash
# 1. Create
curl -X POST http://localhost:4000/api/admin/shows \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","startTime":"2025-12-20T18:00:00Z","totalSeats":50}'

# 2. List
curl -X GET http://localhost:4000/api/shows \
  -H "Content-Type: application/json"

# 3. Details
curl -X GET http://localhost:4000/api/shows/1 \
  -H "Content-Type: application/json"

# 4. Book
curl -X POST http://localhost:4000/api/shows/1/book \
  -H "Content-Type: application/json" \
  -d '{"seatNumbers":["A1","A2"]}'

# 5. Check
curl -X GET http://localhost:4000/api/bookings/1 \
  -H "Content-Type: application/json"

# 6. Expire
curl -X POST http://localhost:4000/api/admin/bookings/expire \
  -H "Content-Type: application/json"
```

---

## 📋 PARAMETERS

| Endpoint | Required Params | Optional | Notes |
|----------|-----------------|----------|-------|
| POST /admin/shows | name, startTime, totalSeats | - | Auto-generates seats (A1-Z10) |
| GET /shows | - | - | Lists all shows |
| GET /shows/{id} | id (URL) | - | Returns all seats + status |
| POST /shows/{id}/book | seatNumbers (body) | id (URL) | Array of seat labels |
| GET /bookings/{id} | id (URL) | - | Booking status + seats |
| POST /admin/bookings/expire | - | - | No parameters needed |

---

## ✅ HTTP STATUS CODES

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | GET successful |
| 201 | Created | POST successful |
| 400 | Bad Request | Missing/invalid params |
| 404 | Not Found | Show/booking not found |
| 409 | Conflict | Seat already booked |
| 500 | Server Error | Database issue |

---

## 🔒 KEY FEATURES

✅ **Race-Condition Proof**
- SERIALIZABLE isolation
- Row-level locking (FOR UPDATE)
- Atomic transactions

✅ **Automatic Expiry**
- 2-minute booking window
- Auto-checked every 30 seconds
- Seats released automatically

✅ **Error Handling**
- Detailed error messages
- Clear conflict resolution
- Proper HTTP status codes

---

## 📱 SEAT NAMING

Auto-generated pattern:
- A1, A2, ..., A10 (Row A)
- B1, B2, ..., B10 (Row B)
- ... up to Z10 (Row Z)

Max: 26 rows × 10 = 260 seats

---

## 📥 POSTMAN IMPORT

1. Open Postman
2. Click **Import**
3. Upload: `MODEX_API_Collection.postman_collection.json`
4. All 6 endpoints ready to test!

---

## 📚 FILES CREATED

- `MODEX_API_Collection.postman_collection.json` - Postman import
- `API_ENDPOINTS_REFERENCE.md` - Full technical docs
- `API_QUICK_TESTING_GUIDE.md` - Copy-paste examples
- `POSTMAN_SETUP_GUIDE.md` - Complete setup guide
- `ENDPOINTS_QUICK_REFERENCE.md` - This file!

---

## 🧪 TEST EXAMPLE

```
1. POST /admin/shows → Show ID: 1
2. GET /shows → Shows array
3. GET /shows/1 → All seats
4. POST /shows/1/book → Booking ID: 1
5. GET /bookings/1 → Booking confirmed
6. POST /admin/bookings/expire → Seats released
```

---

**Version:** 1.0 | **Date:** Dec 7, 2025 | **Status:** ✅ Ready
