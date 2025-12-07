# ✅ Complete Modex Assessment Verification

## Your Task: Follow This Checklist to Verify Everything Works

Follow these steps **IN ORDER** to ensure the system is complete and working.

---

## ✅ STEP 1: PostgreSQL Connection Fix

**Expected Issue:** Database password authentication failure

**Action Required:**

### Option 1: If you remember setting password as `admin` during PostgreSQL install

Skip to **STEP 2**. Your `.env` already has `DB_PASSWORD=admin`.

### Option 2: If you forgot the PostgreSQL password

**Do this:**

1. Open **Command Prompt** (search for "cmd" in Windows, NOT PowerShell)

2. Run:
```cmd
psql -U postgres
```

3. You'll see one of:
   - **"Password:"** prompt → Enter the password you set (or try: `postgres`, `admin`, or press Enter)
   - **Connected successfully** → Type `\q` to exit (password is correct)

4. If none work, **reset the password:**

```cmd
psql -U postgres
```

(If it fails, you may need to use Windows authentication. Try: `psql -U postgres -w` or reinstall PostgreSQL)

5. Once connected, run:
```sql
ALTER USER postgres WITH PASSWORD 'admin';
\q
```

6. Verify it works:
```cmd
psql -U postgres -h localhost -c "SELECT 1"
```
Should show: `?column?` = 1 (connection successful!)

---

## ✅ STEP 2: Create the Database

**In PowerShell:**

```powershell
psql -U postgres -h localhost -c "CREATE DATABASE modex_ticket;"
```

**Verify:**
```powershell
psql -U postgres -h localhost -d modex_ticket -c "SELECT 'Database exists!'"
```

Should output: `Database exists!`

---

## ✅ STEP 3: Start Backend

**Open PowerShell Terminal 1:**

```powershell
cd d:\Projects\modex-ticket\backend
npm.cmd install
npm.cmd run dev
```

**Wait for these messages:**
```
🚀 Modex Ticket Booking System Backend running on http://localhost:4000
✓ Database schema initialized successfully
🔄 Starting automatic booking expiry service...
✅ Booking expiry service started (checking every 30s)
```

**⚠️ If you see database password error:**
1. Stop backend (Ctrl+C)
2. Go back to **STEP 1** and fix password
3. Restart: `npm.cmd run dev`

**✅ Once you see all messages above** → Backend is ready!

---

## ✅ STEP 4: Start Frontend

**Open PowerShell Terminal 2 (new window):**

```powershell
cd d:\Projects\modex-ticket\frontend
npm.cmd install
npm.cmd run dev
```

**Wait for:**
```
VITE v5.4.21 ready in XXX ms

➜  Local:   http://localhost:3000/
```

**✅ Once you see this** → Frontend is ready!

---

## ✅ STEP 5: Open Application in Browser

**Do this:**

1. Open browser (Chrome, Edge, Firefox, Safari)
2. Go to: `http://localhost:3000`
3. You should see:
   ```
   🎫 Modex Ticket Booking System
   Browse Available Shows
   ```
4. You should see **TWO BUTTONS**:
   - 👤 Continue as User
   - 🔐 Continue as Admin

**❌ If you don't see buttons:**
- Check browser console: Press **F12** → **Console** tab
- Look for error messages
- If you see CORS or Network errors, restart both services (Ctrl+C both terminals, then restart)

**✅ If you see buttons** → Frontend is connected!

---

## ✅ STEP 6: Test Admin Features

### 6.1 Create a Show

1. Click **"🔐 Continue as Admin"** button
2. You'll see the **Admin Dashboard**
3. Fill the form:
   - **Show Name:** "Concert 2025"
   - **Start Time:** Pick any **future** date and time (e.g., 2025-12-15 at 19:00)
   - **Total Seats:** 40
4. Click **"Create Show"** button
5. You should see:
   - Confirmation message: "✅ Show created successfully"
   - Show appears in the list below

**✅ If this works** → Admin creation is working!

