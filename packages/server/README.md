# Tasky Sync Server

Y-Sweet backend sync server for multi-device synchronization.

## Quick Start

### Manual Setup (Recommended for Development)

1. **Start Y-Sweet server** (in terminal 1):

   ```bash
   cd packages/server
   export SESSION_BACKEND_KEY="dev-key-change-in-production"
   npx -y y-sweet@latest serve
   ```

   This starts Y-Sweet on `http://localhost:8080` (management API) and `ws://localhost:8080` (WebSocket).

2. **Start token server** (in terminal 2):

   ```bash
   cd packages/server
   pnpm install
   export YSWEET_URL="http://localhost:8080"
   export YSWEET_CLIENT_URL="ws://localhost:8080"
   pnpm dev
   ```

### Using Docker Compose (Alternative)

```bash
# Start Y-Sweet server and token server
docker-compose up --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Note**: Docker setup may require additional Y-Sweet configuration.

## Configuration

Copy `.env.example` to `.env` and configure:

- `YSWEET_URL` - Y-Sweet server WebSocket URL (default: `ws://localhost:1234`)
- `PORT` - Token server HTTP port (default: `3001`)
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

- **Y-Sweet Server**: Handles WebSocket connections and document synchronization
- **Token Server**: Generates client tokens for document access (no auth required for single user)

