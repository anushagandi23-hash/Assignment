# Deployment Guide - Modex Ticket Booking System

This guide covers deploying the complete Modex system to production.

## 🚀 Quick Deployment Options

### Option 1: Docker Compose (Recommended for Testing)

Perfect for local development, staging, or single-server deployment.

```bash
# 1. Clone/Download the repository
cd modex-ticket

# 2. Deploy with docker-compose
docker-compose up -d

# 3. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
# Database: PostgreSQL on localhost:5432
```

Stop services:
```bash
docker-compose down
```

View logs:
```bash
docker-compose logs -f backend  # Backend logs
docker-compose logs -f frontend # Frontend logs
docker-compose logs -f postgres # Database logs
```

### Option 2: Traditional Server Setup

For servers without Docker support.

**Prerequisites:**
- Node.js v16+
- PostgreSQL 12+
- npm/yarn

**Step 1: Setup Database**
```bash
# On server with PostgreSQL
createdb modex_ticket
```

**Step 2: Deploy Backend**
```bash
cd /var/www/modex/backend

# Install dependencies
npm ci --only=production

# Create .env file
cat > .env << EOF
PORT=4000
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=modex_ticket
NODE_ENV=production
EOF

# Start with process manager (PM2)
npm install -g pm2
pm2 start server.js --name modex-backend
pm2 save
pm2 startup
```