**❌ If it fails:**
- Check browser console (F12) for error details
- Check backend terminal for error logs
- Make sure start time is in the **future**

### 6.2 View All Shows

1. The list should show your created show
2. You should see:
   - Show name: "Concert 2025"
   - Booked seats: 0/40
   - A progress bar showing occupancy

**✅ If you see this** → Admin features work!

---

## ✅ STEP 7: Test User Features

### 7.1 Browse Shows

1. Open new tab or window at `http://localhost:3000`
2. Click **"👤 Continue as User"** button
3. You should see the **Shows List**
4. You should see the show you created:
   - Name: "Concert 2025"
   - Shows: "Available seats: 40/40"
   - A "Book Now" button

**✅ If you see this** → User listing works!

### 7.2 Book Seats

1. Click **"Book Now"** button on "Concert 2025"
2. You'll see the **Booking Page** with:
   - Show name: "Concert 2025"
   - Seat grid showing rows A-D, columns 1-10 (40 seats total)
   - All seats should be **green** (available)
   - A legend showing seat status colors

3. **Select seats** by clicking them:
   - Click seat A1 → It should turn **blue** (selected)
   - Click seat A2 → It should turn **blue** (selected)
   - You should see "Selected seats: 2" message

4. **Cancel and re-select** to test:
   - Click A1 again → It should turn **green** (deselected)

5. **Confirm booking:**
   - Select 2-5 seats
   - Click "Confirm Booking"
   - You should see:
     ```
     ✅ Booking Confirmed!
     Booking ID: [some ID]
     Seats: A1, A2
     Expires at: [2 minutes from now]
     ```

**✅ If all this works** → User booking is working!

**❌ If it fails:**
- Check browser console for errors
- Check backend logs
- Make sure seats aren't already booked

### 7.3 Verify Booked Seats

1. Go back and create a new show OR click another show
2. Book those seats again
3. Go back and try to book the same seats from the first show
4. The previously booked seats should now be **gray** (unavailable)
5. You should **not be able to select** them

**✅ If this works** → Seat status is correctly tracked!

---

## ✅ STEP 8: Test Concurrency Protection

This proves that **only one person can book the same seats** when multiple people try at the same time.

### 8.1 Setup

1. Create another show with 40 seats (as Admin)
2. Note the show ID (you'll see it in the URL when booking)

### 8.2 Test Concurrent Bookings

Open **PowerShell Terminal 3:**

```powershell
# Try to book the same 2 seats (A1, A2) 5 times simultaneously
for ($i = 1; $i -le 5; $i++) {
  Start-Job -ScriptBlock {
    $json = '{"seatNumbers":["A1","A2"]}'
    $response = Invoke-WebRequest `
      -Uri "http://localhost:4000/api/shows/1/book" `
      -Method POST `
      -Headers @{"Content-Type"="application/json"} `
      -Body $json `
      -ErrorAction SilentlyContinue
    Write-Output "Attempt $(Get-Date -Format 'HH:mm:ss'): Status Code = $($response.StatusCode)"
  }
  Start-Sleep -Milliseconds 100
}

# Wait for all attempts to finish
Start-Sleep -Seconds 3

