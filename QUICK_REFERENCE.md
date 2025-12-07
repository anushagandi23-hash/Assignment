# ⚡ Quick Reference Card - Modex Ticket Booking System

## 🚀 Start the System (Copy & Paste)

### Terminal 1 - Backend
```powershell
cd d:\Projects\modex-ticket\backend
npm.cmd install
npm.cmd run dev
```

### Terminal 2 - Frontend
```powershell
cd d:\Projects\modex-ticket\frontend
npm.cmd install
npm.cmd run dev
```

### Browser
```
http://localhost:3000
```

---

## 🎯 What You Should See

```
🎫 Modex Ticket Booking System

Browse Available Shows

[👤 Continue as User] [🔐 Continue as Admin]
```

**If you don't see these buttons:**
1. F12 → Look for errors in Console
2. Ctrl+Shift+R (hard refresh)
3. Restart both services if still broken

---

## ✅ Quick Test Flow

### Admin (Create a Show)
```
1. Click "🔐 Continue as Admin"
2. Fill form:
   - Name: "Concert 2025"
   - Time: Pick future date
   - Seats: 40
3. Click "Create Show"
4. See "✅ Show created successfully"
```

### User (Book Seats)
```
1. Click "👤 Continue as User"
2. See "Concert 2025" in list
3. Click "Book Now"
4. Click seats A1, B2 (they turn blue)
5. Click "Confirm Booking"
6. See "✅ Booking Confirmed!" with ID
```

### Verify Concurrency
```powershell
# Run 5 concurrent bookings
for ($i = 1; $i -le 5; $i++) {
  Start-Job -ScriptBlock {
    $json = '{"seatNumbers":["A1","A2"]}'
    Invoke-WebRequest -Uri "http://localhost:4000/api/shows/1/book" `
      -Method POST -Headers @{"Content-Type"="application/json"} -Body $json
  }
}
# Expected: 1 success, 4 conflicts ✅
```

---

## 🔧 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| **Database password error** | Check `backend/.env` has correct password |
| **Port 4000/3000 in use** | `taskkill /F /IM node.exe` then restart |
| **CORS errors** | Restart backend, hard refresh browser |
| **Buttons don't show** | F12 → Application → Local Storage → Delete All |
| **Backend won't start** | Verify PostgreSQL is running |

---

## 📊 API Endpoints

```bash
# List shows
curl http://localhost:4000/api/shows

# Create show (Admin)
curl -X POST http://localhost:4000/api/admin/shows \
  -H "Content-Type: application/json" \
  -d '{"name":"Concert","startTime":"2025-12-20T19:00","totalSeats":40}'

# Book seats
curl -X POST http://localhost:4000/api/shows/1/book \
  -H "Content-Type: application/json" \
  -d '{"seatNumbers":["A1","A2"]}'

# Health check
curl http://localhost:4000/health
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend/src/controllers/bookingController.js` | Concurrency logic (database locking) |
| `backend/src/services/bookingExpiryService.js` | Automatic expiry service |
| `frontend/src/context/BookingContext.tsx` | Booking state management |
| `backend/src/db.js` | Database schema & connection |
| `.env` | Environment configuration |

---

## ✅ All Requirements Met

✅ Backend: Node.js, Express, PostgreSQL  
✅ Admin: Create shows  
✅ User: Browse & book seats  
✅ Concurrency: Database locking prevents overbooking  
✅ Booking expiry: Automatic 2-minute expiry  
✅ Frontend: React + TypeScript  
✅ Routing: /, /admin, /booking/:id  
✅ State management: Context API  
✅ Error handling: Complete  
✅ Documentation: Complete  
✅ API docs: Postman collection included  
✅ System design: TECHNICAL_DESIGN.md  

---

## 📚 Full Documentation

- **Setup**: [SETUP_AND_RUN.md](./SETUP_AND_RUN.md)
- **Verify**: [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)
- **Architecture**: [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md)
- **Deploy**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **API**: [API_COLLECTION.postman.json](./API_COLLECTION.postman.json)

---

## 🎓 Key Concepts

### Concurrency Control
```
Problem: Race condition when 5 people book same seat
Solution: Database row-level locks (FOR UPDATE) + SERIALIZABLE transactions
Result: Only 1 succeeds, 4 get "seat already booked" error ✅
```

### Booking Expiry
```
Problem: PENDING bookings might stay forever
Solution: Background service runs every 30 seconds, auto-expires after 2 minutes
Result: Seats automatically released, no manual intervention ✅
```

### State Management
```
AuthContext: login/logout, user role
ShowContext: list shows, create show
BookingContext: select seats, confirm booking
Result: Single source of truth ✅
```

---

## ⚡ Performance

- Single server: 1,000+ concurrent users
- Production: Scale to 1M+ (see TECHNICAL_DESIGN.md)
- Database: Optimized with indexes
- Frontend: Efficient React renders

---

## 🚢 Deploy Locally

```bash
# One-command start (if docker is installed)
docker-compose up
# Open: http://localhost:3000
```

---

## 📞 Need Help?

1. **Setup issues?** → SETUP_AND_RUN.md
2. **Want to verify?** → VERIFICATION_CHECKLIST.md
3. **Want to understand?** → TECHNICAL_DESIGN.md
4. **Want to deploy?** → DEPLOYMENT_GUIDE.md
5. **Want API docs?** → API_COLLECTION.postman.json

---

**You got this! 🚀** Start with Terminal 1 & 2 above, then open browser to http://localhost:3000