**Step 3: Deploy Frontend**
```bash
cd /var/www/modex/frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Serve with nginx
sudo cp /path/to/nginx.conf /etc/nginx/sites-available/modex
sudo ln -s /etc/nginx/sites-available/modex /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

**Step 4: Setup Nginx Reverse Proxy**
```bash
sudo cat > /etc/nginx/sites-available/modex << 'EOF'
upstream backend {
    server localhost:4000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/modex/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SSL (use Let's Encrypt)
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
EOF

# Enable and reload
sudo systemctl reload nginx
```

### Option 3: Cloud Platform Deployment

#### Heroku (Backend)
```bash
cd backend

# Login to Heroku
heroku login

# Create app
heroku create modex-booking

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main

# View logs
heroku logs -t
```

#### Vercel (Frontend)
```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variable in Vercel dashboard
# VITE_API_URL=https://modex-booking.herokuapp.com/api
```

#### Railway.app (Full Stack - Recommended)

Railway supports both frontend and backend with free tier:

1. **Create account** at https://railway.app
2. **Connect GitHub** repository
3. **Create two services:**
   - Backend: `cd backend && npm install && npm start`
   - Frontend: `cd frontend && npm run build && npm start`
4. **Add PostgreSQL** plugin
5. **Set environment variables:**
   - Backend: DB credentials from Railway PostgreSQL
   - Frontend: `VITE_API_URL` pointing to backend URL

#### AWS Deployment

**Backend (EC2 + RDS)**:
```bash
# 1. Launch EC2 instance (t3.micro for free tier)
# 2. Create RDS PostgreSQL database
# 3. SSH into EC2 and deploy backend (like "Traditional Setup" above)
# 4. Update backend .env with RDS endpoint
```

**Frontend (S3 + CloudFront)**:
```bash
# 1. Build frontend
cd frontend && npm run build

# 2. Upload dist/ to S3
aws s3 sync dist/ s3://modex-ticket-frontend

# 3. Create CloudFront distribution
# 4. Configure API origin to backend ELB
```

### Option 4: Google Cloud (GCP)

**Backend (Cloud Run)**:
```bash
cd backend

# Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/modex-backend

# Deploy
gcloud run deploy modex-backend \
  --image gcr.io/PROJECT_ID/modex-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars=DB_HOST=CLOUD_SQL_IP,DB_USER=postgres,DB_PASSWORD=***
```

**Frontend (Cloud Storage + Cloud CDN)**:
```bash
cd frontend
npm run build

# Upload to Cloud Storage
gsutil -m cp -r dist/* gs://modex-ticket-frontend/
```

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured (.env files)
- [ ] Database created and initialized
- [ ] Backend build succeeds (`npm run build` - if applicable)
- [ ] Frontend build succeeds (`npm run build`)
- [ ] No hardcoded localhost URLs
- [ ] CORS configured for frontend domain
- [ ] Database backups configured
- [ ] SSL/TLS certificates obtained
- [ ] Firewall rules configured
- [ ] Monitoring and logging setup
- [ ] Rate limiting configured

## 🔒 Security Configuration

### Environment Variables
**Never commit `.env` files!** Use `.env.example`:

```bash
# backend/.env.example
PORT=4000
DB_USER=postgres
DB_PASSWORD=CHANGE_ME
DB_HOST=prod-db-host
DB_PORT=5432
DB_NAME=modex_ticket
NODE_ENV=production
```

### Database Security
```bash
# Create restricted database user
psql postgres

CREATE USER app_user WITH PASSWORD 'strong_password_here';
GRANT CONNECT ON DATABASE modex_ticket TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

### HTTPS/SSL
```bash
# Using Let's Encrypt with Certbot
sudo apt-get install certbot python3-certbot-nginx

# Issue certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## 📊 Monitoring & Logging

### Application Monitoring (Prometheus + Grafana)
```bash
# Install Prometheus
docker run -d -p 9090:9090 \
  -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Install Grafana
docker run -d -p 3001:3000 grafana/grafana
```

### Log Aggregation (ELK Stack)
```bash
# Elasticsearch
docker run -d -p 9200:9200 docker.elastic.co/elasticsearch/elasticsearch:latest

# Kibana
docker run -d -p 5601:5601 docker.elastic.co/kibana/kibana:latest

# Ship logs from application
npm install --save winston elasticsearch
```

### Error Tracking (Sentry)
```bash
# Install Sentry SDK
npm install --save @sentry/node

# Configure in app
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });
```

## 🔄 Continuous Deployment (CI/CD)

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Add your deployment commands here
          # Example: Deploy to Railway, Heroku, or custom server
```

### GitLab CI/CD Example
```yaml
# .gitlab-ci.yml
deploy:
  stage: deploy
  script:
    - npm ci
    - npm run build
    # Deploy commands
  only:
    - main
```

## 📈 Scaling Strategy

### Phase 1: Single Server (MVP)
- Docker Compose on single server
- PostgreSQL on same server
- Good for: 100-1000 users

### Phase 2: Separate Services
- Backend on app server
- Database on separate RDS/managed service
- Frontend on CDN
- Good for: 1K-10K users

### Phase 3: Load Balanced
- Multiple backend instances
- Load balancer (nginx, HAProxy)
- Database replication
- Redis cache layer
- Good for: 10K-100K users

### Phase 4: Microservices
- Database sharding
- Kubernetes orchestration
- Message queues
- Multi-region deployment
- Good for: 100K+ users

See `TECHNICAL_DESIGN.md` for detailed scaling strategies.

## 🚨 Troubleshooting Deployment

### Backend won't start
```bash
# Check environment variables
env | grep DB_

# Check database connection
psql -U postgres -h DB_HOST -d modex_ticket -c "SELECT 1"

# Check logs
docker logs modex-backend
```

### Frontend shows blank page
```bash
# Verify build succeeded
ls dist/index.html  # Should exist

# Check API URL in .env
VITE_API_URL=https://api.your-domain.com

# Verify CORS headers
curl -H "Origin: https://your-domain.com" http://api.your-domain.com/health -v
```

### Database connection timeouts
```bash
# Check network access
telnet DB_HOST 5432

# Check database is running
psql postgres -c "SELECT version()"

# Increase connection pool size if needed
# In db.js: max: 50
```

### High memory usage
```bash
# Check Node.js memory limit
node --max-old-space-size=2048 server.js

# Monitor with
npm install -g pm2
pm2 monit
```

## 📊 Performance Optimization

### Database
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM bookings WHERE show_id = 1;

-- Vacuum database
VACUUM ANALYZE;

-- Monitor slow queries
SET log_min_duration_statement = 1000;  -- Log queries >1s
```

### Backend
```javascript
// Enable compression
const compression = require('compression');
app.use(compression());

// Connection pooling
const pool = new Pool({ max: 20 });

// Caching headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600');
  next();
});
```

### Frontend
```bash
# Minification and tree-shaking
npm run build  # Vite handles this automatically

# Analyze bundle size
npm install -g analyze-bundle
analyze-bundle dist/
```

## 🔐 Regular Maintenance

### Backups
```bash
# Daily PostgreSQL backup
0 2 * * * pg_dump modex_ticket > /backups/modex_$(date +\%Y\%m\%d).sql

# Upload to S3
0 3 * * * aws s3 cp /backups/ s3://modex-backups/
```

### Updates
```bash
# Check for security updates
npm audit

# Update dependencies safely
npm update

# Test after updates
npm run build && npm test
```

### Monitoring
```bash
# Health checks every 5 minutes
*/5 * * * * curl -f http://localhost:4000/health || alert

# Uptime monitoring
# Use Uptime Robot (free tier available)
```

## 📚 Additional Resources

- Backend README: `backend/README.md`
- Frontend README: `frontend/README.md`
- Technical Design: `TECHNICAL_DESIGN.md`
- Quick Start: `QUICK_START.md`

## 🆘 Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connection
4. Check network/firewall rules
5. Review security settings

---

**Recommended Hosting for This Project:**

1. **Development/Testing**: Docker Compose locally
2. **Staging**: Railway.app (free tier)
3. **Production**: 
   - **Option A**: AWS (EC2 + RDS + CloudFront)
   - **Option B**: Google Cloud (Cloud Run + Cloud SQL)
   - **Option C**: Heroku + Vercel (simpler, easier management)
   - **Option D**: DigitalOcean (App Platform or Droplets)

---

**Deployment Completed**: ✅ Ready for production
**Last Updated**: December 6, 2024
