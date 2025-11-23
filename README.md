# Tasky

Local-first PWA todo app powered by CRDTs.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Features

- ✅ Offline-first architecture
- ✅ PWA - installable on desktop/mobile
- ✅ CRDT-based (Yjs) for conflict-free updates
- ✅ IndexedDB persistence
- ✅ Basic todo CRUD (add, edit, complete, delete)
- ✅ Multi-device sync (Y-Sweet) - optional, self-hosted

## Architecture

**Monorepo** (pnpm workspaces):

- `packages/web` - React PWA (Vite + Tailwind)
- `packages/shared` - Shared types/utils
- `packages/server` - Y-Sweet sync server (optional)

**Stack**: React, TypeScript, Vite, Tailwind, Yjs, IndexedDB, Y-Sweet

See [PLAN.md](./PLAN.md) for detailed architecture and roadmap.

## Requirements

- Node.js >= 25
- pnpm >= 10

## Project Structure

```
tasky/
├── packages/
│   ├── shared/          # Shared types and utilities
│   └── web/             # React PWA application
├── PLAN.md              # Detailed development plan
└── package.json         # Root package with workspace scripts
```

## Multi-Device Sync (Optional)

Tasky supports optional multi-device synchronization via Y-Sweet:

1. **Start sync server**:

   ```bash
   cd packages/server
   docker-compose up -d
   ```

2. **Enable sync in web app** (`packages/web/.env`):

   ```env
   VITE_SYNC_ENABLED=true
   VITE_YSWEET_URL=ws://localhost:1234
   VITE_YSWEET_TOKEN_URL=http://localhost:8092/token
   ```

3. **Restart dev server** - sync initializes automatically

See `packages/server/README.md` for detailed setup instructions.
