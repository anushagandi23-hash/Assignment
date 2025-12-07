# 🚀 Complete Setup and Run Guide - Modex Ticket Booking System

## Prerequisites Check

Verify you have installed:

```powershell
# Check Node.js
node --version   # Should be v16+
npm --version    # Should be v7+

# Check PostgreSQL
psql --version   # Should be v12+
```

---

## Step 1: PostgreSQL Setup (CRITICAL)

### Option A: Use `admin` as Password (Recommended if you used it during PostgreSQL install)

If you set `admin` as the PostgreSQL password during installation, skip to Step 2.

### Option B: Reset PostgreSQL Password to `admin`

If you don't remember the password or it's different:

**Open Command Prompt (NOT PowerShell):**

```cmd
psql -U postgres
```

**Inside psql shell, type:**

```sql
ALTER USER postgres WITH PASSWORD 'admin';
\q
```

**Verify it works:**

```cmd
psql -U postgres -h localhost -d postgres
# When asked for password, type: admin
# Should connect successfully
```

### Option C: Use Different Password

If you want to use a different password (e.g., `mypassword123`):

1. **Reset PostgreSQL password:**
```cmd
psql -U postgres
ALTER USER postgres WITH PASSWORD 'mypassword123';
\q
```

2. **Update `backend/.env`:**
```
DB_PASSWORD=mypassword123
```

---

## Step 2: Create Database

**In PowerShell or Command Prompt:**

```powershell
psql -U postgres -h localhost -c "CREATE DATABASE modex_ticket;"
```

**Or if you prefer using SQL:**

```powershell
psql -U postgres
```

Then in psql:

```sql
CREATE DATABASE modex_ticket;
\q
```

**Verify:**

```powershell
psql -U postgres -d modex_ticket -c "\dt"
# Should show: Did not find any relations (schema will be created by backend)
```

---

## Step 3: Start Backend

**Open Terminal 1 (PowerShell):**

```powershell
cd d:\Projects\modex-ticket\backend

# Install dependencies
npm.cmd install

# Start development server
npm.cmd run dev
```

**Wait for this message:**

```
🚀 Modex Ticket Booking System Backend running on http://localhost:4000
✓ Database schema initialized successfully
🔄 Starting automatic booking expiry service...
✅ Booking expiry service started (checking every 30s)
```

**If you see database connection errors:**

1. Stop the backend (Ctrl+C)
2. Check your PostgreSQL password
3. Update `backend/.env` with correct password
4. Restart: `npm.cmd run dev`

---

## Step 4: Start Frontend

**Open Terminal 2 (PowerShell):**

```powershell
cd d:\Projects\modex-ticket\frontend

# Install dependencies
npm.cmd install

# Start development server
npm.cmd run dev
```

**Wait for this message:**

```
VITE v5.0.0 ready in XXX ms

➜  Local:   http://localhost:3000/
```

---

## Step 5: Open Application

1. **Open browser** and go to: `http://localhost:3000`
2. You should see the Modex Ticket Booking System header
3. You should see **two buttons**:
   - 👤 Continue as User
   - 🔐 Continue as Admin

If buttons don't appear, see **Troubleshooting** below.

---

## 🎯 Quick Test Flow

### As Admin:

1. Click "🔐 Continue as Admin"
2. You'll see the Admin Dashboard
3. Fill in the form:
   - **Show Name**: "Concert 2025"
   - **Start Time**: Pick any future date/time
   - **Total Seats**: 40
4. Click "Create Show" button
5. You should see confirmation and the show appears below

### As User:

1. Click "👤 Continue as User"
2. You'll see list of shows
3. Click "Book Now" on any show
4. Select seats from the grid (click A1, B2, etc.)
5. Click "Confirm Booking"
6. You should see: "✅ Booking Confirmed!"

---

## 🧪 Testing Concurrency (Proves Race Condition Prevention)

This tests that **only one booking succeeds** when 5 people try to book the same seats simultaneously.

**In a new PowerShell terminal:**

```powershell
# First, note a show ID (check the URL when booking, or see in browser network tab)
# Example: /api/shows/1

# Run 5 concurrent booking attempts
$showId = 1
$seats = @("A1", "A2")

for ($i = 1; $i -le 5; $i++) {
  Start-Job -ScriptBlock {
    $body = @{ seatNumbers = @("A1", "A2") } | ConvertTo-Json
    Invoke-WebRequest -Uri "http://localhost:4000/api/shows/1/book" `
      -Method POST `
      -Headers @{"Content-Type"="application/json"} `
      -Body $body
  }
}

# Wait for all jobs to complete
Get-Job | Wait-Job

