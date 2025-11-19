# Tasky Deployment Guide

This guide covers deploying Tasky with Docker Compose on any server or VPS.

## Prerequisites

- Docker and Docker Compose installed
- A server or VPS (DigitalOcean, AWS, Hetzner, etc.)
- (Optional) Domain name for public access
- (Optional) Reverse proxy (nginx, Caddy) for SSL/HTTPS

## Critical: CORS Configuration

**NEW in quality-2025-11-18**: The token server now enforces CORS restrictions for security.

### Required Environment Variable

You **MUST** set `ALLOWED_ORIGINS` to include your frontend domain(s):

```bash
# For local/private network deployment
ALLOWED_ORIGINS=http://192.168.1.100:8090,http://your-server-ip:8090

# For public deployment with domain
ALLOWED_ORIGINS=https://tasky.yourdomain.com,https://www.tasky.yourdomain.com

# For development + production
ALLOWED_ORIGINS=http://localhost:8090,https://tasky.yourdomain.com
```

**Important**: Origins must match exactly (include protocol, no trailing slash).

## Environment Variables

### Required Variables

Set these in your `.env` file or environment:

```bash
# CRITICAL: Allowed frontend origins for CORS
ALLOWED_ORIGINS=http://your-frontend-url:port

# Session security key
SESSION_BACKEND_KEY=<generate-with-openssl-rand-base64-32>

# Optional: Document ID
DOCUMENT_ID=tasky-main
```

### Legacy Variables (No longer needed)

~~`YSWEET_CLIENT_URL`~~ - No longer required, handled internally

### Generate Secure Key

```bash
openssl rand -base64 32
```

## Quick Start Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/djquan/tasky.git
cd tasky
git checkout main
```

### 2. Create Environment File

```bash
cat > .env <<EOF
ALLOWED_ORIGINS=http://your-server-ip:8090
SESSION_BACKEND_KEY=$(openssl rand -base64 32)
DOCUMENT_ID=tasky-main
EOF
```

**Important**: Replace `your-server-ip` with your actual server IP address or domain.

### 3. Start Services

```bash
docker-compose up -d
```

This will:

- Build the web app (takes ~2-3 minutes)
- Build the token server
- Pull Y-Sweet image
- Start all services

### 4. Verify Services Are Running

```bash
docker-compose ps
```

All services should show as "Up".

### 5. Access Your Application

Services will be available at:

- **Web App**: `http://your-server-ip:8090`
- **Sync Server** (nginx proxy): `http://your-server-ip:8093`

### Architecture

- `web` (port 8090): React PWA frontend
- `nginx` (port 8093): Reverse proxy that routes:
  - `/token` → token-server (generates Y-Sweet client tokens)
  - `/` → y-sweet (WebSocket sync server)
- `token-server` (internal): Token generation
- `y-sweet` (internal): CRDT sync server

## Configure Sync (Optional)

Sync is **disabled by default**. The app works perfectly as a local-first PWA without any configuration.

To enable multi-device sync:

1. Open the web app in your browser: `http://your-server-ip:8090`
2. Click the settings icon (sliders) in the sidebar
3. Toggle "Enable sync" to ON
4. **Enter the sync URL**: `http://your-server-ip:8093`
   - This points to the nginx proxy that routes to both token-server and y-sweet
   - The app will automatically append `/token` when fetching tokens
5. Click Save
6. Connection status should show "Connected"

**Important**: The sync URL must point to port 8093 (nginx), not 8090 (web app)

## Troubleshooting

### Services won't start

```bash
# Check service status
docker-compose ps

# View logs for all services
docker-compose logs

# View logs for specific service
docker-compose logs web
docker-compose logs token-server
docker-compose logs y-sweet
```

Common issues:

- Port 8090 already in use (change in docker-compose.yml)
- Environment variables not set correctly
- Docker not running or insufficient permissions

### Web app shows 404

```bash
# Check nginx is serving files
docker-compose logs web

# Rebuild if needed
docker-compose up -d --build web
```

Verify:

- Build completed successfully (check logs during startup)
- Web container is running: `docker-compose ps web`

### Sync not working

**First, check for CORS errors** (most common issue):

