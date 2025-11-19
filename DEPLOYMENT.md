# Tasky Deployment Guide

This guide covers deploying Tasky with Docker Compose, with specific instructions for Coolify and general VPS deployments.

## Prerequisites

- Docker and Docker Compose installed
- (Optional) Coolify for automated deployments
- (Optional) Tailscale for private network access
- GitHub repository connected (for Coolify)

## Critical: CORS Configuration

**NEW in quality-2025-11-18**: The token server now enforces CORS restrictions for security.

### Required Environment Variable

You **MUST** set `ALLOWED_ORIGINS` to include your frontend domain(s):

```bash
# For Coolify/Tailscale (internal network)
ALLOWED_ORIGINS=http://100.x.x.x:8090,http://your-tailscale-ip:8090

# For public deployment
ALLOWED_ORIGINS=https://tasky.yourdomain.com,https://www.tasky.yourdomain.com

# For development + production
ALLOWED_ORIGINS=http://localhost:8090,https://tasky.yourdomain.com
```

**Important**: Origins must match exactly (include protocol, no trailing slash).

## Environment Variables

### Required Variables

Set these in Coolify's environment variables section or your `.env` file:

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

### Get Your Tailscale IP

```bash
tailscale ip
# Returns something like: 100.x.x.x
```

Then set:
```
YSWEET_CLIENT_URL=ws://100.x.x.x:8091
```

## Deployment Steps

### 1. Create Docker Compose Stack in Coolify

1. Go to Coolify dashboard
2. Click "New Resource" → "Docker Compose"
3. Name it: `tasky`
4. Connect your GitHub repository
5. Set branch: `main` (or your preferred branch)

### 2. Configure Stack

- **Docker Compose File**: `docker-compose.yml`
- **Docker Compose File Location**: `/` (root of repo)

### 3. Set Environment Variables

**CRITICAL**: Add these environment variables in Coolify's UI:

1. `ALLOWED_ORIGINS` - Your frontend URL (e.g., `http://100.x.x.x:8090`)
2. `SESSION_BACKEND_KEY` - Generated secure key
3. `DOCUMENT_ID` - Optional, defaults to `tasky-main`

### 4. Deploy

Click "Deploy" and watch the build logs. Coolify will:
- Build the web app (takes ~2-3 minutes)
- Build the token server
- Pull Y-Sweet image
- Start all services

### 5. Access Your Services

After deployment, Coolify will show you the ports. Access via your Tailscale IP:

- **Web App**: `http://your-tailscale-ip:port` (usually port 80 or Coolify-assigned)
- **Token Server**: `http://your-tailscale-ip:8092/token`
- **Y-Sweet**: `ws://your-tailscale-ip:8091`

## Configure Tasky App

1. Open the web app in your browser
2. Click the settings icon (sliders) in the sidebar
3. Toggle "Enable sync" ON
4. Enter token server URL: `http://your-tailscale-ip:8092/token`
5. Click Save
6. Connection status should show "Connected"

## Troubleshooting

### Services won't start

- Check Coolify logs for each service
- Verify environment variables are set correctly
- Ensure Tailscale IP is correct

### Web app shows 404

- Check that nginx is serving files correctly
- Verify build completed successfully
- Check nginx logs in Coolify

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

- Coolify will auto-assign ports if conflicts occur
- Update YSWEET_CLIENT_URL with correct port if changed

## Updating Deployment

Simply push to your GitHub repository:

```bash
git add .
git commit -m "Update app"
git push origin main
```

Coolify will automatically detect the push and redeploy.

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
- [ ] Set all environment variables in Coolify
- [ ] Verified Tailscale IP or domain name
- [ ] Tested web app loads correctly
- [ ] **Verified no CORS errors in browser console**
- [ ] Tested sync between devices
- [ ] Verified data persists after restart
- [ ] Set up backups (optional but recommended)

## Quick Deployment Commands

### For Coolify (with Tailscale)

```bash
# After getting your Coolify-assigned port (check Coolify UI)
# Set environment variable:
ALLOWED_ORIGINS=http://100.x.x.x:PORT

# Where PORT is the Coolify-assigned port for the web service
```

### For VPS (Docker Compose)

```bash
# 1. Clone repo
git clone https://github.com/djquan/tasky.git
cd tasky
git checkout quality-2025-11-18

# 2. Create .env file
cat > .env <<EOF
ALLOWED_ORIGINS=http://your-server-ip:8090
SESSION_BACKEND_KEY=$(openssl rand -base64 32)
DOCUMENT_ID=tasky-main
EOF

# 3. Start services
docker-compose up -d

# 4. Check logs
docker-compose logs -f

# 5. Access at http://your-server-ip:8090
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