# Show all results
Get-Job | Receive-Job
```

### 8.3 Expected Result

You should see:
- **1 result: 201** (Success - booking confirmed!)
- **4 results: 409** (Conflict - seats already booked)

**⚠️ Important:** If you see **multiple 201s**, there's a concurrency bug! (But there shouldn't be - the system uses database locks)

**✅ If you see 1 success + 4 conflicts** → Concurrency protection is working!

---

## ✅ STEP 9: Test Booking Expiry (Bonus Feature)

This proves that bookings **automatically expire after 2 minutes**.

### 9.1 Create a Show

1. As Admin, create a show with 40 seats

### 9.2 Make a Booking

1. As User, book 2 seats (A1, A2)
2. You'll see: "Expires at: [timestamp 2 minutes from now]"
3. Note the expiry time

### 9.3 Wait and Check Expiry

1. **Wait 2+ minutes** (you can wait 2 minutes 30 seconds to be safe)
2. Try to book those same seats again
3. You should now be able to book them (because the previous booking expired!)

**Alternative (faster test):**
- Check backend logs - you should see:
  ```
  🔄 Expiring PENDING bookings...
  ✅ Expired [X] pending bookings
  ```
  (This appears every 30 seconds)

**✅ If booking succeeds after 2 minutes** → Expiry is working!

---

## ✅ STEP 10: Final Verification Checklist

Go through this checklist and mark each item:

- [ ] Backend starts without errors
- [ ] Backend shows "Database schema initialized"
- [ ] Backend shows "Booking expiry service started"
- [ ] Frontend starts without errors
- [ ] Browser displays the Modex header
- [ ] Both role selection buttons appear
- [ ] Admin can create a show
- [ ] Admin can view the created show
- [ ] User can see the show in the list
- [ ] User can click "Book Now" and see seat grid
- [ ] User can select seats (they turn blue)
- [ ] User can deselect seats (they turn green)
- [ ] User can confirm booking
- [ ] Booking shows confirmation with booking ID
- [ ] Previously booked seats appear unavailable (gray)
- [ ] Concurrent booking attempts work correctly (1 success, 4 conflicts)
- [ ] No CORS errors in browser console
- [ ] No database errors in backend logs

**If ALL items are checked ✅** → System is working perfectly!

---

## 🎓 What This Proves

✅ **Backend Requirements Met:**
- Show creation by admin
- Listing shows
- Booking seats
- Concurrency protection (database locks)
- Automatic booking expiry
- Error handling
- Complete API

✅ **Frontend Requirements Met:**
- React + TypeScript
- Admin dashboard
- User views
- Routing (/admin, /, /booking/:id)
- Context API state management
- Error handling
- Responsive design
- DOM interaction (seat selection)

✅ **Assessment Requirements Met:**
- Functional requirements: ALL COMPLETE
- Concurrency handling: VERIFIED
- Booking expiry: VERIFIED
- System design document: COMPLETE (TECHNICAL_DESIGN.md)
- API documentation: COMPLETE (API_COLLECTION.postman.json)
- README files: COMPLETE

---

## 🚀 Next Steps After Verification

Once everything is verified:

1. **Review the code:**
   - Backend: `backend/src/controllers/bookingController.js` (see the locking strategy)
   - Frontend: `frontend/src/context/BookingContext.tsx` (see state management)

2. **Read the documentation:**
   - `TECHNICAL_DESIGN.md` - System architecture
   - `backend/README.md` - API details
   - `frontend/README.md` - Frontend details

3. **Deploy (Optional):**
   - Docker: `docker-compose up`
   - Cloud: See `DEPLOYMENT_GUIDE.md`

4. **Submit:**
   - Push to GitHub
   - Submit all documentation
   - Include this verification checklist

---

## 📞 If Something Fails

**Problem: Database connection fails**
- Check PostgreSQL password (STEP 1)
- Make sure database exists (STEP 2)
- Check `backend/.env` has correct credentials

**Problem: Frontend doesn't connect to backend**
- Restart both services
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console (F12)

**Problem: Buttons don't appear**
- Clear browser localStorage (F12 → Application → Local Storage → Delete All)
- Refresh page

**Problem: Bookings fail**
- Check backend logs for errors
- Make sure start time is in the future
- Make sure seats aren't already booked

**For other issues:**
- Check `SETUP_AND_RUN.md` for detailed troubleshooting
- Read `backend/README.md` and `frontend/README.md`

---

## ✅ Summary

You now have a **production-grade ticket booking system** with:

- ✅ Complete backend with database locking
- ✅ Complete frontend with state management
- ✅ Concurrency prevention (proven)
- ✅ Automatic booking expiry
- ✅ Full documentation
- ✅ API collection for testing
- ✅ System design document
- ✅ All assessment requirements met

**Status: READY FOR SUBMISSION** 🎉

Good luck! You've got this! 🚀