# See the results
Get-Job | ForEach-Object { Receive-Job $_ }
```

**Expected Result:**
- ✅ One booking succeeds with status 201 (CONFIRMED)
- ❌ Four bookings fail with status 409 (CONFLICT - seats already booked)
- ✅ **NO OVERBOOKING** - Only 2 seats booked, not 10!

---

## 🔧 Troubleshooting

### Problem 1: "Cannot connect to database"

**Solution:**
1. Verify PostgreSQL is running:
   ```powershell
   psql -U postgres -h localhost -c "SELECT 1"
   ```
2. If it asks for password and fails, reset the password (see Step 1 Option B)
3. Check `backend/.env` has correct password
4. Restart backend: `npm.cmd run dev`

### Problem 2: "No shows available" but no buttons to create show

**Solution:**
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for any error messages
4. If you see "Network Error" or CORS errors:
   - Kill backend: Ctrl+C
   - Restart backend: `npm.cmd run dev`
   - Hard refresh browser: **Ctrl+Shift+R**

### Problem 3: Buttons don't appear at all

**Solution:**
1. Clear browser localStorage:
   - Press F12 → Application → Local Storage
   - Delete all entries
   - Refresh page
2. Check browser console for errors (F12 → Console)
3. Verify backend is responding:
   ```powershell
   curl http://localhost:4000/health
   ```

### Problem 4: "Cannot GET /" error from backend

**Solution:**
- This means backend is running but frontend is trying to access `/` directly
- Backend only has `/api/*` routes
- Frontend should be running on port 3000, not 4000
- Verify you're opening `http://localhost:3000` (not 4000)

### Problem 5: Frontend shows all errors

**Solution:**
1. Check backend is running on port 4000
2. Check frontend `frontend/.env` has:
   ```
   VITE_API_URL=http://localhost:4000/api
   ```
3. Restart both services:
   - Stop both terminals (Ctrl+C)
   - Kill all node processes: `taskkill /F /IM node.exe`
   - Start backend first, wait for "Database schema initialized"
   - Start frontend second
   - Open browser: `http://localhost:3000`

---

## ✅ Verification Checklist

After setup, verify each item:

- [ ] PostgreSQL is running and password is correct
- [ ] Database `modex_ticket` exists
- [ ] Backend starts without errors
- [ ] Backend shows "Database schema initialized"
- [ ] Backend shows "Booking expiry service started"
- [ ] Frontend starts without errors
- [ ] Browser opens `http://localhost:3000`
- [ ] You see the Modex header
- [ ] You see two role selection buttons
- [ ] Admin can create a show
- [ ] User can see the created show
- [ ] User can book seats
- [ ] Booking shows confirmation with booking ID
- [ ] No CORS errors in browser console
- [ ] No database errors in backend console

---

## 📊 System Architecture

```
Frontend (React + TypeScript)        Backend (Node.js + Express)         Database (PostgreSQL)
├─ Home Page                         ├─ /api/shows (GET)                ├─ shows table
├─ Admin Dashboard                   ├─ /api/admin/shows (POST)         ├─ seats table
├─ Booking Page                      ├─ /api/shows/:id/book (POST)      ├─ bookings table
└─ State Management                  ├─ /api/bookings/:id (GET)         └─ booking_seats table
    ├─ AuthContext                   ├─ Concurrency Control
    ├─ ShowContext                   │  ├─ SERIALIZABLE transactions
    └─ BookingContext                │  └─ Row-level locks (FOR UPDATE)
                                      ├─ Background Services
                                      │  └─ Booking Expiry (every 30s)
                                      └─ Error Handling
```

---

## 🚀 Production Deployment

Once everything works locally, you can deploy:

**Option 1: Docker**
```powershell
docker-compose up
```

**Option 2: Cloud Platforms**
- See `DEPLOYMENT_GUIDE.md` for Heroku, Railway, AWS, GCP options

**Option 3: Traditional Server**
- See `DEPLOYMENT_GUIDE.md` for traditional VPS setup

---

## 📝 API Documentation

Full API documentation available in:
- `API_COLLECTION.postman.json` - Import into Postman
- `backend/README.md` - Detailed API docs

---

## 🎓 Key Concepts Verified

✅ **Concurrency Handling**
- Database transactions with SERIALIZABLE isolation
- Row-level locking prevents race conditions
- No overbooking possible

✅ **Booking Expiry**
- Automatic background service (runs every 30 seconds)
- PENDING bookings auto-expire after 2 minutes
- Seats released back to AVAILABLE

✅ **Frontend State Management**
- Context API for Auth, Shows, Bookings
- TypeScript for type safety
- Efficient API calls (no unnecessary re-fetching)

✅ **Error Handling**
- API errors caught and displayed to user
- Form validation on both client and server
- Loading and empty states

✅ **Responsive Design**
- Works on mobile, tablet, desktop
- Clean UI with Flexbox layout
- Touch-friendly buttons and interactions

---

## 🎯 Next Steps

1. **Follow the setup above step-by-step**
2. **Test each feature** using the Quick Test Flow
3. **Run the concurrency test** to verify race condition prevention
4. **Review the code**:
   - Backend: `backend/src/controllers/bookingController.js` (concurrency logic)
   - Frontend: `frontend/src/context/BookingContext.tsx` (state management)
5. **Read documentation**:
   - `TECHNICAL_DESIGN.md` - System architecture
   - `backend/README.md` - Backend details
   - `frontend/README.md` - Frontend details

---

## 💡 Tips

**Tip 1:** Always kill all node processes before starting fresh
```powershell
taskkill /F /IM node.exe
```

**Tip 2:** If frontend doesn't connect to backend, do a hard refresh
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

**Tip 3:** Check backend logs for debugging - errors appear there first

**Tip 4:** Use browser DevTools (F12) to inspect network requests and console errors

---

## 📞 Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Read the `backend/README.md` for backend issues
3. Read the `frontend/README.md` for frontend issues
4. Check terminal output for error messages
5. Open browser console (F12) for frontend errors

---

**Status: Ready to Run! 🚀**

Follow the steps above and your Modex Ticket Booking System will be running perfectly.

Good luck! 🎉
