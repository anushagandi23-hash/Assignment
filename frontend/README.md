# Modex Ticket Booking System - Frontend

A modern, responsive React + TypeScript application for the Modex Ticket Booking System. Provides both user and admin interfaces for ticket booking and management.

## Features

✅ **Admin Features**
- Create new shows with configurable details (name, date/time, total seats)
- View all shows with real-time occupancy rates
- Monitor booking status and seat availability

✅ **User Features**
- Browse available shows with detailed information
- Interactive seat grid for visual selection
- Multi-seat booking support
- Real-time booking status and confirmation
- Responsive design for mobile and desktop

✅ **Technical Features**
- **React Context API** for state management (Authentication, Shows, Bookings)
- **TypeScript** for type safety and better developer experience
- **React Router** for SPA navigation
- **Axios** for efficient API communication
- **Responsive Design** with mobile-first approach
- **Error Handling** with user-friendly messages
- **Loading States** for better UX

## Tech Stack

- **Frontend Framework:** React 18.x
- **Language:** TypeScript 5.x
- **Build Tool:** Vite 5.x
- **State Management:** React Context API + Hooks
- **Routing:** React Router DOM 6.x
- **HTTP Client:** Axios
- **Styling:** CSS3 with custom components

## Setup Instructions

### 1. Prerequisites

- Node.js v16+ installed
- npm or yarn package manager
- Modex Backend running on `http://localhost:4000`

### 2. Install Dependencies

```bash
cd frontend
npm install
```

On Windows with PowerShell script restrictions, use:
```bash
npm.cmd install
```

### 3. Environment Configuration

The `.env` file is already configured to connect to the local backend:

```bash
VITE_API_URL=http://localhost:4000/api
```

To change the API endpoint, edit `.env`:
```bash
VITE_API_URL=https://api.production.com/api
```

### 4. Run the Development Server

```bash
npm run dev
```

The app will start on `http://localhost:3000` with HMR (Hot Module Replacement).

### 5. Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory, ready for deployment.

## Project Structure

```
frontend/
├── .env                          # Environment configuration
├── index.html                    # HTML entry point
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts               # Vite build configuration
└── src/
    ├── main.tsx                 # React entry point
    ├── App.tsx                  # Main app component with routing
    ├── App.css                  # Global styles
    ├── index.css                # CSS resets
    ├── api/
    │   └── client.ts            # Axios API client with all endpoints
    ├── context/
    │   ├── AuthContext.tsx       # Authentication state (user/admin)
    │   ├── ShowContext.tsx       # Shows list and details state
    │   └── BookingContext.tsx    # Booking state and seat selection
    ├── types/
    │   └── index.ts             # TypeScript interfaces and types
    ├── components/
    │   ├── Layout.tsx           # Main layout wrapper
    │   ├── Layout.css
    │   ├── ShowCard.tsx         # Show preview card
    │   ├── ShowCard.css
    │   ├── SeatGrid.tsx         # Interactive seat selection grid
    │   ├── SeatGrid.css
    │   ├── Alert.tsx            # Alert/notification component
    │   └── Alert.css
    └── pages/
        ├── HomePage.tsx         # Browse shows, role selection
        ├── HomePage.css
        ├── BookingPage.tsx       # Select seats and confirm booking
        ├── BookingPage.css
        ├── AdminPage.tsx         # Create shows, view statistics
        └── AdminPage.css
```

## API Integration

The frontend communicates with the backend via `/api` endpoints (see `src/api/client.ts`):

### Show Management

- `GET /shows` - Fetch all available shows
- `GET /shows/:id` - Fetch show details with seats
- `POST /admin/shows` - Create new show (admin only)

### Booking Management

- `POST /shows/:id/book` - Book seats
- `GET /bookings/:id` - Get booking details

## State Management

### 1. AuthContext
Manages user authentication and role (admin/user):
```tsx
const { isAuthenticated, userRole, login, logout } = useAuth();
```

### 2. ShowContext
Manages shows list and details:
```tsx
const { shows, selectedShow, loading, error, fetchShows, fetchShowById, createShow } = useShows();
```

