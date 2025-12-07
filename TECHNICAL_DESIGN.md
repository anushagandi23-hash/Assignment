# Technical Design Document: Scaling Modex Ticket Booking System

## Executive Summary

This document outlines the architecture and strategies to scale the Modex Ticket Booking System from a MVP (50-100 concurrent users) to a production-grade system capable of handling millions of concurrent users, similar to RedBus or BookMyShow.

---

## 1. High-Level System Architecture

### Current Architecture (MVP)
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────────────┐
│  Express.js Server  │
│  (Single Instance)  │
└──────┬──────────────┘
       │
       ▼
┌──────────────────┐
│  PostgreSQL DB   │
│  (Single Node)   │
└──────────────────┘
```

### Production Architecture (Target)
```
┌─────────────────────────────────────────────────────────────────┐
│                        Clients (Web/Mobile)                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
         ┌─────────────────────────────────┐
         │    CDN / CloudFlare             │
         │  (Static assets, caching)       │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │    Load Balancer (L7)           │
         │    (nginx / AWS ALB)            │
         └────────────┬────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
    ┌────────┐   ┌────────┐   ┌────────┐
    │Express │   │Express │   │Express │
    │Server 1│   │Server 2│   │Server N│
    │(Cont.) │   │(Cont.) │   │(Cont.) │
    └────────┘   └────────┘   └────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
    ┌─────────────┐         ┌──────────────┐
    │ Redis Cache │         │ Message Queue│
    │ (Sessions)  │         │(RabbitMQ/Ka) │
    └─────────────┘         └──────────────┘
         │                         │
         └────────────┬────────────┘
                      │
        ┌─────────────┴──────────────────┐
        │                                │
        ▼                                ▼
   ┌──────────────┐          ┌──────────────────┐
   │ PostgreSQL   │          │ Background Jobs  │
   │ (Sharded)    │          │ (Booking expiry) │
   └──────────────┘          └──────────────────┘
        │
        ├─ Shard 1
        ├─ Shard 2
        └─ Shard N
```

---

## 2. Database Design & Scaling

### 2.1 Current Schema (Non-Sharded)

The current PostgreSQL schema is optimized for transactional consistency:

```sql
-- Shows: Relatively small table (grows linearly with trips)
-- Growth: ~1000 rows/day = 365K rows/year = manageable

-- Seats: Grows with show count × average seats
-- Growth: 1000 shows × 50 seats = 50K rows/day = 18M rows/year

-- Bookings: Highest growth (peak traffic)
-- Growth: 100K bookings/day = 36.5M rows/year

-- booking_seats: 2-5 records per booking
-- Growth: 200K-500K rows/day = 73M-182M rows/year
```

### 2.2 Sharding Strategy

**Problem:** Single PostgreSQL instance becomes bottleneck

**Solution:** Horizontal sharding by `show_id`

#### Sharding Key: `show_id`
- **Rationale:** 
  - Most queries filter by show_id (booking, seat lookup)
  - Users typically book for one show at a time
  - Reduces cross-shard queries
  - Natural business unit (each show is independent)

#### Shard Distribution
```
Shard 1: show_id % 3 == 0  →  Database A
Shard 2: show_id % 3 == 1  →  Database B
Shard 3: show_id % 3 == 2  →  Database C
```

#### Implementation
```javascript
// Connection router
function getShard(showId) {
  const shardId = showId % SHARD_COUNT;
  return shardConnections[shardId];
}

// Usage in controller
const shard = getShard(req.params.showId);
await shard.query(`SELECT * FROM seats WHERE show_id = $1`, [showId]);
```

#### Challenges
1. **Cross-shard queries:** List all shows (requires query all shards, fan-out)
   - **Solution:** Use a metadata DB (non-sharded) for show list, booking details
   
2. **User booking history:** User may book shows on different shards
   - **Solution:** Keep user bookings in a separate unsharded database or aggregate via cache

3. **Rebalancing:** Adding new shards requires data migration
   - **Solution:** Consistent hashing or gradual migration with dual-write

### 2.3 Replication & High Availability

**Single-point failures:** Replicate across regions

```
Primary (Region A)  →  Standby (Region A)  →  Replica (Region B)
     (Write)              (Async failover)        (Read-only)
