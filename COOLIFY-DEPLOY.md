# Quick Start: Deploy Tasky to Coolify

## Files Created

✅ `docker-compose.yml` - Production Docker Compose stack
✅ `packages/web/Dockerfile` - Web app build and serve
✅ `packages/server/Dockerfile` - Updated with frozen-lockfile
✅ `.env.example` - Environment variable template
✅ `DEPLOYMENT.md` - Full deployment guide

## Quick Deploy Steps

### 1. Generate Security Key
```bash
openssl rand -base64 32
```

### 2. Get Tailscale IP
```bash
tailscale ip
```

### 3. In Coolify Dashboard

**Create New Resource:**
- Type: Docker Compose
- Name: `tasky`
- Connect GitHub repo
- Docker Compose File: `docker-compose.yml`
- Location: `/` (root)

**Set Environment Variables:**
```
SESSION_BACKEND_KEY=<your-generated-key>
YSWEET_CLIENT_URL=ws://<your-tailscale-ip>:8091
DOCUMENT_ID=tasky-main
```

**Deploy!**

### 4. Access Services

After deployment, access via Tailscale IP:
- Web: `http://<tailscale-ip>:<port>`
- Token: `http://<tailscale-ip>:8092/token`

### 5. Configure App

1. Open web app
2. Settings → Enable sync
3. Enter: `http://<tailscale-ip>:8092/token`
4. Save

## What Gets Deployed

- **y-sweet**: Official Docker image (port 8091)
- **token-server**: Built from `packages/server/Dockerfile` (port 8092)
- **web**: Built from `packages/web/Dockerfile` (port 80)

All services communicate via Docker network `tasky-network`.

## Updates

Just push to GitHub - Coolify auto-deploys!

```bash
git add .
git commit -m "Update app"
git push origin main
```

See `DEPLOYMENT.md` for detailed instructions.