### 3. BookingContext
Manages booking operations and seat selection:
```tsx
const { booking, selectedSeats, loading, error, bookSeats, selectSeat, deselectSeat } = useBooking();
```

## User Flows

### User Flow
1. **Home Page** - Select role (User/Admin)
2. **Browse Shows** - View all available shows
3. **Select Show** - Click "Book Now" to view seats
4. **Seat Selection** - Click seats to select/deselect
5. **Confirm Booking** - Click confirm to book
6. **Confirmation** - See booking ID and expiry time

### Admin Flow
1. **Home Page** - Select Admin role
2. **Admin Dashboard** - Filled with create show form and active shows list
3. **Create Show** - Fill form and submit
4. **View Statistics** - See occupancy rates for all shows

## Responsive Design

The application is fully responsive and optimized for:
- **Desktop** (1200px+): Multi-column layouts
- **Tablet** (768px - 1199px): 2-column layouts
- **Mobile** (< 768px): Single-column layouts with stacked components

## Error Handling

The application gracefully handles:
- API connection errors with user-friendly messages
- Form validation errors
- Booking conflicts (concurrent bookings for same seat)
- Network timeouts
- Invalid inputs

## Performance Optimizations

- **Code Splitting**: Routes are lazy-loaded
- **Memoization**: Components use React.memo where appropriate
- **API Caching**: Show data is fetched once and cached in Context
- **Efficient Rendering**: Hooks prevent unnecessary re-renders
- **CSS Optimization**: Modular CSS with minimal overrides

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Vercel auto-detects Vite configuration
4. Set `VITE_API_URL` environment variable in Vercel settings
5. Deploy!

### Deploy to Netlify

```bash
npm run build
# Drop dist/ folder to Netlify
```

### Deploy to Traditional Hosting

```bash
npm run build
# Upload dist/ folder to your web server
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Development Tips

### Adding a New Feature

1. Define TypeScript interface in `src/types/index.ts`
2. Add API method in `src/api/client.ts`
3. Create Context if needed in `src/context/`
4. Create Component in `src/components/` with CSS
5. Use component in appropriate page in `src/pages/`

### Debugging

Use React DevTools browser extension for:
- Inspecting component state and props
- Tracking context changes
- Performance profiling

### Testing API Calls

Use the browser DevTools Network tab to inspect:
- Request/response headers
- Payload data
- Latency and performance

## Common Issues

### CORS Errors
If you see CORS errors, ensure:
1. Backend is running on `http://localhost:4000`
2. Backend has `cors()` middleware enabled
3. `VITE_API_URL` in `.env` is correct

### "Cannot find module" Errors
Run `npm install` again to ensure all dependencies are installed.

### Slow Hot Module Replacement (HMR)
HMR should work automatically with Vite. If slow:
1. Close and reopen VS Code
2. Restart development server with `npm run dev`

### API Timeout
If bookings are slow:
1. Ensure PostgreSQL is running
2. Check backend logs for errors
3. Verify database connections

## Future Enhancements

- [ ] Implement WebSocket for real-time seat updates
- [ ] Add user login and authentication (JWT)
- [ ] Payment gateway integration
- [ ] Booking history and cancellations
- [ ] Email confirmations
- [ ] Multi-language support (i18n)
- [ ] Dark mode toggle
- [ ] Advanced search and filtering
- [ ] Booking analytics dashboard
- [ ] Accessibility improvements (WCAG 2.1)

## Contributing

For development:
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit PR with description

Code style:
- Use TypeScript for type safety
- Follow React hooks conventions
- Keep components small and reusable
- Write self-documenting code

## Troubleshooting

### Dependencies won't install
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install
```

### Port 3000 already in use
```bash
# Kill process on port 3000
# On Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Then restart:
npm run dev
```

### Backend API not responding
1. Verify backend is running: `http://localhost:4000/health`
2. Check `.env` has correct `VITE_API_URL`
3. Ensure no firewall blocking port 4000

## License

ISC

---

**Built with ❤️ for Modex Assessment**

For backend documentation, see `../backend/README.md`
For system design, see `../TECHNICAL_DESIGN.md`
