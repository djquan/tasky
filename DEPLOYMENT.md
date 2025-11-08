# Tasky Deployment Guide for Coolify

## Prerequisites

1. Coolify installed and running
2. Tailscale configured on your server
3. GitHub repository connected to Coolify

## Environment Variables

Set these in Coolify's environment variables section:

```
SESSION_BACKEND_KEY=<generate-with-openssl-rand-base64-32>
YSWEET_CLIENT_URL=ws://your-tailscale-ip:8080
DOCUMENT_ID=tasky-main
```

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
YSWEET_CLIENT_URL=ws://100.x.x.x:8080
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

Add all three environment variables listed above in Coolify's UI.

### 4. Deploy

Click "Deploy" and watch the build logs. Coolify will:
- Build the web app (takes ~2-3 minutes)
- Build the token server
- Pull Y-Sweet image
- Start all services

### 5. Access Your Services

After deployment, Coolify will show you the ports. Access via your Tailscale IP:

- **Web App**: `http://your-tailscale-ip:port` (usually port 80 or Coolify-assigned)
- **Token Server**: `http://your-tailscale-ip:3001/token`
- **Y-Sweet**: `ws://your-tailscale-ip:8080`

## Configure Tasky App

1. Open the web app in your browser
2. Click the settings icon (sliders) in the sidebar
3. Toggle "Enable sync" ON
4. Enter token server URL: `http://your-tailscale-ip:3001/token`
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

- Verify YSWEET_CLIENT_URL matches your Tailscale IP
- Check token server logs
- Ensure Y-Sweet service is running
- Verify SESSION_BACKEND_KEY is set

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
- [ ] Set all environment variables in Coolify
- [ ] Verified Tailscale IP
- [ ] Tested web app loads correctly
- [ ] Tested sync between devices
- [ ] Verified data persists after restart
- [ ] Set up backups (optional but recommended)

