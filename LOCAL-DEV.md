# Local Development Setup

## Quick Start

All services run in Docker Compose using the official Y-Sweet Docker image.

### Start All Services

```bash
docker-compose up -d
```

### Access Services

- **Web App**: <http://localhost:80>
- **Nginx Proxy** (recommended): <http://localhost:8093/token>
- **Token Server** (direct): <http://localhost:8092/token>
- **Y-Sweet** (direct): ws://localhost:8091

### Configure Tasky

1. Open <http://localhost:80>
2. Settings → Enable sync
3. Enter token URL: `http://localhost:8093/token` (nginx proxy - recommended)
   - Or use `http://localhost:8092/token` for direct token server access
4. Save

### View Logs

```bash
docker-compose logs -f
```

### Stop Services

```bash
docker-compose down
```

## Architecture

- **Y-Sweet**: Official Docker image (`ghcr.io/jamsocket/y-sweet:latest`) with `serve` command to expose HTTP management API
- **Token Server**: Generates Y-Sweet client tokens, connects to Y-Sweet via Docker network
- **Nginx Reverse Proxy**: Provides unified endpoint (port 8093) - routes `/token` to token server and WebSocket connections to Y-Sweet
- **Web App**: React PWA served via Nginx

All services communicate via the `tasky-network` Docker network. The nginx proxy simplifies configuration by providing a single endpoint (`http://localhost:8093/token`) that handles both token requests and WebSocket connections.