```

**Configuration:**
- Primary: All reads + writes
- Synchronous Standby: Same-region replica, ensures durability
- Async Replica: Different region for disaster recovery & read scaling

**Connection pooling:** Use PgBouncer or pgpool-II
```
App servers → PgBouncer → PostgreSQL Instances
(Connection pooling, failover management)
```

### 2.4 Indexes for Performance

```sql
-- Already created, maintain these:
CREATE INDEX idx_seats_show_id ON seats(show_id);
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_bookings_show_id ON bookings(show_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_expires_at ON bookings(expires_at);

-- Additional indexes for scaling:
CREATE INDEX idx_seats_show_status ON seats(show_id, status);
CREATE INDEX idx_booking_seats_booking_id ON booking_seats(booking_id);
CREATE INDEX idx_booking_seats_seat_id ON booking_seats(seat_id);
```

---

## 3. Concurrency Control Mechanisms

### 3.1 Current Approach (Transaction Locking)

**How it works:**
```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;
  SELECT * FROM seats WHERE show_id = $1 FOR UPDATE;
  -- Exclusive lock held until COMMIT
COMMIT;
```

**Advantages:**
- ✅ Simple, ACID-compliant
- ✅ No race conditions
- ✅ Works within single shard

**Limitations:**
- ❌ Locks block other transactions (throughput limited)
- ❌ Timeout risk under high contention
- ❌ Not suitable for ultra-high concurrency (1M+ reqs/sec)

### 3.2 Optimistic Locking (Scaling Alternative)

**Concept:** Use version numbers instead of locks

```sql
-- Add version column
ALTER TABLE seats ADD COLUMN version INT DEFAULT 1;

-- Booking logic:
BEGIN;
  SELECT version FROM seats WHERE id = $1;
  -- Check availability, calculate changes...
  UPDATE seats SET status='BOOKED', version = version + 1
  WHERE id = $1 AND version = $2;
  IF (UPDATE affected rows == 0) THEN ROLLBACK;
    ELSE COMMIT;
COMMIT;
```

**Advantages:**
- ✅ No blocking, higher concurrency
- ✅ Better latency under load
- ✅ Scales to higher throughput

**Trade-offs:**
- ❌ Clients must retry on conflicts
- ❌ Slightly higher failure rate during peaks

### 3.3 Booking Seat Hold (Recommended for Production)

Use 3 states instead of 2:

```
AVAILABLE → HELD (30 sec) → BOOKED
         ↓
      AVAILABLE (timeout)
```

**Benefits:**
- Prevents overselling during payment
- Reduces contention on same seats
- Better UX (users can complete payment)

```javascript
// 1. Hold seats (30-second reservation)
UPDATE seats SET status='HELD', held_by_user=$1, held_until=NOW()+30s
WHERE show_id=$2 AND seat_number=ANY($3) AND status='AVAILABLE';

// 2. User completes payment → Mark as BOOKED
UPDATE seats SET status='BOOKED', held_by_user=NULL
WHERE id=ANY($1);

// 3. Cron job every 10s: Release expired holds
UPDATE seats SET status='AVAILABLE', held_by_user=NULL
WHERE status='HELD' AND held_until < NOW();
```

### 3.4 Message Queue for Async Operations

**Problem:** Synchronous booking API slows down under traffic

**Solution:** Asynchronous booking with message queue

```
Client
  │
  ├─→ Reserve seats (sync) → return temporary booking ID
  │
  ├─→ POST booking to queue (async)
  │
  └─→ Poll /bookings/{id} for status

Queue Consumer
  │
  ├─→ Dequeue booking
  ├─→ Update seats to BOOKED
  ├─→ Update booking status → CONFIRMED
  └─→ Trigger email notification
```

**Queue Implementation:**
- **RabbitMQ:** Traditional, durable, persistent
- **Apache Kafka:** High-throughput, event streaming
- **AWS SQS:** Managed, simple

---

## 4. Caching Strategy

### 4.1 Redis Cache Layers

#### Layer 1: Show List Cache
```javascript
// Cache show list for 5 minutes
const showsCacheKey = "shows:list";
const TTL = 300; // 5 minutes

// GET /shows
async getShows() {
  let shows = await redis.get(showsCacheKey);
  if (!shows) {
    shows = await db.query(`SELECT * FROM shows ORDER BY start_time`);
    await redis.setex(showsCacheKey, TTL, JSON.stringify(shows));
  }
  return JSON.parse(shows);
}

// Invalidate on new show creation
app.post("/admin/shows", async (req, res) => {
  // ... create show ...
  await redis.del(showsCacheKey); // Invalidate cache
});
```

#### Layer 2: Show Seat Availability Cache
```javascript
// Cache seat counts per show (updated every 10 sec)
const seatsCacheKey = `show:${showId}:seats`;
const TTL = 10;

async getShowSeats(showId) {
  let seats = await redis.get(seatsCacheKey);
  if (!seats) {
    seats = await db.query(
      `SELECT status, COUNT(*) as count FROM seats 
       WHERE show_id = $1 GROUP BY status`,
      [showId]
    );
    await redis.setex(seatsCacheKey, TTL, JSON.stringify(seats));
  }
  return JSON.parse(seats);
}

// Invalidate on every booking
app.post("/shows/:id/book", async (req, res) => {
  // ... book seats ...
  await redis.del(`show:${showId}:seats`); // Invalidate
});
```

#### Layer 3: Session Cache
```javascript
// Store user session data
const sessionKey = `session:${userId}`;
await redis.setex(sessionKey, 3600, JSON.stringify({
  userId,
  selectedSeats: [...],
  showId: ...
}));
```

### 4.2 Cache Invalidation Patterns

| Pattern | Use Case | Pro | Con |
|---------|----------|-----|-----|
| **TTL-based** | Show availability | Simple, eventual consistency | Stale data briefly |
| **Event-based** | Bookings made | Always fresh | Complex, requires events |
| **Lazy-load** | Rarely accessed | Low cost | First access slow |
| **Write-through** | Critical data | Always consistent | Dual writes |

**Recommended:** Event-based invalidation via message queue
```
Booking API → POST to queue → Update DB → Invalidate Redis → Respond
```

---

## 5. API Design for Scale

### 5.1 Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");

// Per-user rate limit
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  keyGenerator: (req) => req.user.id, // Per user ID
  handler: (req, res) => {
    res.status(429).json({ error: "Too many booking attempts" });
  },
});

app.post("/shows/:id/book", bookingLimiter, bookSeats);
```

### 5.2 Circuit Breaker Pattern

Fail gracefully when DB is overloaded:

```javascript
const CircuitBreaker = require("opossum");

const db = new CircuitBreaker(async (query) => {
  return pool.query(query);
}, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});

db.fallback(() => {
  return { seats: "cached_data" }; // Return cache on failure
});
```

### 5.3 Request Validation & Schema

```javascript
const Joi = require("joi");

const bookingSchema = Joi.object({
  seatNumbers: Joi.array()
    .items(Joi.string().pattern(/^[A-Z]\d+$/))
    .min(1)
    .max(10)
    .required(),
});

app.post("/shows/:id/book", (req, res, next) => {
  const { error, value } = bookingSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details });
  }
  next();
});
```

---

## 6. Monitoring & Observability

### 6.1 Metrics to Track

```javascript
const prometheus = require("prom-client");

// Request latency
const httpDuration = new prometheus.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
});

// Database query latency
const dbDuration = new prometheus.Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of DB queries in seconds",
  labelNames: ["query_type"],
});

// Booking success rate
const bookingCounter = new prometheus.Counter({
  name: "bookings_total",
  help: "Total bookings (success/failure)",
  labelNames: ["status"],
});
```

### 6.2 Alerting

```yaml
# Prometheus alerts
- alert: HighBookingFailureRate
  expr: rate(bookings_total{status="FAILED"}[5m]) > 0.05
  for: 5m
  annotations:
    summary: "5% of bookings failing"

- alert: DBConnectionPoolExhausted
  expr: pg_stat_activity_count > 90
  for: 2m
  annotations:
    summary: "DB connection pool 90% utilized"

- alert: HighCacheEvictionRate
  expr: redis_evicted_keys_total > 1000
  for: 5m
  annotations:
    summary: "Redis cache thrashing"
```

### 6.3 Logging

```javascript
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Structured logging
logger.info("Booking created", {
  bookingId: 123,
  showId: 1,
  seats: ["A1", "A2"],
  timestamp: new Date(),
});
```

---

## 7. Deployment & DevOps

### 7.1 Containerization (Docker)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "server.js"]
```

### 7.2 Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: booking-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: booking-backend
  template:
    metadata:
      labels:
        app: booking-backend
    spec:
      containers:
      - name: backend
        image: modex/booking-backend:1.0
        ports:
        - containerPort: 4000
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-config
              key: host
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 10
          periodSeconds: 10
```

### 7.3 CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy

on: [push]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Build Docker image
      run: docker build -t modex/booking-backend:${{ github.sha }} .
    
    - name: Push to registry
      run: docker push modex/booking-backend:${{ github.sha }}
    
    - name: Deploy to K8s
      run: |
        kubectl set image deployment/booking-backend \
          backend=modex/booking-backend:${{ github.sha }}
        kubectl rollout status deployment/booking-backend
```

---

## 8. Load Capacity Estimates

### Assumptions
- 4-core, 8GB RAM per app server
- PostgreSQL: 16-core, 64GB RAM
- Average response time: 200ms
- 30% cache hit rate

### Capacity
| Metric | Value |
|--------|-------|
| Reqs/sec per app server | 50 |
| Total app servers needed for 1K reqs/sec | 20 |
| Concurrent connections per DB | 500 |
| Read throughput per DB shard | 5K reqs/sec |
| Write throughput per DB shard | 500 reqs/sec |

### Scaling to 100K req/sec
- 100 app servers (horizontal auto-scaling)
- 10 DB shards (one primary + one replica each)
- 2 Redis clusters (session + cache)
- 2 RabbitMQ nodes (HA queue)
- Multi-region deployment (active-active)

---

## 9. Security Considerations

### 9.1 Authentication & Authorization

```javascript
const jwt = require("jsonwebtoken");

app.use((req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token && req.path === "/health") return next();
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  });
});
```

### 9.2 SQL Injection Prevention

Always use parameterized queries:
```javascript
// ✅ SAFE
await db.query("SELECT * FROM seats WHERE id = $1", [seatId]);

