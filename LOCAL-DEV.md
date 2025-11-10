# Local Development Setup

## Quick Start

All services run in Docker Compose using the official Y-Sweet Docker image.

### Start All Services

```bash
docker-compose up -d
```

### Access Services

- **Web App**: <http://localhost:80>
- **Token Server**: <http://localhost:8092/token>
- **Y-Sweet**: ws://localhost:8091

### Configure Tasky

1. Open <http://localhost:80>
2. Settings → Enable sync
3. Enter: `http://localhost:8092/token`
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
- **Web App**: React PWA served via Nginx

All services communicate via the `tasky-network` Docker network. The token server replaces internal Docker hostnames with client-accessible URLs (`localhost:8091`) when returning tokens to browsers.