1. Open browser DevTools console (F12)
2. Look for CORS-related errors like:

   ```
   Access to fetch at 'http://...' has been blocked by CORS policy
   ```

3. If you see CORS errors:
   - Verify `ALLOWED_ORIGINS` is set in environment variables
   - Ensure your frontend URL matches exactly (check protocol: http vs https)
   - Include port number if not standard (80/443)
   - Restart services after changing environment variables:

     ```bash
     docker-compose restart token-server
     ```

**Other sync issues**:

- Check token server logs: `docker-compose logs token-server`
- Ensure Y-Sweet service is running: `docker-compose ps`
- Verify SESSION_BACKEND_KEY is set
- Test token endpoint manually:

  ```bash
  curl -H "Origin: http://your-frontend-url" http://your-server:8093/token
  # Should return: {"clientToken":"..."}
  ```

### Port conflicts

If port 8090 is already in use:

```bash
# Edit docker-compose.yml
# Change the web service port mapping:
# ports:
#   - "8091:80"  # Changed from 8090 to 8091

# Update ALLOWED_ORIGINS in .env:
ALLOWED_ORIGINS=http://your-server-ip:8091

# Restart services
docker-compose down
docker-compose up -d
```

## Updating Deployment

To update to the latest version:

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose up -d --build

# View logs to verify
docker-compose logs -f
```

## Data Persistence

Y-Sweet data is stored in a Docker volume (`y-sweet-data`). This persists across deployments.

To backup:

```bash
# SSH into your server
docker run --rm -v tasky_y-sweet-data:/data \
  -v $(pwd):/backup alpine \
  tar czf /backup/y-sweet-backup.tar.gz -C /data .
```

## Production Checklist

- [ ] Generated secure SESSION_BACKEND_KEY
- [ ] **Set ALLOWED_ORIGINS with your frontend URL(s)**
- [ ] Created `.env` file with all required variables
- [ ] Verified server IP or domain name
- [ ] Tested web app loads correctly
- [ ] **Verified no CORS errors in browser console (F12)**
- [ ] Tested sync between devices
- [ ] Verified data persists after restart
- [ ] Set up backups (optional but recommended)
- [ ] (Optional) Configured reverse proxy for HTTPS
- [ ] (Optional) Set up monitoring/uptime checks

## Production Deployment with HTTPS

For production use with a domain name and SSL:

### 1. Point Domains to Server

Add A records in your DNS:

```
A    tasky.yourdomain.com     →  your-server-ip  (web app)
A    sync.tasky.yourdomain.com →  your-server-ip  (sync server)
```

### 2. Update Environment

```bash
# Update ALLOWED_ORIGINS for HTTPS (must match web app URL)
ALLOWED_ORIGINS=https://tasky.yourdomain.com

# Restart to apply
docker-compose restart token-server
```

### 3. Setup Reverse Proxy (Caddy - Recommended)

Install Caddy on your host machine:

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Create Caddyfile
sudo nano /etc/caddy/Caddyfile
```

Add to Caddyfile:

```
# Web app
tasky.yourdomain.com {
    reverse_proxy localhost:8090
}

# Sync server
sync.tasky.yourdomain.com {
    reverse_proxy localhost:8093
}
```

```bash
# Restart Caddy (automatic HTTPS!)
sudo systemctl restart caddy
```

### 4. Configure App

In Tasky settings, set sync URL to: `https://sync.tasky.yourdomain.com`

### Alternative: nginx with Let's Encrypt

```bash
# Install nginx and certbot
sudo apt install nginx certbot python3-certbot-nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/tasky
```

Add:

```nginx
# Web app
server {
    listen 80;
    server_name tasky.yourdomain.com;

    location / {
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Sync server (with WebSocket support)
server {
    listen 80;
    server_name sync.tasky.yourdomain.com;

    location / {
        proxy_pass http://localhost:8093;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/tasky /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificates
sudo certbot --nginx -d tasky.yourdomain.com -d sync.tasky.yourdomain.com
```

### Testing CORS Configuration

```bash
# Test that CORS is configured correctly
curl -H "Origin: http://your-frontend-url" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://your-server:8093/token

# Should see:
# Access-Control-Allow-Origin: http://your-frontend-url
```