// ❌ UNSAFE
await db.query(`SELECT * FROM seats WHERE id = ${seatId}`);
```

### 9.3 Rate Limiting & DDoS Protection

- Use CloudFlare or AWS Shield for DDoS mitigation
- Implement per-IP and per-user rate limits
- Monitor suspicious patterns

### 9.4 Data Encryption

```javascript
// In transit
const https = require("https");
const fs = require("fs");

const options = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.cert"),
};

https.createServer(options, app).listen(443);

// At rest
const crypto = require("crypto");
const cipher = crypto.createCipher("aes192", password);
const encrypted = cipher.update("payment_data", "utf8", "hex");
```

---

## 10. Migration Path (MVP → Production)

### Phase 1: MVP (Current)
- Single Express server
- Single PostgreSQL instance
- Basic CRUD operations
- Goal: Test core business logic

### Phase 2: Stability (Month 1)
- Add CORS, error handling, validation
- Set up basic monitoring
- Implement Redis cache layer
- Deploy to AWS / GCP with auto-scaling

### Phase 3: Scale (Month 2-3)
- Implement database replication
- Add message queue for async operations
- Implement rate limiting
- Set up comprehensive monitoring

### Phase 4: High Availability (Month 4-6)
- Database sharding by show_id
- Multi-region deployment
- Optimize query performance
- Implement circuit breaker patterns

### Phase 5: Production Grade (Month 6+)
- Chaos engineering & resilience testing
- Advanced security (FIPS, PCI-DSS compliance if needed)
- Real-time seat updates (WebSocket)
- Machine learning for capacity prediction

---

## Conclusion

By following this roadmap, the Modex Ticket Booking System can scale from handling 100 concurrent users to supporting 100K+ concurrent bookings per second while maintaining data consistency, low latency, and high availability.

**Key Takeaways:**
1. **Transactions & Locking** prevent race conditions at application level
2. **Database Sharding** enables horizontal scaling
3. **Caching & Message Queues** decouple write-heavy operations
4. **Monitoring & Alerting** ensure reliability at scale
5. **Containerization & Orchestration** simplify deployment

---

**Last Updated:** December 2024  
**Author:** Modex Assessment Team
