# Tasky Sync Server

Y-Sweet backend sync server for multi-device synchronization.

## Quick Start

### Using Docker Compose (Recommended)

The simplest way to run the sync backend is using Docker Compose with nginx as a reverse proxy. This provides a single endpoint for the web app to connect to:

```bash
cd packages/server
docker-compose up --build
```

This starts:
- **Y-Sweet server** (internal, port 8091)
- **Token server** (internal, port 8092)
- **Nginx reverse proxy** (port 8093) - **This is the only URL your web app needs!**

**Web App Configuration:**

In your web app settings, configure:
- **Token URL**: `http://localhost:8093/token`

That's it! Nginx handles routing:
- `/token` → Token server (for getting connection tokens)
- `/health` → Token server (health checks)
- WebSocket connections → Y-Sweet server (for document sync)

### Manual Setup (For Development)

If you prefer to run services manually without Docker:

1. **Start Y-Sweet server** (in terminal 1):

   ```bash
   cd packages/server
   export SESSION_BACKEND_KEY="dev-key-change-in-production"
   npx -y y-sweet@latest serve
   ```

   This starts Y-Sweet on `http://localhost:8091` (management API) and `ws://localhost:8091` (WebSocket).

2. **Start token server** (in terminal 2):

   ```bash
   cd packages/server
   pnpm install
   export YSWEET_URL="http://localhost:8091"
   export YSWEET_CLIENT_URL="ws://localhost:8091"
   pnpm dev
   ```

   **Web App Configuration**: Use `http://localhost:8092/token` as the token URL.

## Configuration

### Docker Compose Environment Variables

You can customize the Docker setup via environment variables:

```bash
# Set in your shell or .env file before running docker-compose
export YSWEET_CLIENT_URL=ws://localhost:8093  # WebSocket URL through nginx (default)
export DOCUMENT_ID=tasky-main                 # Document identifier (default)
```

### Manual Setup Environment Variables

For manual setup, configure:

- `YSWEET_URL` - Internal Y-Sweet server URL (default: `http://localhost:8091`)
- `YSWEET_CLIENT_URL` - Client-accessible Y-Sweet WebSocket URL (default: `ws://localhost:8091`)
- `PORT` - Token server HTTP port (default: `8092`)
- `DOCUMENT_ID` - Document identifier (default: `tasky-main`)

## Endpoints

- `GET /token` - Get Y-Sweet client token for document access
- `GET /health` - Health check endpoint

## Production Deployment

For production, configure S3-compatible storage:

1. Set `YSWEET_STORAGE_PATH=s3://your-bucket-name`
2. Configure AWS credentials via environment variables
3. Deploy using Docker Compose or your preferred container orchestration

## Architecture

The sync backend consists of three services:

- **Y-Sweet Server**: Handles WebSocket connections and document synchronization (CRDT-based)
- **Token Server**: Generates client tokens for document access (no auth required for single user)
- **Nginx Reverse Proxy**: Provides a single unified endpoint, routing:
  - HTTP requests (`/token`, `/health`) → Token server
  - WebSocket connections → Y-Sweet server

**Benefits of the nginx setup:**
- Web app only needs to know one URL (`http://localhost:8093/token`)
- Simplified configuration and deployment
- Single point of entry for all backend services
- Backward compatible (direct service ports still exposed for advanced use cases)

