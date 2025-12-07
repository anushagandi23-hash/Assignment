# Quick Start Guide - Modex Ticket Booking System

This guide will get you up and running in **5 minutes**.

## Prerequisites

- **Node.js** v16+ (download from https://nodejs.org)
- **PostgreSQL** 12+ (download from https://www.postgresql.org/download/)
- **Git** (optional, for cloning)

Verify installations:
```bash
node --version    # Should be v16 or higher
npm --version     # Should be v7 or higher
psql --version    # Should be 12 or higher
```

## Step 1: Setup Database (2 minutes)

### On Windows (PowerShell)
```powershell
# Open PostgreSQL command prompt or use psql
psql -U postgres

# Inside psql:
CREATE DATABASE modex_ticket;
\q
```

### On macOS/Linux
```bash
createdb modex_ticket
```

**Verify:**
```bash
psql modex_ticket -c "\dt"  # Should show empty tables (schema created on backend start)
```

## Step 2: Start Backend Server (1.5 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies (npm.cmd on Windows PowerShell)
npm install
# or
npm.cmd install

# Start the server
npm run dev
```

You should see:
```
✓ Database schema initialized successfully
🚀 Modex Ticket Booking System Backend running on http://localhost:4000
💚 Health Check: http://localhost:4000/health
```

**Test it works:**
```bash
# In another terminal:
curl http://localhost:4000/health
# Should return: {"status":"ok","message":"Modex Ticket Booking System - Backend"}
```

## Step 3: Start Frontend Server (1.5 minutes)

Open a **new terminal** and run:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install
# or
npm.cmd install

# Start the dev server
npm run dev
```

You should see:
```
VITE v5.0.0  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  press h to show help
```

## Step 4: Open Application

1. **Open browser**: http://localhost:3000
2. **Select a role**: User or Admin
3. **Try it out!**

## 🎯 Quick Test Flow

### As User:
1. Click "Continue as User"
2. Browse shows (or create one first as admin)
3. Click "Book Now" on a show
4. Select seats on the grid
5. Click "Confirm Booking"
6. See confirmation with booking ID

### As Admin:
1. Click "Continue as Admin"
2. Fill the "Create Show" form:
   - Name: "Bus: Mumbai to Delhi"
   - Date/Time: Pick any future time
   - Total Seats: 40
3. Click "+ Create Show"
4. See it appear in the "Active Shows" list
5. Switch to User role and book seats!

## 📡 Test with Postman

1. **Download Postman** (free): https://www.postman.com/downloads/
2. **Import Collection**:
   - Open Postman
   - Click "Import" button
   - Select `API_COLLECTION.postman.json` from this folder
3. **Run Requests**:
   - Try "Get All Shows" (GET /api/shows)
   - Try "Create Show" (POST /api/admin/shows)
   - Try "Book Seats" (POST /api/shows/1/book)

## ⚠️ Troubleshooting

### "Port 3000 already in use"
```powershell
# Windows PowerShell - Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Then retry:
npm run dev
```

### "Cannot find module 'postgres'" or "pg"
```bash
cd backend
npm install pg  # or npm.cmd install pg
npm run dev
```

### PostgreSQL connection refused
```bash
# Windows - Start PostgreSQL service
# Search "Services" in Windows, find "postgresql-x64-##"
# Right-click → Start

# macOS - Restart PostgreSQL
brew services restart postgresql

# Verify it's running:
psql postgres -c "SELECT 1"
```

### "npm: File ... npm.ps1 cannot be loaded"
```powershell
# Use npm.cmd instead of npm:
npm.cmd install
npm.cmd run dev

# Or set PowerShell execution policy:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
npm install
```

### API errors on frontend
1. Verify backend is running: http://localhost:4000/health
2. Check frontend `.env` file has correct URL:
   ```
   VITE_API_URL=http://localhost:4000/api
   ```
3. Check browser DevTools Console for CORS errors

## 🧪 Concurrency Test

Test that the system prevents race conditions:

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend
cd frontend && npm run dev

# Terminal 3: Create a show as admin, note the show ID

# Terminal 4: Run concurrent bookings
for i in {1..5}; do
  curl -X POST http://localhost:4000/api/shows/1/book \
    -H "Content-Type: application/json" \
    -d "{\"seatNumbers\": [\"A1\", \"A2\"]}" &
done
wait

# Expected: Only 1 booking succeeds, others get 409 Conflict error
```

## 📚 Next Steps

- Read `README.md` for complete project overview
- See `backend/README.md` for API documentation
- See `frontend/README.md` for frontend details
- Check `TECHNICAL_DESIGN.md` for system architecture

## 🚀 Common Commands

```bash
# Backend
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm install axios    # Install new package

# Frontend
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run linter

# Database
createdb modex_ticket                    # Create database
dropdb modex_ticket                      # Delete database
psql modex_ticket -c "\dt"              # List tables
psql modex_ticket -f backup.sql         # Restore backup
```

## 🔄 Default Credentials

**No login required!** Just select your role:
- **User**: Browse and book shows
- **Admin**: Create and manage shows

## 💡 Tips

1. **Use DevTools**: Open browser DevTools (F12) to:
   - Check Network tab for API calls
   - See Console for errors
   - Inspect React components (install React DevTools extension)

2. **Hot Reload**: Both frontend and backend support hot reload:
   - Edit code → Auto-refresh in browser/terminal

3. **Database Reset**: To start fresh:
   ```bash
   dropdb modex_ticket
   createdb modex_ticket
   npm run dev  # Backend will recreate schema
   ```

4. **Check Backend Health**: Any terminal:
   ```bash
   curl http://localhost:4000/health
   ```

## 📞 Stuck?

1. **Check logs** in the terminal where server is running
2. **Read error messages** carefully (they're helpful!)
3. **Refer to README files**:
   - General issues → Root `README.md`
   - Backend issues → `backend/README.md`
   - Frontend issues → `frontend/README.md`
4. **Check existing issues** in documentation

## ✅ Success Checklist

- [ ] PostgreSQL is running
- [ ] Backend started successfully at localhost:4000
- [ ] Frontend started successfully at localhost:3000
- [ ] Can open http://localhost:3000 in browser
- [ ] Can create a show as admin
- [ ] Can book seats as user
- [ ] Got booking confirmation with booking ID

**If all checked, you're good to go! 🎉**

---

**Need help?** See the README files in each folder for detailed documentation.
