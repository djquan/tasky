# Tasky Backend - Unified Deployment

This is a simplified backend architecture that consolidates Y-Sweet sync server, token server, and nginx reverse proxy into a single Docker Compose stack with **one entry point**.

## Architecture

```
Browser                     Docker Compose Backend
   │                        ┌─────────────────────────┐
   │                        │                         │
   ├──→ :8080/token        │  nginx:8080             │
   │    (get auth token)    │    ↓                    │
   │                        │  token-server:8092      │
   │                        │    ↓                    │
   └──→ :8080/d/*/ws       │  y-sweet:8091           │
        (WebSocket sync)    │  (CRDT sync + storage)  │
                            │                         │
                            └─────────────────────────┘
```

**Single Port Entry Point:** Port 8080 (configurable via `BACKEND_PORT`)

**Endpoints:**
- `GET /token` - Generate Y-Sweet auth token (proxied to token-server)
- `WS /d/<doc-id>/ws` - WebSocket connection for CRDT sync (proxied to Y-Sweet)
- `GET /health` - Health check endpoint
- `GET /` - API information

## Quick Start

### Development (localhost)

```bash
# Start all backend services
docker compose -f docker-compose-backend.yaml up -d

# View logs
docker compose -f docker-compose-backend.yaml logs -f

# Stop services
docker compose -f docker-compose-backend.yaml down
```

Backend will be available at: `http://localhost:8080`

### Production (Tailscale)

1. **Set environment variables:**

   Create `.env` file or export in your shell:

   ```bash
   # Backend listening port (default: 8080)
   BACKEND_PORT=8080

   # Y-Sweet session key (generate with: openssl rand -base64 32)
   SESSION_BACKEND_KEY=your-secure-key-here

   # Document ID (optional, default: tasky-main)
   DOCUMENT_ID=tasky-main
   ```

2. **Start backend:**

   ```bash
   docker compose -f docker-compose-backend.yaml up -d
   ```

3. **Configure web app:**

   In your web app settings:
   - Enable sync: `true`
   - Backend URL: `http://100.64.x.x:8080` (replace with your Tailscale IP)

   The **client automatically handles everything**:
   - Appends `/token` to fetch connection details
   - Constructs WebSocket URL from the same base

   For example, Backend URL `http://100.64.x.x:8080` becomes:
   - Token endpoint: `http://100.64.x.x:8080/token`
   - WebSocket: `ws://100.64.x.x:8080/d/tasky-main/ws`

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | `8080` | External port for nginx entry point |
| `SESSION_BACKEND_KEY` | (dev key) | Y-Sweet session encryption key |
| `DOCUMENT_ID` | `tasky-main` | Y-Sweet document identifier |

**Note:** No URL configuration needed! The client automatically derives the WebSocket URL from the token endpoint URL.

### Adding SSL/HTTPS (Future)

With nginx as a single entry point, adding SSL is straightforward:

1. **Add SSL certificates** to nginx container (volume mount)
2. **Update nginx.conf:**
   - Listen on port 443
   - Add SSL certificate paths
   - Redirect port 80 → 443
3. **Update YSWEET_CLIENT_URL** to use `wss://` instead of `ws://`

Example nginx SSL config:

```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;

    # ... rest of config
}
```

## Data Persistence

- **Y-Sweet data** is stored in Docker volume `y-sweet-data`
- To backup: `docker run --rm -v tasky_y-sweet-data:/data -v $(pwd):/backup alpine tar czf /backup/y-sweet-backup.tar.gz /data`
- To restore: `docker run --rm -v tasky_y-sweet-data:/data -v $(pwd):/backup alpine tar xzf /backup/y-sweet-backup.tar.gz -C /`

## Differences from Original Setup

### Before (3 services, 3 ports)

```yaml
services:
  y-sweet:        # Port 8091
  token-server:   # Port 8092
  web:            # Port 8090
```

**Browser connects to:**
- Web: `http://localhost:8090`
- Token: `http://localhost:8092/token`
- WebSocket: `ws://localhost:8091/d/tasky-main/ws`

### After (3 services, 1 port)

```yaml
services:
  y-sweet:        # Internal only
  token-server:   # Internal only
  nginx:          # Port 8080 (single entry point)
```

**Browser connects to:**
- Token: `http://localhost:8080/token`
- WebSocket: `ws://localhost:8080/d/tasky-main/ws`

(Web app runs separately or on a different host)

## Troubleshooting

**WebSocket connection fails:**
- Check nginx logs: `docker compose -f docker-compose-backend.yaml logs nginx`
- Verify `YSWEET_CLIENT_URL` matches your nginx external address
- Ensure port 8080 is accessible (check firewall/Tailscale ACLs)

**Token generation fails:**
- Check token-server logs: `docker compose -f docker-compose-backend.yaml logs token-server`
- Verify Y-Sweet is healthy: `curl http://localhost:8080/health`
- Check token-server can reach Y-Sweet: `docker compose -f docker-compose-backend.yaml exec token-server wget -O- http://y-sweet:8091/doc/new`

**Port conflicts:**
- Change `BACKEND_PORT` in `.env` or docker-compose.yaml
- Ensure no other service is using port 8080

## Health Checks

All services have health checks configured:

```bash
# Check overall stack health
docker compose -f docker-compose-backend.yaml ps

# Test endpoints manually
curl http://localhost:8080/health          # Should return "OK"
curl http://localhost:8080/                # Should return JSON with endpoints
curl http://localhost:8080/token           # Should return WebSocket URL + token
```

## Next Steps

- **Deploy to production:** Use Coolify/Docker Swarm/Kubernetes
- **Add SSL:** Mount certificates and update nginx.conf
- **Monitor:** Add Prometheus metrics to nginx
- **Scale:** Y-Sweet supports clustering for high availability
